import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const paidUntil = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000);

        await query(
          'UPDATE users SET plan = $1, paid_until = $2, stripe_subscription_id = $3 WHERE id = $4',
          ['plus', paidUntil, subscription.id, userId]
        );
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = (invoice as unknown as { subscription: string }).subscription;
        
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        const paidUntil = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000);

        await query(
          'UPDATE users SET plan = $1, paid_until = $2 WHERE stripe_subscription_id = $3',
          ['plus', paidUntil, subscriptionId]
        );
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        if (subscription.cancel_at_period_end || event.type === 'customer.subscription.deleted') {
          const now = new Date();
          const periodEnd = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000);
          
          if (now > periodEnd) {
            await query(
              'UPDATE users SET plan = $1, paid_until = NULL WHERE stripe_subscription_id = $2',
              ['free', subscription.id]
            );
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}

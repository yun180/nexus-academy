require('dotenv').config({ path: '.env.local' });
const Redis = require('ioredis');

async function testRedisTLSConnection() {
  console.log('Testing Redis TLS connection...');
  console.log('REDIS_URL:', process.env.REDIS_URL ? 'Set (Upstash TLS)' : 'Not set');
  
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  
  try {
    await redis.ping();
    console.log('✅ Redis PING successful');
    
    await redis.set('test-key', 'test-value');
    const value = await redis.get('test-key');
    console.log('✅ Redis SET/GET successful:', value);
    
    const { Queue } = require('bullmq');
    const testQueue = new Queue('test-queue', { connection: redis });
    
    const job = await testQueue.add('test-job', { data: 'test' });
    console.log('✅ BullMQ job creation successful:', job.id);
    
    await redis.del('test-key');
    await testQueue.close();
    await redis.quit();
    
    console.log('✅ All Redis TLS/BullMQ tests passed!');
  } catch (error) {
    console.error('❌ Redis TLS connection failed:', error.message);
    await redis.quit();
  }
}

testRedisTLSConnection();

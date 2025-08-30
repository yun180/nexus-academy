import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

const calendar = google.calendar('v3');

function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  return auth;
}

export interface CreateEventParams {
  title: string;
  start: string;
  end: string;
  attendees: Array<{ email: string; name?: string }>;
  description?: string;
}

export interface CreateEventResult {
  eventId: string;
  eventUrl: string;
  meetUrl?: string;
}

export async function createEvent(params: CreateEventParams): Promise<CreateEventResult> {
  try {
    const auth = getGoogleAuth();
    
    const event = {
      summary: params.title,
      description: params.description || 'NEXUS ACADEMY オンライン教室',
      start: {
        dateTime: params.start,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: params.end,
        timeZone: 'Asia/Tokyo',
      },
      attendees: params.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
      })),
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const createdEvent = response.data;
    const meetUrl = createdEvent.conferenceData?.entryPoints?.find(
      entry => entry.entryPointType === 'video'
    )?.uri || undefined;

    return {
      eventId: createdEvent.id!,
      eventUrl: createdEvent.htmlLink!,
      meetUrl,
    };
  } catch (error) {
    console.error('Google Calendar API error:', error);
    throw new Error('Failed to create calendar event');
  }
}

export async function getUpcomingEvents(maxResults: number = 10) {
  try {
    const auth = getGoogleAuth();
    
    const response = await calendar.events.list({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description,
      htmlLink: event.htmlLink,
      meetUrl: event.conferenceData?.entryPoints?.find(
        entry => entry.entryPointType === 'video'
      )?.uri,
    })) || [];
  } catch (error) {
    console.error('Google Calendar API error:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

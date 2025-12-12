import { google } from "googleapis";

// You'll need to get these from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/auth/google/callback";

export function isConfigured() {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_ID !== "your-client-id.apps.googleusercontent.com";
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function getUserProfile(accessToken: string) {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    email: data.email!,
    name: data.name || 'User',
    picture: data.picture
  };
}

type TokenBundle = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
};

export async function createCalendarEvent(
  tokens: TokenBundle,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }
) {
  // Use a client with refresh support so expired access tokens are renewed
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  client.setCredentials(tokens);

  // Proactively refresh if the token is missing/expired and refresh_token exists
  if (!tokens.access_token && tokens.refresh_token) {
    const refreshed = await client.refreshAccessToken();
    client.setCredentials(refreshed.credentials);
  }

  const calendar = google.calendar({ version: 'v3', auth: client });
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });
  
  return response.data;
}

export async function createGoogleTask(
  tokens: TokenBundle,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
  }
) {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  client.setCredentials(tokens);

  if (!tokens.access_token && tokens.refresh_token) {
    const refreshed = await client.refreshAccessToken();
    client.setCredentials(refreshed.credentials);
  }

  const tasks = google.tasks({ version: 'v1', auth: client });
  
  // Get the default task list
  const taskLists = await tasks.tasklists.list();
  const defaultListId = taskLists.data.items?.[0]?.id || '@default';
  
  const response = await tasks.tasks.insert({
    tasklist: defaultListId,
    requestBody: task,
  });
  
  return response.data;
}

export async function createCalendarReminder(
  tokens: TokenBundle,
  reminder: {
    summary: string;
    description?: string;
    dateTime: string; // RFC 3339 timestamp
  }
) {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  client.setCredentials(tokens);

  if (!tokens.access_token && tokens.refresh_token) {
    const refreshed = await client.refreshAccessToken();
    client.setCredentials(refreshed.credentials);
  }

  const calendar = google.calendar({ version: 'v3', auth: client });
  
  // Create a reminder-type event (all-day event with reminders)
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: reminder.summary,
      description: reminder.description || '',
      start: {
        date: reminder.dateTime.split('T')[0], // Extract just the date for all-day
      },
      end: {
        date: reminder.dateTime.split('T')[0], // Same date for all-day
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 }, // Pop-up at the exact time
        ],
      },
      // This makes it appear more like a reminder than a calendar block
      transparency: 'transparent', // Doesn't block time
    },
  });
  
  return response.data;
}

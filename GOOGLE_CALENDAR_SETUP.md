# Google Calendar Integration Setup Guide

## Overview
Your app now has **real Google Calendar OAuth integration** that stores credentials in MongoDB and allows syncing tasks/habits to Google Calendar.

## Setup Steps

### 1. Get Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:4000/api/auth/google/callback`
   - Save your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
MONGODB_URI=mongodb://localhost:27017/read-open
PORT=4000
```

### 3. How It Works

#### Connection Flow:
1. User clicks the Google Calendar toggle in Profile
2. Backend generates OAuth URL with user ID in state
3. User is redirected to Google consent screen
4. After approval, Google redirects back to `/api/auth/google/callback`
5. Backend exchanges auth code for access/refresh tokens
6. Tokens are saved to MongoDB in the user document
7. User is redirected back to Profile with `?connected=true`

#### Syncing Tasks:
- Call `syncToGoogleCalendar({ title, date, time, type })` from the store
- Backend uses stored access token to create Google Calendar event
- Events appear in user's primary Google Calendar

### 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google/connect?userId=<id>` | Get OAuth URL |
| GET | `/api/auth/google/callback?code=<code>&state=<state>` | OAuth callback |
| POST | `/api/auth/google/disconnect` | Remove tokens |
| POST | `/api/calendar/sync` | Create calendar event |

### 5. MongoDB Schema

User model now includes:
```typescript
googleCalendarTokens?: {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
}
```

### 6. Testing

1. Start MongoDB: `Start-Service "MongoDB"`
2. Start backend: `npm run dev`
3. Login at `http://localhost:4000/`
4. Go to Profile
5. Toggle "Google Calendar" switch
6. Complete OAuth flow
7. Try adding a task and sync it

### 7. Production Deployment

- Update `GOOGLE_REDIRECT_URI` to your production domain
- Add production domain to Google Cloud Console authorized redirect URIs
- Use environment variables (never commit secrets to git)
- Consider implementing token refresh logic for expired access tokens

## Current Status
✅ Backend OAuth routes implemented
✅ MongoDB token storage
✅ Frontend OAuth flow wired
✅ Calendar event creation API
⚠️ Requires Google Cloud credentials to activate

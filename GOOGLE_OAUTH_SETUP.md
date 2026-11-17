# Google OAuth Authentication Setup Guide

## Overview

Google OAuth ("Continue with Google") authentication has been successfully implemented in your FinPilot AI application. Users can now sign up and log in using their Google accounts.

---

## What Was Implemented

### Backend Changes

1. **New Model: `SocialAccount`** (`backend/core/models.py`)
   - Links user accounts to Google OAuth accounts
   - Stores Google user ID, email, and profile data
   - Prevents duplicate accounts with unique constraints

2. **New API Endpoints** (`backend/core/views.py`)
   - `GET /api/v1/auth/google/` - Initiates OAuth flow, redirects to Google
   - `GET /api/v1/auth/google/callback/` - Handles Google's redirect after authentication

3. **Security Features**
   - State parameter validation (CSRF protection)
   - ID token verification using Google's official library
   - Secure server-side token exchange
   - Safe handling of existing email accounts (no auto-linking)

4. **Database Migration**
   - Migration `0006_add_social_account.py` created and applied successfully

### Frontend Changes

1. **Google Sign-In Button** (`frontend/src/App.tsx`)
   - Professional button with official Google logo
   - Works in both Login and Signup modes
   - Shows loading state during authentication
   - Displays error messages from OAuth flow

2. **API Client** (`frontend/src/lib/api.ts`)
   - New `api.googleAuthUrl()` method to start OAuth

3. **Styling** (`frontend/src/styles.css`)
   - Professional Google button styling
   - Responsive design matching existing UI
   - Error display styling

---

## Google Cloud Console Configuration

### Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Either select an existing project or click **"New Project"**
4. If creating new:
   - Enter project name: `FinPilot AI` (or your choice)
   - Click **"Create"**

### Step 2: Enable Google+ API (if required)

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** (if needed for profile data)
3. Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted to configure OAuth consent screen:
   - Choose **"External"** (for testing) or **"Internal"** (for organization)
   - Click **"Create"**
   - Fill required fields:
     - App name: `FinPilot AI`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"**
   - Skip scopes for now, click **"Save and Continue"**
   - Add test users (your Google account email)
   - Click **"Save and Continue"**, then **"Back to Dashboard"**

4. Back in **"Credentials"**, click **"Create Credentials"** → **"OAuth client ID"**
5. Choose **"Web application"**
6. Enter:
   - **Name:** `FinPilot AI Web Client`
   - **Authorized JavaScript origins:** (leave empty for now)
   - **Authorized redirect URIs:**
     ```
     http://localhost:8000/api/v1/auth/google/callback/
     ```
   - For production, add your production URL:
     ```
     https://yourdomain.com/api/v1/auth/google/callback/
     ```

7. Click **"Create"**
8. Copy the **Client ID** and **Client Secret** shown in the popup

### Step 4: Add Credentials to Your Backend

1. Open `backend/.env`
2. Add or update these lines:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback/
   ```
3. Save the file
4. Restart your Django backend server

---

## Testing Locally

### 1. Start the Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

### 2. Start the Frontend

```powershell
cd frontend
npm run dev
```

### 3. Open Browser

Navigate to `http://localhost:5173`

### 4. Test Google Sign-In

1. On the login or signup page, click **"Continue with Google"**
2. You'll be redirected to Google's authentication page
3. Choose a Google account and authorize the app
4. You'll be redirected back to FinPilot AI and automatically logged in
5. A new organization will be created for you

### 5. Test Existing Email Safety

1. Create an account with email/password first
2. Log out
3. Try to sign in with Google using the same email
4. You should see: *"An account with this email already exists. Please sign in with your password."*

---

## How It Works

### Authorization Code Flow

```
1. User clicks "Continue with Google"
   → Frontend calls /api/v1/auth/google/
   
2. Backend generates state token (CSRF protection)
   → Stores in Django session
   → Returns Google authorization URL
   
3. Frontend redirects browser to Google
   → User sees Google's consent screen
   
4. User authorizes app
   → Google redirects to /api/v1/auth/google/callback/?code=...&state=...
   
5. Backend verifies state token
   → Exchanges authorization code for ID token (server-side)
   → Verifies ID token signature with Google's public keys
   → Extracts user email and profile
   
6. Backend checks if Google account already linked
   → If yes: log in existing user
   → If no: check if email exists
      - If email exists: return error (no auto-linking)
      - If email doesn't exist: create new user + organization
   
7. Backend calls login(request, user)
   → Sets Django session cookie
   → Redirects to frontend
   
8. User is now authenticated
```

### Security Measures

- **State parameter:** Prevents CSRF attacks on OAuth callback
- **Server-side token exchange:** Client secret never exposed to browser
- **ID token verification:** Validates signature, issuer, audience, and expiry
- **No auto-linking:** Existing email accounts require password login first
- **Unique constraints:** Prevents duplicate Google account links

---

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `requirements.txt` | Added `google-auth==2.37.0` |
| `config/settings.py` | Added `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| `.env.example` | Documented Google OAuth environment variables |
| `core/models.py` | Added `SocialAccount` model |
| `core/migrations/0006_add_social_account.py` | Database migration (already applied) |
| `core/views.py` | Added `google_oauth_start` and `google_oauth_callback` views |
| `core/urls.py` | Registered Google OAuth URL patterns |
| `core/tests/test_google_oauth.py` | Created comprehensive tests (7 tests, all passing) |

### Frontend

| File | Changes |
|------|---------|
| `src/lib/api.ts` | Added `googleAuthUrl()` API method |
| `src/App.tsx` | Added Google button, OAuth error handling, redirect logic |
| `src/styles.css` | Added Google button and error banner styles |

---

## Verification Checklist

### Backend

- ✅ `google-auth==2.37.0` installed
- ✅ Migration `0006_add_social_account` applied successfully
- ✅ Django system check passes (no errors)
- ✅ All existing auth tests pass (12/12)
- ✅ New Google OAuth tests pass (7/7)
- ✅ No duplicate URL routes

### Frontend

- ✅ TypeScript compilation successful
- ✅ Frontend build successful (no errors)
- ✅ Google button added to login and signup screens
- ✅ Error display implemented
- ✅ Loading states implemented

---

## Deployment Notes

### For Production

1. **Update Google Cloud Console:**
   - Add production redirect URI:
     ```
     https://yourdomain.com/api/v1/auth/google/callback/
     ```
   - Add production authorized JavaScript origins (if needed):
     ```
     https://yourdomain.com
     ```

2. **Update Backend `.env`:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback/
   ```

3. **Update Frontend OAuth Callback:**
   - In `backend/core/views.py`, update `frontend_url` from `http://localhost:5173` to your production frontend URL

4. **HTTPS Required:**
   - Google OAuth requires HTTPS in production
   - Use a reverse proxy (nginx, Caddy) or a platform with built-in HTTPS

5. **OAuth Consent Screen:**
   - For public launch, submit app for Google verification
   - Add privacy policy and terms of service URLs
   - Request only required scopes: `openid`, `email`, `profile`

---

## Troubleshooting

### "Google OAuth is not configured" (503 error)

**Cause:** Missing or empty `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in `.env`

**Fix:**
1. Check `backend/.env` has both variables set
2. Restart Django backend server
3. Clear browser cache if needed

### "redirect_uri_mismatch" error from Google

**Cause:** The redirect URI doesn't match what's registered in Google Cloud Console

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client ID
3. Ensure **Authorized redirect URIs** includes:
   ```
   http://localhost:8000/api/v1/auth/google/callback/
   ```
4. Save changes (may take 5 minutes to propagate)

### "Invalid state parameter" error

**Cause:** Session expired or CSRF token mismatch

**Fix:**
- Try again from the beginning (click "Continue with Google")
- Check that cookies are enabled in browser
- Ensure `SESSION_COOKIE_SAMESITE = 'Lax'` in `settings.py`

### "An account with this email already exists"

**Cause:** A password-based account exists with the same email (this is intentional for security)

**Fix:**
- Log in with email and password instead
- Or use a different email for Google sign-in
- (Future enhancement: add account linking feature after password verification)

### Google account signed in but user not authenticated in app

**Cause:** Session cookie not set, or redirect failed

**Fix:**
1. Check browser console for errors
2. Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
3. Check `frontend_url` in `google_oauth_callback` view is correct
4. Ensure cookies are not blocked by browser

---

## Next Steps (Optional Enhancements)

1. **Account Linking:**
   - Allow users logged in with password to link their Google account
   - Add UI in settings to manage linked accounts

2. **Multi-Provider Support:**
   - Add Microsoft OAuth
   - Add Apple Sign-In
   - Abstract `SocialAccount` to support multiple providers

3. **Profile Sync:**
   - Sync profile picture from Google
   - Update user name when Google profile changes

4. **Email Verification Skip:**
   - Mark Google-authenticated users as email-verified automatically
   - Add `email_verified` field to User model

5. **One-Tap Sign-In:**
   - Implement Google One Tap for faster sign-in
   - Show prompt automatically on page load

---

## Support

If you encounter issues:

1. Check Django logs for detailed error messages
2. Check browser console for frontend errors
3. Verify Google Cloud Console configuration
4. Run tests: `pytest backend/core/tests/test_google_oauth.py -v`

For Google OAuth-specific issues, see:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Common OAuth Errors](https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse)

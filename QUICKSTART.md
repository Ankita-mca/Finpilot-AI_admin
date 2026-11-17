# Google OAuth Quick Start

## ⚡ 3-Step Setup

### Step 1: Get Google Credentials (5 minutes)

1. Visit: https://console.cloud.google.com/
2. Create project → **APIs & Services** → **Credentials** → **Create OAuth Client ID**
3. Add redirect URI: `http://localhost:8000/api/v1/auth/google/callback/`
4. Copy **Client ID** and **Client Secret**

### Step 2: Configure Backend (1 minute)

Edit `backend/.env`:

```env
GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste-your-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback/
```

### Step 3: Restart & Test (1 minute)

**Terminal 1 (Backend):**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

**Browser:**
1. Go to: http://localhost:5173
2. Click **"Continue with Google"**
3. Authorize with Google
4. ✅ You're logged in!

---

## Need Help?

- **Detailed setup:** Read `GOOGLE_OAUTH_SETUP.md`
- **Implementation details:** Read `IMPLEMENTATION_SUMMARY.md`
- **Troubleshooting:** See `GOOGLE_OAUTH_SETUP.md` → Troubleshooting section

## Status

✅ Implementation complete  
✅ Tests passing (19/19)  
✅ TypeScript compiled  
✅ Database migrated  
⏳ Waiting for your Google OAuth credentials

# Quick Setup Guide - HustleBase

Follow these steps to get HustleBase up and running in minutes.

## Step 1: Supabase Setup (5 minutes)

1. **Create Account & Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in project details and wait for setup (~2 minutes)

2. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon/public key** (long string starting with `eyJ...`)

3. **Disable Email Confirmation (Recommended for Development)**
   - Go to **Authentication** → **Settings** in Supabase dashboard
   - Under **Email Auth**, find **"Enable email confirmations"**
   - **Toggle it OFF** to disable email confirmation
   - This allows users to sign in immediately after signup without verifying their email
   - ⚠️ **Note**: For production, you should enable email confirmation for security

## Step 2: Database Setup (2 minutes)

1. **Run SQL Schema**
   - In Supabase dashboard, go to **SQL Editor**
   - Click **New Query**
   - Open `supabase/schema.sql` from this project
   - Copy ALL the SQL code
   - Paste into SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - You should see "Success" message

## Step 3: Storage Setup (2 minutes)

1. **Create Storage Buckets**
   - Go to **Storage** in Supabase dashboard
   - Click **New Bucket**
   - Create bucket: `profile-photos`
     - Make it **Public**: Yes
   - Create bucket: `portfolio-images`
     - Make it **Public**: Yes

2. **Set Storage Policies** (Optional - can use default)
   - Click on each bucket
   - Go to **Policies** tab
   - The schema.sql file has commented SQL for policies if needed

## Step 4: Configure Frontend (1 minute)

1. **Update Config File**
   - Open `public/config.js`
   - Replace these two lines:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   - With your actual credentials from Step 1

## Step 5: Run the App (30 seconds)

### Option A: Simple (Double-click)
- Navigate to `public` folder
- Double-click `index.html`
- Opens in your default browser

### Option B: Local Server (Recommended)
```bash
# Navigate to public folder
cd public

# Using Node.js
npx serve -p 5000
```

Then open `http://localhost:5000` in your browser.

## Testing the App

1. **Test Sign Up**
   - Click "Sign Up"
   - Create a test account as "Provider"
   - You should be redirected to profile page

2. **Create a Profile**
   - Fill out the provider profile form
   - Upload a profile photo (optional)
   - Add portfolio images (optional)
   - Click "Save Profile"

3. **Browse Services**
   - Go to "Browse Services"
   - You should see your profile listed
   - Click on it to view details

4. **Test Job Requests** (as client)
   - Sign out
   - Create another account as "Client"
   - Go to "Post Request"
   - Post a job request
   - Providers can now apply to it

5. **Test Reviews** (as different user)
   - Sign out
   - Create another account as "Client"
   - Browse services
   - Click on a provider
   - Leave a review

## Common Issues

### ❌ "Supabase credentials not configured"
**Fix**: Make sure you updated `config.js` with your actual credentials

### ❌ "Error loading providers"
**Fix**: 
- Check that you ran the SQL schema
- Verify in Supabase dashboard that tables exist (Table Editor)

### ❌ "Failed to upload image"
**Fix**:
- Check that storage buckets are created
- Verify buckets are set to Public
- Check browser console for specific error

### ❌ "Cannot create review"
**Fix**:
- Make sure you're logged in
- You can't review your own profile
- Check that you haven't already reviewed this provider

## Next Steps

- Customize colors in `styles.css` (CSS variables)
- Add more categories or features
- Deploy to Vercel/Netlify for production
- Add your own branding

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review [Supabase Docs](https://supabase.com/docs)
- Check browser console (F12) for error messages

---

**That's it!** Your HustleBase platform should now be running. 🎉

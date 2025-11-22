# Supabase Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Click "New Project"

### Step 2: Create Project
1. **Organization:** Create new or select existing
2. **Name:** `stockmaster` (or any name)
3. **Database Password:** Create a strong password (save it!)
4. **Region:** Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for setup

### Step 3: Get Your Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### Step 4: Run Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 5: Set Environment Variables
Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace with your actual values from Step 3.

### Step 6: Install and Run
```bash
npm install
npm run dev
```

## ✅ That's it! Your app is now using Supabase!

## 📋 What You Get
- ✅ Free PostgreSQL database (500MB)
- ✅ Web dashboard to view/edit data
- ✅ Auto-generated REST API
- ✅ Real-time capabilities (optional)
- ✅ No build tools needed
- ✅ Works instantly

## 🔒 Security Notes
- The `anon` key is safe to use in browser (it's public)
- Row Level Security is disabled by default (good for development)
- For production, enable RLS and set up policies

## 🆘 Troubleshooting

**"Invalid API key"**
- Check your `.env.local` file has correct values
- Make sure variable names start with `NEXT_PUBLIC_`

**"relation does not exist"**
- Run the `supabase-schema.sql` in SQL Editor
- Check you're in the correct project

**Connection issues**
- Check your internet connection
- Verify Supabase project is active (not paused)

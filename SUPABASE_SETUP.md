# Supabase Setup Guide for Finly

This guide will walk you through setting up Supabase for your Finly application.

## Prerequisites

- A GitHub account (for sign-up)
- Access to a web browser

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with your GitHub account (or create an account)

## Step 2: Create a New Project

1. Once logged in, click **"New Project"**
2. Fill in the project details:
   - **Name**: `finly-app` (or any name you prefer)
   - **Database Password**: Create a strong password and **save it securely** (you'll need this!)
   - **Region**: Choose the region closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

## Step 3: Get Your API Credentials

1. In your project dashboard, click on **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this long string
4. Save both values - you'll need them next

## Step 4: Create Your .env File

1. In your project root directory, create a file named `.env` (if it doesn't exist)
2. Add the following content:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace `your_project_url_here` with your Project URL from Step 3
4. Replace `your_anon_key_here` with your anon/public key from Step 3

**Example:**
```bash
VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5ODc2NTQzLCJleHAiOjIwMTU0NTI1NDN9.abcdefghijklmnopqrstuvwxyz1234567890
```

## Step 5: Run Database Migrations

Once you have your Supabase project set up, you need to run the migrations to create your database schema:

### Option A: Using Supabase Dashboard (Recommended)

1. In your Supabase dashboard, click on **SQL Editor** in the sidebar
2. Click **"New query"**
3. Open the file `supabase/migrations/20251001165643_create_finly_schema_v2.sql`
4. Copy ALL the contents of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
7. You should see "Success. No rows returned"
8. Now open `supabase/migrations/20251002213025_add_budget_profile.sql`
9. Copy ALL contents of that file
10. Paste it into the SQL Editor
11. Click **"Run"**
12. You should see "Success. No rows returned"

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Step 6: Restart Your Development Server

1. Stop your current development server (Ctrl+C or Cmd+C)
2. Run `npm run dev` again
3. Open http://localhost:5173 in your browser

## Step 7: Test Your Setup

1. You should see the login screen
2. Click "Sign Up" 
3. Enter:
   - Full Name: `Test User`
   - Email: `test@example.com` (use a real email you can access)
   - Password: `test123456` (minimum 6 characters)
4. Click "Sign Up"
5. You should be able to create an account!

## Troubleshooting

### "Supabase not configured" error
- Make sure your `.env` file exists in the project root
- Make sure the variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating/updating `.env`

### Migration errors
- Make sure you ran the migrations in order
- Check the SQL Editor for any error messages
- You can check your tables in the **Table Editor** in Supabase dashboard

### Authentication not working
- Check that RLS (Row Level Security) policies are enabled (they are in the migrations)
- Verify your email if Supabase requires email confirmation
- Check the browser console for specific error messages

## Security Notes

- Never commit your `.env` file to git
- The `.env.example` file is safe to commit
- Your anon key is safe to use in frontend code (it's public)
- Never expose your `service_role` key in frontend code

## Next Steps

Once setup is complete, you can:
- Create transactions
- Set up savings goals
- Add learning progress
- Invite friends
- And much more!

For more help, visit: https://supabase.com/docs


# ⚡ Quick Start Guide

Get Finly running in 10 minutes!

## 🚀 Fast Track Setup

```bash
# 1. Open Supabase Dashboard
open https://app.supabase.com

# 2. Create project (wait 2-3 min)
#    Name: finly-app
#    Save your password!

# 3. Get credentials
#    Settings → API → Copy URL & anon key

# 4. Configure environment
./setup_supabase.sh

# 5. Display migrations
./run_migrations.sh

# 6. Copy migrations to Supabase SQL Editor
#    Dashboard → SQL Editor → New Query → Paste & Run

# 7. Restart dev server
npm run dev
```

## 🎯 What to Do in Supabase Dashboard

### Step 1: Create Project
- Click "New Project"
- Name: `finly-app`
- Password: [choose strong password]
- Region: [your region]
- Wait 2-3 minutes ⏱️

### Step 2: Get API Keys
- Click ⚙️ Settings (sidebar)
- Click **API**
- Copy **Project URL** (example: `https://xxx.supabase.co`)
- Copy **anon public key** (long string)

### Step 3: Run SQL Migrations
- Click **SQL Editor** (sidebar)
- Click **New query**
- Copy **Migration 1** from `run_migrations.sh`
- Paste in editor
- Click **Run** ✅
- Repeat for **Migration 2**

### Verify
- Click **Table Editor** (sidebar)
- You should see: `profiles`, `transactions`, `budgets`, `savings_accounts`, etc.
- ✅ Database ready!

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Supabase not configured" | Run `./setup_supabase.sh` or create `.env` manually |
| Migration fails | Run migrations one at a time, check for errors |
| Can't sign up | Check browser console, verify RLS policies enabled |
| No data showing | Verify `.env` file exists and restart server |

## 📖 Full Guide

For detailed instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] `.env` file configured
- [ ] Both migrations executed successfully
- [ ] Server restarted (`npm run dev`)
- [ ] Can sign up for account
- [ ] Dashboard loads without errors

🎉 You're ready to go!


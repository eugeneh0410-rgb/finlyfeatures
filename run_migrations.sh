#!/bin/bash

echo "📦 Finly Database Migration Runner"
echo "==================================="
echo ""
echo "This script will display the SQL migrations you need to run."
echo "Copy each migration and run it in the Supabase SQL Editor."
echo ""
echo "📍 Supabase SQL Editor: https://app.supabase.com > Your Project > SQL Editor"
echo ""

# Check if migration files exist
if [ ! -f supabase/migrations/20251001165643_create_finly_schema_v2.sql ]; then
  echo "❌ Error: Migration files not found!"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration 1: Create Finly Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the SQL below and run it in Supabase SQL Editor:"
echo ""
cat supabase/migrations/20251001165643_create_finly_schema_v2.sql
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration 2: Add Budget Profile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the SQL below and run it in Supabase SQL Editor:"
echo ""
cat supabase/migrations/20251002213025_add_budget_profile.sql
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration 3: Add Profile and Badges"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the SQL below and run it in Supabase SQL Editor:"
echo ""
cat supabase/migrations/20251101024720_add_profile_and_badges.sql
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Migration 4: Add Learning Plans"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copy the SQL below and run it in Supabase SQL Editor:"
echo ""
cat supabase/migrations/20251101180000_add_learning_plans.sql
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All 4 migrations displayed above!"
echo ""
echo "After running all migrations, check:"
echo "1. Tables tab should show: profiles, transactions, budgets, savings_accounts, badges, user_badges, learning_plans, learning_plan_modules, learning_plan_topics, etc."
echo "2. Database should have Row Level Security enabled on all tables"
echo "3. badges table should have 8 predefined badges"
echo "4. learning_modules table should have topic column"
echo ""


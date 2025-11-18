#!/bin/bash

echo "🚀 Finly Supabase Setup"
echo "========================"
echo ""
echo "This script will help you set up Supabase for your Finly application."
echo ""

# Check if .env already exists
if [ -f .env ]; then
  echo "⚠️  .env file already exists!"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
  fi
fi

echo ""
echo "Please provide your Supabase credentials:"
echo "(You can find these at: https://app.supabase.com > Your Project > Settings > API)"
echo ""

read -p "Enter your Supabase Project URL: " supabase_url
read -p "Enter your Supabase Anon Key: " supabase_key

# Validate inputs
if [ -z "$supabase_url" ] || [ -z "$supabase_key" ]; then
  echo "❌ Error: Both URL and Key are required!"
  exit 1
fi

# Create .env file
cat > .env << ENVEOF
VITE_SUPABASE_URL=$supabase_url
VITE_SUPABASE_ANON_KEY=$supabase_key
ENVEOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "1. Run database migrations in Supabase SQL Editor"
echo "2. Run: npm run dev"
echo ""
echo "📖 See SUPABASE_SETUP.md for detailed instructions"

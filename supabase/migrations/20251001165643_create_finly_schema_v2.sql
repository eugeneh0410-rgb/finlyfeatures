/*
  # Create Finly Database Schema

  ## Overview
  This migration creates the complete database schema for Finly, a personal finance management app for college students and young adults.

  ## New Tables

  ### 1. profiles
  Extends auth.users with profile information
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `avatar_url` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. transactions
  Tracks all income and expenses
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text: 'income' or 'expense')
  - `amount` (decimal)
  - `category` (text)
  - `description` (text, optional)
  - `date` (date)
  - `created_at` (timestamptz)

  ### 3. budgets
  User budget settings and limits
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `category` (text)
  - `amount` (decimal)
  - `period` (text: 'monthly', 'weekly', etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. savings_accounts
  Individual savings goals and accounts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `goal_amount` (decimal)
  - `current_amount` (decimal)
  - `is_public` (boolean, for friend visibility)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. friendships
  Tracks friend connections between users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `friend_id` (uuid, references profiles)
  - `status` (text: 'pending', 'accepted')
  - `created_at` (timestamptz)

  ### 6. learning_modules
  Educational content (videos & articles)
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `type` (text: 'video' or 'article')
  - `content_url` (text)
  - `duration_minutes` (integer, optional)
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 7. user_learning_progress
  Tracks which modules users have completed
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `module_id` (uuid, references learning_modules)
  - `completed` (boolean)
  - `completed_at` (timestamptz, optional)
  - `created_at` (timestamptz)

  ### 8. ai_questions
  User questions to AI assistant
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `question` (text)
  - `answer` (text, optional)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Friends can view public savings accounts
  - Learning modules are readable by all authenticated users

  ## Indexes
  Created for optimal query performance on:
  - Foreign key relationships
  - Date-based queries
  - User lookups
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  period text NOT NULL DEFAULT 'monthly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, period)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Create friendships table first
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendships"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they are part of"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- Create savings_accounts table (after friendships)
CREATE TABLE IF NOT EXISTS savings_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal_amount decimal(10,2) NOT NULL CHECK (goal_amount > 0),
  current_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings accounts"
  ON savings_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Friends can view public savings accounts"
  ON savings_accounts FOR SELECT
  TO authenticated
  USING (
    is_public = true AND EXISTS (
      SELECT 1 FROM friendships
      WHERE (friendships.user_id = savings_accounts.user_id AND friendships.friend_id = auth.uid() AND friendships.status = 'accepted')
         OR (friendships.friend_id = savings_accounts.user_id AND friendships.user_id = auth.uid() AND friendships.status = 'accepted')
    )
  );

CREATE POLICY "Users can insert own savings accounts"
  ON savings_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings accounts"
  ON savings_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings accounts"
  ON savings_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_accounts_user_id ON savings_accounts(user_id);

-- Create learning_modules table
CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'article')),
  content_url text NOT NULL,
  duration_minutes integer,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view learning modules"
  ON learning_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_learning_modules_order ON learning_modules(order_index);

-- Create user_learning_progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress"
  ON user_learning_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
  ON user_learning_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON user_learning_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);

-- Create ai_questions table
CREATE TABLE IF NOT EXISTS ai_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI questions"
  ON ai_questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI questions"
  ON ai_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_questions_user_id ON ai_questions(user_id);

-- Insert sample learning modules
INSERT INTO learning_modules (title, description, type, content_url, duration_minutes, order_index) VALUES
  ('Budgeting Basics', 'Learn the fundamentals of creating and sticking to a budget', 'article', 'https://www.investopedia.com/articles/pf/07/budgeting_basics.asp', 10, 1),
  ('Understanding Credit Scores', 'What credit scores are and why they matter', 'video', 'https://www.youtube.com/watch?v=example1', 15, 2),
  ('Saving for Emergencies', 'How to build an emergency fund', 'article', 'https://www.investopedia.com/articles/pf/06/savemoney.asp', 12, 3),
  ('Investing 101', 'Introduction to investing for beginners', 'video', 'https://www.youtube.com/watch?v=example2', 20, 4),
  ('Managing Student Loans', 'Strategies for handling student debt', 'article', 'https://www.investopedia.com/student-loans-4689727', 15, 5)
ON CONFLICT DO NOTHING;
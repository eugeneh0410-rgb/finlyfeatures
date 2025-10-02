/*
  # Add Budget Profile Table

  ## Overview
  This migration adds a table to store user budget questionnaire responses and preferences.

  ## New Table

  ### budget_profile
  Stores user's budgeting questionnaire responses
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, unique)
  - `monthly_income` (decimal)
  - `top_spending_category` (text)
  - `cut_spending_category` (text)
  - `savings_goal_percentage` (integer)
  - `financial_goals` (text array)
  - `spending_habits` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on budget_profile table
  - Users can only access their own budget profile

  ## Important Notes
  1. Each user can only have one budget profile
  2. Profile can be updated as user's financial situation changes
  3. Used to generate personalized budget recommendations
*/

-- Create budget_profile table
CREATE TABLE IF NOT EXISTS budget_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  monthly_income decimal(10,2) NOT NULL CHECK (monthly_income >= 0),
  top_spending_category text NOT NULL,
  cut_spending_category text NOT NULL,
  savings_goal_percentage integer DEFAULT 20 CHECK (savings_goal_percentage >= 0 AND savings_goal_percentage <= 100),
  financial_goals text[] DEFAULT '{}',
  spending_habits text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget profile"
  ON budget_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget profile"
  ON budget_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget profile"
  ON budget_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget profile"
  ON budget_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budget_profile_user_id ON budget_profile(user_id);
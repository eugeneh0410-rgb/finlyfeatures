/*
  # Add Learning Plans System

  ## Overview
  This migration adds a learning plans system that allows users to create personalized
  learning schedules based on their preferences and selected topics.

  ## New Tables

  ### learning_plans
  Stores user-created learning plans
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text) - optional plan name
  - `preference_type` (text) - 'lessons_per_week' or 'time_per_day'
  - `preference_value` (integer) - number of lessons or minutes per day
  - `start_date` (date) - when the plan starts
  - `is_active` (boolean) - whether this is the current active plan
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### learning_plan_modules
  Links modules to learning plans with scheduled dates
  - `id` (uuid, primary key)
  - `plan_id` (uuid, references learning_plans)
  - `module_id` (uuid, references learning_modules)
  - `scheduled_date` (date) - when this module should be completed
  - `completed` (boolean) - whether completed
  - `completed_at` (timestamptz, optional)
  - `order_index` (integer) - order within the plan
  - `created_at` (timestamptz)

  ### learning_plan_topics
  Stores selected topics/categories for a plan
  - `id` (uuid, primary key)
  - `plan_id` (uuid, references learning_plans)
  - `topic` (text) - topic name (e.g., 'budgeting', 'investing', 'saving')
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own learning plans
*/

-- Create learning_plans table
CREATE TABLE IF NOT EXISTS learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text,
  preference_type text NOT NULL CHECK (preference_type IN ('lessons_per_week', 'time_per_day')),
  preference_value integer NOT NULL CHECK (preference_value > 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_plan_modules table
CREATE TABLE IF NOT EXISTS learning_plan_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create learning_plan_topics table
CREATE TABLE IF NOT EXISTS learning_plan_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  topic text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plan_topics ENABLE ROW LEVEL SECURITY;

-- Learning plans policies
CREATE POLICY "Users can view own learning plans"
  ON learning_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning plans"
  ON learning_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning plans"
  ON learning_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning plans"
  ON learning_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Learning plan modules policies
CREATE POLICY "Users can view own plan modules"
  ON learning_plan_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_modules.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan modules"
  ON learning_plan_modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_modules.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan modules"
  ON learning_plan_modules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_modules.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_modules.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan modules"
  ON learning_plan_modules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_modules.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

-- Learning plan topics policies
CREATE POLICY "Users can view own plan topics"
  ON learning_plan_topics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_topics.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan topics"
  ON learning_plan_topics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_topics.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan topics"
  ON learning_plan_topics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_plans
      WHERE learning_plans.id = learning_plan_topics.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_active ON learning_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_learning_plan_modules_plan_id ON learning_plan_modules(plan_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_modules_scheduled_date ON learning_plan_modules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_learning_plan_topics_plan_id ON learning_plan_topics(plan_id);

-- Add topic/category column to learning_modules for better filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_modules' AND column_name = 'topic'
  ) THEN
    ALTER TABLE learning_modules ADD COLUMN topic text;
  END IF;
END $$;

-- Update existing modules with topics
UPDATE learning_modules SET topic = 'budgeting' WHERE title ILIKE '%budget%';
UPDATE learning_modules SET topic = 'credit' WHERE title ILIKE '%credit%';
UPDATE learning_modules SET topic = 'saving' WHERE title ILIKE '%saving%' OR title ILIKE '%emergency%';
UPDATE learning_modules SET topic = 'investing' WHERE title ILIKE '%invest%';
UPDATE learning_modules SET topic = 'debt' WHERE title ILIKE '%loan%' OR title ILIKE '%debt%';


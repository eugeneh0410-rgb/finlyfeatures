/*
  # Add Profile Enhancements and Badges System

  ## Overview
  This migration adds profile picture, nickname support and a comprehensive badges system
  for tracking user achievements through various activities.

  ## New Tables

  ### badges
  Defines all available badges in the system
  - `id` (uuid, primary key)
  - `name` (text, unique)
  - `description` (text)
  - `icon` (text)
  - `color` (text)
  - `category` (text) - 'savings', 'friends', 'budget', 'learning'
  - `created_at` (timestamptz)

  ### user_badges
  Tracks which badges users have earned
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, unique per badge)
  - `badge_id` (uuid, references badges)
  - `earned_at` (timestamptz)
  - `progress` (integer) - for badges that require progress (0-100)

  ## Modified Tables

  ### profiles
  - Added `picture_url` (text) - profile picture URL
  - Added `nickname` (text) - fun nickname for the user
  - Added `bio` (text) - short bio

  ## Security
  - Enable RLS on badges table (public read access)
  - Enable RLS on user_badges table (users can only see their own and friends' badges)

  ## Important Notes
  1. Badges are predefined and tracked via user_badges
  2. Progress field allows for badges with multiple tiers
  3. Achievements unlock automatically based on user actions
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN picture_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nickname text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
END $$;

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  category text NOT NULL CHECK (category IN ('savings', 'friends', 'budget', 'learning')),
  created_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id),
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Badge policies (badges are public read-only)
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- User badges policies
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' public badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (
        (friendships.user_id = auth.uid() AND friendships.friend_id = user_badges.user_id) OR
        (friendships.friend_id = auth.uid() AND friendships.user_id = user_badges.user_id)
      )
      AND friendships.status = 'accepted'
    )
  );

CREATE POLICY "System can insert badges for users"
  ON user_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own badges progress"
  ON user_badges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert predefined badges
INSERT INTO badges (name, description, icon, color, category) VALUES
  ('Savings Champion', 'Saved $1000 or more', 'Trophy', 'bg-yellow-100 text-yellow-700', 'savings'),
  ('Budget Master', 'Stayed within budget for 3 consecutive months', 'Target', 'bg-blue-100 text-blue-700', 'budget'),
  ('Friend Connector', 'Added 5 friends', 'Users', 'bg-purple-100 text-purple-700', 'friends'),
  ('Learning Explorer', 'Completed 5 learning modules', 'BookOpen', 'bg-pink-100 text-pink-700', 'learning'),
  ('Savings Streak', 'Saved money 10 times in a row', 'Zap', 'bg-orange-100 text-orange-700', 'savings'),
  ('Social Butterfly', 'Added 10 friends', 'Heart', 'bg-red-100 text-red-700', 'friends'),
  ('Financial Guru', 'Completed 10 learning modules', 'Brain', 'bg-teal-100 text-teal-700', 'learning'),
  ('Penny Pincher', 'Cut spending by 20% in a month', 'Zap', 'bg-green-100 text-green-700', 'budget')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

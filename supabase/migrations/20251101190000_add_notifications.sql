/*
  # Add Notifications System

  ## Overview
  This migration adds a notifications system for friend requests and achievements.

  ## New Tables

  ### notifications
  Stores all user notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text) - 'friend_request', 'friend_accepted', 'achievement_earned', 'friend_achievement'
  - `title` (text) - notification title
  - `message` (text) - notification message
  - `related_user_id` (uuid, optional) - for friend-related notifications
  - `related_badge_id` (uuid, optional) - for achievement notifications
  - `read` (boolean) - whether notification has been read
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on notifications table
  - Users can only view their own notifications
  - Users can update their own notifications (mark as read)
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'achievement_earned', 'friend_achievement')),
  title text NOT NULL,
  message text NOT NULL,
  related_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  related_badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications for users"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Allow users to view other users' profiles for friend exploration
-- Add policy to allow viewing other users' profiles (for friend exploration)
-- Note: This works alongside the existing "Users can view own profile" policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view other profiles for exploration'
  ) THEN
    CREATE POLICY "Users can view other profiles for exploration"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_user_id)
    SELECT 
      NEW.friend_id,
      'friend_request',
      'New Friend Request',
      (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' wants to be your friend!',
      NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for friend requests
DROP TRIGGER IF EXISTS trigger_friend_request_notification ON friendships;
CREATE TRIGGER trigger_friend_request_notification
  AFTER INSERT ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_friend_request();

-- Function to create friend accepted notification
CREATE OR REPLACE FUNCTION notify_friend_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Notify the person who sent the request
    INSERT INTO notifications (user_id, type, title, message, related_user_id)
    SELECT 
      NEW.user_id,
      'friend_accepted',
      'Friend Request Accepted',
      (SELECT full_name FROM profiles WHERE id = NEW.friend_id) || ' accepted your friend request!',
      NEW.friend_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for friend accepted
DROP TRIGGER IF EXISTS trigger_friend_accepted_notification ON friendships;
CREATE TRIGGER trigger_friend_accepted_notification
  AFTER UPDATE ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION notify_friend_accepted();

-- Function to create achievement notification
CREATE OR REPLACE FUNCTION notify_achievement_earned()
RETURNS TRIGGER AS $$
DECLARE
  badge_name text;
  badge_description text;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    SELECT name, description INTO badge_name, badge_description
    FROM badges
    WHERE id = NEW.badge_id;
    
    -- Notify the user who earned the badge
    INSERT INTO notifications (user_id, type, title, message, related_badge_id)
    VALUES (
      NEW.user_id,
      'achievement_earned',
      'Achievement Unlocked! 🎉',
      'You earned the "' || badge_name || '" badge! ' || badge_description,
      NEW.badge_id
    );
    
    -- Notify friends about the achievement
    INSERT INTO notifications (user_id, type, title, message, related_user_id, related_badge_id)
    SELECT 
      f.friend_id,
      'friend_achievement',
      'Friend Achievement! 🎊',
      (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' earned the "' || badge_name || '" badge!',
      NEW.user_id,
      NEW.badge_id
    FROM friendships f
    WHERE f.user_id = NEW.user_id 
      AND f.status = 'accepted'
    UNION
    SELECT 
      f.user_id,
      'friend_achievement',
      'Friend Achievement! 🎊',
      (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' earned the "' || badge_name || '" badge!',
      NEW.user_id,
      NEW.badge_id
    FROM friendships f
    WHERE f.friend_id = NEW.user_id 
      AND f.status = 'accepted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for achievements
DROP TRIGGER IF EXISTS trigger_achievement_notification ON user_badges;
CREATE TRIGGER trigger_achievement_notification
  AFTER INSERT OR UPDATE ON user_badges
  FOR EACH ROW
  WHEN (NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false))
  EXECUTE FUNCTION notify_achievement_earned();


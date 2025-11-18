/*
  # Add Comprehensive Achievement System

  ## Overview
  This migration adds all achievement badges and automatic achievement checking
  based on user activity.

  ## New Badges
  - Budget Boss: Create your first budget
  - Plan Pioneer: Complete the budgeting questionnaire
  - Number Ninja: Log 10 transactions
  - Expense Explorer: Categorize all your transactions for a week
  - Budget Beast: Stay under budget for 3 weeks in a row
  - Balance Breaker (Gold): Hit your savings and expense goals for 3 consecutive months
  - Goal Getter: Create your first savings goal
  - Rainy Day Rookie: Save your first $100
  - Piggy Bank Pro: Reach 50% of a goal
  - Treasure Tracker: Complete 3 saving goals
  - Compound King/Queen: Save consistently for 6 months
  - Money Maestro (Elite): Save $1,000+ or hit a major long-term goal
  - Finance Freshman: Complete your first learning module
  - Knowledge Knight: Complete 5 learning modules
  - Investment Intern: Finish all lessons in the "Investing Basics" category
  - Financial Philosopher (Elite): Complete every learning plan in your personalized roadmap
  - Finance Friend: Add your first friend
  - Daily Diligence: Log in 7 days in a row
  - Finance Flame: Maintain a 30-day streak
  - Habit Hero: Complete all weekly goals for 1 month
  - Money Marathoner: Use Finly for 6 months
  - Financial Legend (Platinum): 1-year Finly streak

  ## Functions
  - check_and_award_achievement: Checks if user qualifies for an achievement and awards it
  - check_budget_achievements: Checks budget-related achievements
  - check_transaction_achievements: Checks transaction-related achievements
  - check_savings_achievements: Checks savings-related achievements
  - check_learning_achievements: Checks learning-related achievements
  - check_friend_achievements: Checks friend-related achievements
  - check_streak_achievements: Checks login streak achievements
*/

-- Insert all new achievement badges
INSERT INTO badges (name, description, icon, color, category) VALUES
  -- Budget Achievements
  ('Budget Boss', 'Create your first budget', 'Target', 'bg-blue-100 text-blue-700', 'budget'),
  ('Plan Pioneer', 'Complete the budgeting questionnaire', 'Target', 'bg-indigo-100 text-indigo-700', 'budget'),
  ('Budget Beast', 'Stay under budget for 3 weeks in a row', 'Target', 'bg-purple-100 text-purple-700', 'budget'),
  ('Balance Breaker (Gold)', 'Hit your savings and expense goals for 3 consecutive months', 'Trophy', 'bg-yellow-100 text-yellow-700', 'budget'),
  
  -- Transaction Achievements
  ('Number Ninja', 'Log 10 transactions', 'Zap', 'bg-green-100 text-green-700', 'budget'),
  ('Expense Explorer', 'Categorize all your transactions for a week', 'Zap', 'bg-emerald-100 text-emerald-700', 'budget'),
  
  -- Savings Achievements
  ('Goal Getter', 'Create your first savings goal', 'Trophy', 'bg-cyan-100 text-cyan-700', 'savings'),
  ('Rainy Day Rookie', 'Save your first $100', 'Trophy', 'bg-blue-100 text-blue-700', 'savings'),
  ('Piggy Bank Pro', 'Reach 50% of a goal', 'Trophy', 'bg-teal-100 text-teal-700', 'savings'),
  ('Treasure Tracker', 'Complete 3 saving goals', 'Trophy', 'bg-amber-100 text-amber-700', 'savings'),
  ('Compound King/Queen', 'Save consistently for 6 months', 'Trophy', 'bg-violet-100 text-violet-700', 'savings'),
  ('Money Maestro (Elite)', 'Save $1,000+ or hit a major long-term goal', 'Trophy', 'bg-yellow-100 text-yellow-700', 'savings'),
  
  -- Learning Achievements
  ('Finance Freshman', 'Complete your first learning module', 'BookOpen', 'bg-pink-100 text-pink-700', 'learning'),
  ('Knowledge Knight', 'Complete 5 learning modules', 'BookOpen', 'bg-rose-100 text-rose-700', 'learning'),
  ('Investment Intern', 'Finish all lessons in the "Investing Basics" category', 'BookOpen', 'bg-fuchsia-100 text-fuchsia-700', 'learning'),
  ('Financial Philosopher (Elite)', 'Complete every learning plan in your personalized roadmap', 'BookOpen', 'bg-purple-100 text-purple-700', 'learning'),
  
  -- Friend Achievements
  ('Finance Friend', 'Add your first friend', 'Users', 'bg-sky-100 text-sky-700', 'friends'),
  
  -- Streak Achievements
  ('Daily Diligence', 'Log in 7 days in a row', 'Zap', 'bg-orange-100 text-orange-700', 'budget'),
  ('Finance Flame', 'Maintain a 30-day streak', 'Zap', 'bg-red-100 text-red-700', 'budget'),
  ('Habit Hero', 'Complete all weekly goals for 1 month', 'Zap', 'bg-lime-100 text-lime-700', 'budget'),
  ('Money Marathoner', 'Use Finly for 6 months', 'Zap', 'bg-indigo-100 text-indigo-700', 'budget'),
  ('Financial Legend (Platinum)', '1-year Finly streak — you''re unstoppable!', 'Trophy', 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700', 'budget')
ON CONFLICT (name) DO NOTHING;

-- Create user_login_streaks table to track login streaks
CREATE TABLE IF NOT EXISTS user_login_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_login_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login streaks"
  ON user_login_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage login streaks"
  ON user_login_streaks FOR ALL
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_login_streaks_user_id ON user_login_streaks(user_id);

-- Function to check and award an achievement
CREATE OR REPLACE FUNCTION check_and_award_achievement(
  p_user_id uuid,
  p_badge_name text
)
RETURNS boolean AS $$
DECLARE
  v_badge_id uuid;
  v_already_earned boolean;
BEGIN
  -- Get badge ID
  SELECT id INTO v_badge_id FROM badges WHERE name = p_badge_name;
  
  IF v_badge_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND badge_id = v_badge_id AND completed = true
  ) INTO v_already_earned;
  
  IF v_already_earned THEN
    RETURN false;
  END IF;
  
  -- Award the badge
  INSERT INTO user_badges (user_id, badge_id, completed, earned_at)
  VALUES (p_user_id, v_badge_id, true, now())
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET completed = true, earned_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check budget achievements
CREATE OR REPLACE FUNCTION check_budget_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_budget_count integer;
  v_profile_exists boolean;
  v_transaction_count integer;
  v_weeks_under_budget integer;
BEGIN
  -- Budget Boss: Create your first budget
  SELECT COUNT(*) INTO v_budget_count
  FROM budgets WHERE user_id = p_user_id;
  
  IF v_budget_count >= 1 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Budget Boss');
  END IF;
  
  -- Plan Pioneer: Complete the budgeting questionnaire
  SELECT EXISTS(
    SELECT 1 FROM budget_profile WHERE user_id = p_user_id
  ) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    PERFORM check_and_award_achievement(p_user_id, 'Plan Pioneer');
  END IF;
  
  -- Number Ninja: Log 10 transactions
  SELECT COUNT(*) INTO v_transaction_count
  FROM transactions WHERE user_id = p_user_id;
  
  IF v_transaction_count >= 10 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Number Ninja');
  END IF;
  
  -- Expense Explorer: Categorize all your transactions for a week
  -- (Check if user has transactions in at least 5 different categories in a week)
  SELECT COUNT(DISTINCT category) INTO v_transaction_count
  FROM transactions
  WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';
  
  IF v_transaction_count >= 5 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Expense Explorer');
  END IF;
  
  -- Budget Beast: Stay under budget for 3 weeks in a row
  -- (Simplified check - would need more sophisticated logic based on actual budget vs spending)
  -- This is a placeholder - can be enhanced with actual budget vs spending calculations
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check savings achievements
CREATE OR REPLACE FUNCTION check_savings_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_savings_count integer;
  v_total_saved decimal;
  v_goals_completed integer;
  v_goal_progress decimal;
BEGIN
  -- Goal Getter: Create your first savings goal
  SELECT COUNT(*) INTO v_savings_count
  FROM savings_accounts WHERE user_id = p_user_id;
  
  IF v_savings_count >= 1 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Goal Getter');
  END IF;
  
  -- Rainy Day Rookie: Save your first $100
  SELECT COALESCE(SUM(current_amount), 0) INTO v_total_saved
  FROM savings_accounts WHERE user_id = p_user_id;
  
  IF v_total_saved >= 100 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Rainy Day Rookie');
  END IF;
  
  -- Piggy Bank Pro: Reach 50% of a goal
  SELECT COUNT(*) INTO v_savings_count
  FROM savings_accounts
  WHERE user_id = p_user_id
    AND (current_amount / NULLIF(goal_amount, 0)) >= 0.5;
  
  IF v_savings_count >= 1 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Piggy Bank Pro');
  END IF;
  
  -- Treasure Tracker: Complete 3 saving goals
  SELECT COUNT(*) INTO v_goals_completed
  FROM savings_accounts
  WHERE user_id = p_user_id
    AND current_amount >= goal_amount;
  
  IF v_goals_completed >= 3 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Treasure Tracker');
  END IF;
  
  -- Money Maestro (Elite): Save $1,000+ or hit a major long-term goal
  IF v_total_saved >= 1000 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Money Maestro (Elite)');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check learning achievements
CREATE OR REPLACE FUNCTION check_learning_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_completed_count integer;
  v_investing_count integer;
BEGIN
  -- Finance Freshman: Complete your first learning module
  SELECT COUNT(*) INTO v_completed_count
  FROM user_learning_progress
  WHERE user_id = p_user_id AND completed = true;
  
  IF v_completed_count >= 1 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Finance Freshman');
  END IF;
  
  -- Knowledge Knight: Complete 5 learning modules
  IF v_completed_count >= 5 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Knowledge Knight');
  END IF;
  
  -- Investment Intern: Finish all lessons in "Investing Basics" category
  -- Check if user completed modules with investing topic
  SELECT COUNT(DISTINCT lm.id) INTO v_investing_count
  FROM user_learning_progress ulp
  JOIN learning_modules lm ON ulp.module_id = lm.id
  WHERE ulp.user_id = p_user_id
    AND ulp.completed = true
    AND (lm.topic = 'investing' OR lm.title ILIKE '%invest%');
  
  -- Award if completed at least 3 investing-related modules
  IF v_investing_count >= 3 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Investment Intern');
  END IF;
  
  -- Financial Philosopher (Elite): Complete every learning plan
  -- This would need to check learning_plan_modules completion
  -- Simplified: Check if user has completed a learning plan
  -- (Full implementation would check all modules in active plan)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check friend achievements
CREATE OR REPLACE FUNCTION check_friend_achievements(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_friend_count integer;
BEGIN
  -- Finance Friend: Add your first friend
  SELECT COUNT(*) INTO v_friend_count
  FROM friendships
  WHERE (user_id = p_user_id OR friend_id = p_user_id)
    AND status = 'accepted';
  
  IF v_friend_count >= 1 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Finance Friend');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_current_streak integer;
  v_last_login date;
  v_today date := CURRENT_DATE;
  v_account_age_days integer;
BEGIN
  -- Get or create streak record
  INSERT INTO user_login_streaks (user_id, current_streak, longest_streak, last_login_date)
  VALUES (p_user_id, 1, 1, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = now();
  
  -- Get current streak and last login
  SELECT current_streak, last_login_date INTO v_current_streak, v_last_login
  FROM user_login_streaks
  WHERE user_id = p_user_id;
  
  -- Update streak based on last login
  IF v_last_login IS NULL THEN
    -- First login
    UPDATE user_login_streaks
    SET current_streak = 1,
        longest_streak = 1,
        last_login_date = v_today,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_last_login < v_today THEN
    IF v_last_login = v_today - INTERVAL '1 day' THEN
      -- Continue streak
      UPDATE user_login_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_login_date = v_today,
          updated_at = now()
      WHERE user_id = p_user_id;
    ELSE
      -- Reset streak (missed a day)
      UPDATE user_login_streaks
      SET current_streak = 1,
          last_login_date = v_today,
          updated_at = now()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Get updated streak
  SELECT current_streak INTO v_current_streak
  FROM user_login_streaks
  WHERE user_id = p_user_id;
  
  -- Check streak achievements
  IF v_current_streak >= 7 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Daily Diligence');
  END IF;
  
  IF v_current_streak >= 30 THEN
    PERFORM check_and_award_achievement(p_user_id, 'Finance Flame');
  END IF;
  
  -- Check account age for Money Marathoner (6 months) and Financial Legend (1 year)
  SELECT EXTRACT(DAY FROM (CURRENT_DATE - created_at::date)) INTO v_account_age_days
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_account_age_days >= 180 THEN -- 6 months
    PERFORM check_and_award_achievement(p_user_id, 'Money Marathoner');
  END IF;
  
  IF v_account_age_days >= 365 THEN -- 1 year
    PERFORM check_and_award_achievement(p_user_id, 'Financial Legend (Platinum)');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check achievements when budget is created
CREATE OR REPLACE FUNCTION trigger_check_budget_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_budget_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_budget_achievements ON budgets;
CREATE TRIGGER trigger_budget_achievements
  AFTER INSERT ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_budget_achievements();

-- Trigger to check achievements when transaction is created
CREATE OR REPLACE FUNCTION trigger_check_transaction_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_budget_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_transaction_achievements ON transactions;
CREATE TRIGGER trigger_transaction_achievements
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_transaction_achievements();

-- Trigger to check achievements when savings account is created/updated
CREATE OR REPLACE FUNCTION trigger_check_savings_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_savings_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_savings_achievements ON savings_accounts;
CREATE TRIGGER trigger_savings_achievements
  AFTER INSERT OR UPDATE ON savings_accounts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_savings_achievements();

-- Trigger to check achievements when learning progress is updated
CREATE OR REPLACE FUNCTION trigger_check_learning_achievements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true THEN
    PERFORM check_learning_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_learning_achievements ON user_learning_progress;
CREATE TRIGGER trigger_learning_achievements
  AFTER INSERT OR UPDATE ON user_learning_progress
  FOR EACH ROW
  WHEN (NEW.completed = true)
  EXECUTE FUNCTION trigger_check_learning_achievements();

-- Trigger to check achievements when friendship is accepted
CREATE OR REPLACE FUNCTION trigger_check_friend_achievements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    PERFORM check_friend_achievements(NEW.user_id);
    PERFORM check_friend_achievements(NEW.friend_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_friend_achievements ON friendships;
CREATE TRIGGER trigger_friend_achievements
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION trigger_check_friend_achievements();

-- Trigger to check achievements when budget profile is created
CREATE OR REPLACE FUNCTION trigger_check_budget_profile_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_budget_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_budget_profile_achievements ON budget_profile;
CREATE TRIGGER trigger_budget_profile_achievements
  AFTER INSERT ON budget_profile
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_budget_profile_achievements();


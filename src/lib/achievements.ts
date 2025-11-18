import { supabase } from './supabase';

/**
 * Check and award achievements for a user
 * This can be called after user actions or on login
 */
export async function checkAllAchievements(userId: string) {
  try {
    // Call the database function to check all achievements
    const { error } = await supabase.rpc('check_budget_achievements', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking budget achievements:', error);
    }

    // Check savings achievements
    await supabase.rpc('check_savings_achievements', {
      p_user_id: userId,
    });

    // Check learning achievements
    await supabase.rpc('check_learning_achievements', {
      p_user_id: userId,
    });

    // Check friend achievements
    await supabase.rpc('check_friend_achievements', {
      p_user_id: userId,
    });

    // Update login streak (this also checks streak achievements)
    await supabase.rpc('update_login_streak', {
      p_user_id: userId,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Check achievements after a specific action
 */
export async function checkAchievementsAfterAction(
  userId: string,
  actionType: 'budget' | 'transaction' | 'savings' | 'learning' | 'friend' | 'login'
) {
  try {
    switch (actionType) {
      case 'budget':
        await supabase.rpc('check_budget_achievements', { p_user_id: userId });
        break;
      case 'transaction':
        await supabase.rpc('check_budget_achievements', { p_user_id: userId });
        break;
      case 'savings':
        await supabase.rpc('check_savings_achievements', { p_user_id: userId });
        break;
      case 'learning':
        await supabase.rpc('check_learning_achievements', { p_user_id: userId });
        break;
      case 'friend':
        await supabase.rpc('check_friend_achievements', { p_user_id: userId });
        break;
      case 'login':
        await supabase.rpc('update_login_streak', { p_user_id: userId });
        break;
    }
  } catch (error) {
    console.error(`Error checking ${actionType} achievements:`, error);
  }
}

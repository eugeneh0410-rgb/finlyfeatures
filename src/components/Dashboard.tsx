import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Target, BookOpen, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  savingsProgress: number;
  learningProgress: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    savingsProgress: 0,
    learningProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('date', `${currentMonth}-01`);

      const totalIncome = transactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpenses = transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const { data: savings } = await supabase
        .from('savings_accounts')
        .select('goal_amount, current_amount')
        .eq('user_id', user.id);

      const totalGoal = savings?.reduce((sum, s) => sum + Number(s.goal_amount), 0) || 1;
      const totalSaved = savings?.reduce((sum, s) => sum + Number(s.current_amount), 0) || 0;
      const savingsProgress = (totalSaved / totalGoal) * 100;

      const { data: modules } = await supabase
        .from('learning_modules')
        .select('id');

      const { data: completed } = await supabase
        .from('user_learning_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const learningProgress = modules && modules.length > 0
        ? ((completed?.length || 0) / modules.length) * 100
        : 0;

      setStats({
        totalIncome,
        totalExpenses,
        savingsProgress: Math.min(savingsProgress, 100),
        learningProgress,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const balance = stats.totalIncome - stats.totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.totalIncome.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`${balance >= 0 ? 'bg-emerald-100' : 'bg-orange-100'} p-3 rounded-lg`}>
              <DollarSign className={`w-6 h-6 ${balance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
            ${Math.abs(balance).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Savings Progress</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.savingsProgress.toFixed(0)}%
          </p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all"
              style={{ width: `${stats.savingsProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="bg-purple-100 p-3 rounded-lg mr-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
            <p className="text-sm text-gray-600">Keep building your financial knowledge</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className="bg-purple-600 rounded-full h-3 transition-all"
              style={{ width: `${stats.learningProgress}%` }}
            ></div>
          </div>
          <span className="ml-4 text-lg font-semibold text-gray-900">
            {stats.learningProgress.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

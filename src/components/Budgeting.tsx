import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, TrendingUp, TrendingDown, Trash2, Users, Lock, Unlock, Target, AlertCircle, CreditCard as Edit } from 'lucide-react';
import { BudgetQuestionnaire, QuestionnaireData } from './BudgetQuestionnaire';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface SavingsAccount {
  id: string;
  name: string;
  goal_amount: number;
  current_amount: number;
  is_public: boolean;
}

interface FriendSavings {
  name: string;
  goal_amount: number;
  current_amount: number;
  friend_name: string;
}

interface BudgetProfile {
  monthly_income: number;
  top_spending_category: string;
  cut_spending_category: string;
  savings_goal_percentage: number;
  financial_goals: string[];
  spending_habits: string;
}

export function Budgeting() {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [budgetProfile, setBudgetProfile] = useState<BudgetProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'savings' | 'friends'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [friendsSavings, setFriendsSavings] = useState<FriendSavings[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const [loading, setLoading] = useState(true);

  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [savingsForm, setSavingsForm] = useState({
    name: '',
    goal_amount: '',
    current_amount: '',
    is_public: false,
  });

  useEffect(() => {
    checkBudgetProfile();
  }, [user]);

  useEffect(() => {
    if (hasProfile) {
      loadData();
    }
  }, [user, activeTab, hasProfile]);

  const checkBudgetProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('budget_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setBudgetProfile(data);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Error checking budget profile:', error);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (data: QuestionnaireData) => {
    if (!user) return;

    try {
      await supabase.from('budget_profile').insert({
        user_id: user.id,
        ...data,
      });

      setBudgetProfile(data);
      setHasProfile(true);
    } catch (error) {
      console.error('Error saving budget profile:', error);
    }
  };

  const handleResetProfile = async () => {
    if (!user) return;

    const confirm = window.confirm('Are you sure you want to reset your budget profile? This will allow you to retake the questionnaire.');
    if (!confirm) return;

    try {
      await supabase
        .from('budget_profile')
        .delete()
        .eq('user_id', user.id);

      setBudgetProfile(null);
      setHasProfile(false);
    } catch (error) {
      console.error('Error resetting profile:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(50);

        setTransactions(data || []);
      } else if (activeTab === 'savings') {
        const { data } = await supabase
          .from('savings_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setSavings(data || []);
      } else if (activeTab === 'friends') {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('friend_id, user_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (friendships && friendships.length > 0) {
          const friendIds = friendships.map((f) =>
            f.user_id === user.id ? f.friend_id : f.user_id
          );

          const { data: friendsData } = await supabase
            .from('savings_accounts')
            .select(`
              name,
              goal_amount,
              current_amount,
              user_id,
              profiles!inner(full_name)
            `)
            .in('user_id', friendIds)
            .eq('is_public', true);

          const formatted = friendsData?.map((item: any) => ({
            name: item.name,
            goal_amount: item.goal_amount,
            current_amount: item.current_amount,
            friend_name: item.profiles.full_name,
          })) || [];

          setFriendsSavings(formatted);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        category: transactionForm.category,
        description: transactionForm.description,
        date: transactionForm.date,
      });

      setTransactionForm({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddTransaction(false);
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await supabase.from('savings_accounts').insert({
        user_id: user.id,
        name: savingsForm.name,
        goal_amount: parseFloat(savingsForm.goal_amount),
        current_amount: parseFloat(savingsForm.current_amount),
        is_public: savingsForm.is_public,
      });

      setSavingsForm({
        name: '',
        goal_amount: '',
        current_amount: '',
        is_public: false,
      });
      setShowAddSavings(false);
      loadData();
    } catch (error) {
      console.error('Error adding savings:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await supabase.from('transactions').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleUpdateSavings = async (id: string, amount: number) => {
    try {
      await supabase
        .from('savings_accounts')
        .update({ current_amount: amount })
        .eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error updating savings:', error);
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    try {
      await supabase
        .from('savings_accounts')
        .update({ is_public: !isPublic })
        .eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error toggling public:', error);
    }
  };

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Salary',
    'Freelance',
    'Investment',
    'Other',
  ];

  if (loading && hasProfile === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  if (hasProfile === false) {
    return <BudgetQuestionnaire onComplete={handleQuestionnaireComplete} />;
  }

  const savingsGoalAmount = budgetProfile
    ? (budgetProfile.monthly_income * budgetProfile.savings_goal_percentage) / 100
    : 0;

  const spendingBudget = budgetProfile
    ? budgetProfile.monthly_income - savingsGoalAmount
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Budgeting & Savings</h2>
        <button
          onClick={handleResetProfile}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <Edit className="w-4 h-4 mr-2" />
          Retake Quiz
        </button>
      </div>

      {budgetProfile && (
        <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Your Personalized Budget Plan</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Monthly Income</p>
              <p className="text-2xl font-bold">${budgetProfile.monthly_income.toFixed(2)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Savings Goal ({budgetProfile.savings_goal_percentage}%)</p>
              <p className="text-2xl font-bold">${savingsGoalAmount.toFixed(2)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-primary-100 text-sm mb-1">Spending Budget</p>
              <p className="text-2xl font-bold">${spendingBudget.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 mr-2" />
                <p className="font-semibold">Your Financial Goals</p>
              </div>
              <ul className="space-y-1 text-sm text-primary-100">
                {budgetProfile.financial_goals.map((goal, idx) => (
                  <li key={idx}>• {goal}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p className="font-semibold">Focus Areas</p>
              </div>
              <p className="text-sm text-primary-100 mb-1">
                <span className="font-medium">Top spending:</span> {budgetProfile.top_spending_category}
              </p>
              <p className="text-sm text-primary-100">
                <span className="font-medium">Cut back on:</span> {budgetProfile.cut_spending_category}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'transactions'
              ? 'bg-white text-secondary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'savings'
              ? 'bg-white text-secondary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Savings
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'friends'
              ? 'bg-white text-secondary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Friends
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>

          {showAddTransaction && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Transaction</h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                    className={`flex-1 py-2 rounded-lg font-medium transition ${
                      transactionForm.type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                    className={`flex-1 py-2 rounded-lg font-medium transition ${
                      transactionForm.type === 'income'
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-secondary-500 text-white py-2 rounded-lg font-medium hover:bg-secondary-600 transition"
                  >
                    Add Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No transactions yet. Add your first transaction above.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-lg ${
                            transaction.type === 'income' ? 'bg-primary-200' : 'bg-red-100'
                          }`}
                        >
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-secondary-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.category}</p>
                          <p className="text-sm text-gray-500">{transaction.description || 'No description'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p
                          className={`text-lg font-semibold ${
                            transaction.type === 'income' ? 'text-secondary-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'savings' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowAddSavings(!showAddSavings)}
            className="flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Savings Goal
          </button>

          {showAddSavings && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Savings Goal</h3>
              <form onSubmit={handleAddSavings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                  <input
                    type="text"
                    value={savingsForm.name}
                    onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={savingsForm.goal_amount}
                      onChange={(e) => setSavingsForm({ ...savingsForm, goal_amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={savingsForm.current_amount}
                      onChange={(e) => setSavingsForm({ ...savingsForm, current_amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={savingsForm.is_public}
                    onChange={(e) => setSavingsForm({ ...savingsForm, is_public: e.target.checked })}
                    className="w-4 h-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500"
                  />
                  <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                    Share with friends
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-secondary-500 text-white py-2 rounded-lg font-medium hover:bg-secondary-600 transition"
                  >
                    Create Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSavings(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
              </div>
            ) : savings.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                No savings goals yet. Create your first goal above.
              </div>
            ) : (
              savings.map((account) => {
                const progress = (account.current_amount / account.goal_amount) * 100;
                return (
                  <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <button
                        onClick={() => handleTogglePublic(account.id, account.is_public)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                        title={account.is_public ? 'Public' : 'Private'}
                      >
                        {account.is_public ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
                      </div>

                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary-500 rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          ${Number(account.current_amount).toFixed(2)}
                        </span>
                        <span className="text-gray-600">
                          ${Number(account.goal_amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-xs text-gray-600 mb-2">Update amount</label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={account.current_amount}
                          onBlur={(e) => {
                            const newAmount = parseFloat(e.target.value);
                            if (newAmount !== account.current_amount && newAmount >= 0) {
                              handleUpdateSavings(account.id, newAmount);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Friend Connections</p>
                <p className="text-sm text-blue-700 mt-1">
                  View your friends' public savings goals for motivation and accountability.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
            </div>
          ) : friendsSavings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No friends with public savings goals yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friendsSavings.map((saving, index) => {
                const progress = (saving.current_amount / saving.goal_amount) * 100;
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-secondary-600 font-semibold">
                          {saving.friend_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{saving.friend_name}</p>
                        <p className="text-sm text-gray-600">{saving.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
                      </div>

                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary-500 rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          ${Number(saving.current_amount).toFixed(2)}
                        </span>
                        <span className="text-gray-600">
                          ${Number(saving.goal_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Video, FileText, Check, Send, MessageCircle } from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article';
  content_url: string;
  duration_minutes: number;
  order_index: number;
}

interface UserProgress {
  module_id: string;
  completed: boolean;
}

interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export function Learning() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'modules' | 'ai'>('modules');
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [askingAI, setAskingAI] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'modules') {
        const { data: modulesData } = await supabase
          .from('learning_modules')
          .select('*')
          .order('order_index', { ascending: true });

        const { data: progressData } = await supabase
          .from('user_learning_progress')
          .select('module_id, completed')
          .eq('user_id', user.id);

        setModules(modulesData || []);
        setProgress(progressData || []);
      } else {
        const { data: questionsData } = await supabase
          .from('ai_questions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setAiQuestions(questionsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (moduleId: string, currentlyCompleted: boolean) => {
    if (!user) return;

    try {
      const existingProgress = progress.find((p) => p.module_id === moduleId);

      if (existingProgress) {
        await supabase
          .from('user_learning_progress')
          .update({
            completed: !currentlyCompleted,
            completed_at: !currentlyCompleted ? new Date().toISOString() : null,
          })
          .eq('user_id', user.id)
          .eq('module_id', moduleId);
      } else {
        await supabase.from('user_learning_progress').insert({
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.trim()) return;

    setAskingAI(true);
    try {
      const answer = generateAIAnswer(newQuestion);

      await supabase.from('ai_questions').insert({
        user_id: user.id,
        question: newQuestion,
        answer: answer,
      });

      setNewQuestion('');
      loadData();
    } catch (error) {
      console.error('Error asking AI:', error);
    } finally {
      setAskingAI(false);
    }
  };

  const generateAIAnswer = (question: string): string => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('budget') || lowerQ.includes('budgeting')) {
      return "Creating a budget is essential for financial health. Start by tracking your income and expenses for a month. Then, allocate your money using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment. Review and adjust your budget monthly to stay on track.";
    }

    if (lowerQ.includes('save') || lowerQ.includes('saving')) {
      return "Saving money starts with paying yourself first. Set up automatic transfers to your savings account right after you get paid. Start with an emergency fund of 3-6 months of expenses. Then work on specific goals like a down payment or vacation fund. Even small amounts add up over time.";
    }

    if (lowerQ.includes('debt') || lowerQ.includes('loan')) {
      return "To manage debt effectively, list all your debts with their interest rates. Focus on paying off high-interest debt first while making minimum payments on others. Consider the debt avalanche method (highest interest first) or debt snowball method (smallest balance first). Avoid taking on new debt while paying off existing ones.";
    }

    if (lowerQ.includes('credit') || lowerQ.includes('score')) {
      return "Your credit score is crucial for financial opportunities. To build good credit: pay bills on time, keep credit card balances low (under 30% of your limit), don't close old credit cards, and check your credit report regularly for errors. Building good credit takes time but is worth the effort.";
    }

    if (lowerQ.includes('invest') || lowerQ.includes('investing')) {
      return "Investing helps your money grow over time. Start with understanding your risk tolerance and time horizon. For beginners, consider low-cost index funds or ETFs. Diversify your investments across different asset classes. Start early, even with small amounts, to benefit from compound interest. Consider maxing out any employer 401(k) match first.";
    }

    if (lowerQ.includes('emergency') || lowerQ.includes('fund')) {
      return "An emergency fund is your financial safety net. Aim to save 3-6 months of living expenses in a high-yield savings account. Start small with a goal of $1,000, then build from there. This fund should only be used for true emergencies like job loss, medical issues, or urgent home repairs.";
    }

    if (lowerQ.includes('student') || lowerQ.includes('college')) {
      return "Managing finances as a student is challenging but important. Create a realistic budget including tuition, books, housing, and food. Look for student discounts, buy used textbooks, and consider part-time work. Minimize student loan debt by applying for scholarships and grants. If you do take loans, understand the terms and repayment options.";
    }

    return "That's a great financial question! Personal finance involves budgeting, saving, managing debt, and investing. Start by tracking your spending, creating a budget, building an emergency fund, and educating yourself about money management. Consider your specific situation and goals, and don't hesitate to seek advice from financial professionals when needed.";
  };

  const isModuleCompleted = (moduleId: string) => {
    return progress.some((p) => p.module_id === moduleId && p.completed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning</h2>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'modules'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Learning Modules
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'ai'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ask AI
        </button>
      </div>

      {activeTab === 'modules' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No learning modules available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => {
                const completed = isModuleCompleted(module.id);
                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div
                          className={`p-3 rounded-lg ${
                            module.type === 'video' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}
                        >
                          {module.type === 'video' ? (
                            <Video className="w-6 h-6 text-purple-600" />
                          ) : (
                            <FileText className="w-6 h-6 text-blue-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                            {completed && (
                              <div className="ml-3 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                                Completed
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{module.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="capitalize">{module.type}</span>
                            {module.duration_minutes && (
                              <>
                                <span>•</span>
                                <span>{module.duration_minutes} min</span>
                              </>
                            )}
                          </div>

                          <div className="mt-4 flex space-x-3">
                            <a
                              href={module.content_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium"
                            >
                              Start Learning
                            </a>
                            <button
                              onClick={() => handleToggleComplete(module.id, completed)}
                              className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                                completed
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {completed ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {completed && (
                        <div className="ml-4">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Ask Your Financial Questions</h3>
            </div>

            <form onSubmit={handleAskAI} className="space-y-3">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask anything about budgeting, saving, investing, credit scores, or managing money..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                required
              />

              <button
                type="submit"
                disabled={askingAI || !newQuestion.trim()}
                className="flex items-center px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {askingAI ? 'Thinking...' : 'Ask Question'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : aiQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No questions asked yet. Start by asking a question above!
            </div>
          ) : (
            <div className="space-y-4">
              {aiQuestions.map((qa) => (
                <div key={qa.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2">{qa.question}</p>
                      <p className="text-gray-600 text-sm leading-relaxed mb-2">{qa.answer}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(qa.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

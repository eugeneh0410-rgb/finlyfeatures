import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Video, FileText, Check, Send, MessageCircle, Calendar, Target, Clock, Plus, X } from 'lucide-react';

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

interface LearningPlan {
  id: string;
  name: string | null;
  preference_type: 'lessons_per_week' | 'time_per_day';
  preference_value: number;
  start_date: string;
  is_active: boolean;
}

interface PlanModule {
  id: string;
  module_id: string;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  module: LearningModule;
}

const AVAILABLE_TOPICS = [
  'budgeting',
  'saving',
  'investing',
  'credit',
  'debt',
  'all'
];

export function Learning() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'modules' | 'ai' | 'plan'>('modules');
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [askingAI, setAskingAI] = useState(false);
  
  // Learning Plan state
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [preferenceType, setPreferenceType] = useState<'lessons_per_week' | 'time_per_day'>('lessons_per_week');
  const [preferenceValue, setPreferenceValue] = useState<number>(3);
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPlan, setCurrentPlan] = useState<LearningPlan | null>(null);
  const [planModules, setPlanModules] = useState<PlanModule[]>([]);
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  useEffect(() => {
    if (activeTab === 'plan') {
      loadLearningPlan();
    }
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
      } else if (activeTab === 'ai') {
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

  const loadLearningPlan = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get active plan
      const { data: planData } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (planData) {
        setCurrentPlan(planData);

        // Get plan modules
        const { data: modulesData } = await supabase
          .from('learning_plan_modules')
          .select(`
            *,
            module:learning_modules(*)
          `)
          .eq('plan_id', planData.id)
          .order('scheduled_date', { ascending: true });

        if (modulesData) {
          setPlanModules(modulesData.map((item: any) => ({
            id: item.id,
            module_id: item.module_id,
            scheduled_date: item.scheduled_date,
            completed: item.completed,
            completed_at: item.completed_at,
            order_index: item.order_index,
            module: item.module,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading learning plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPlan = async () => {
    if (!user || selectedTopics.length === 0) return;

    setCreatingPlan(true);
    try {
      // Deactivate existing plans
      await supabase
        .from('learning_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Get modules based on selected topics
      let modulesQuery = supabase
        .from('learning_modules')
        .select('*')
        .order('order_index', { ascending: true });

      // Filter by topics if not 'all'
      if (!selectedTopics.includes('all')) {
        modulesQuery = modulesQuery.in('topic', selectedTopics);
      }

      const { data: availableModules } = await modulesQuery;

      if (!availableModules || availableModules.length === 0) {
        alert('No modules found for selected topics. Please select different topics.');
        setCreatingPlan(false);
        return;
      }

      // Calculate schedule
      const start = new Date(startDate);
      const schedule: Array<{ module: LearningModule; date: Date }> = [];

      if (preferenceType === 'lessons_per_week') {
        // Distribute lessons across the week
        const lessonsPerWeek = preferenceValue;
        const daysPerWeek = 7;
        const lessonsPerDay = Math.ceil(lessonsPerWeek / daysPerWeek);
        
        let currentDate = new Date(start);
        let moduleIndex = 0;

        while (moduleIndex < availableModules.length) {
          // Skip weekends (optional - you can remove this)
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          for (let i = 0; i < lessonsPerDay && moduleIndex < availableModules.length; i++) {
            schedule.push({
              module: availableModules[moduleIndex],
              date: new Date(currentDate),
            });
            moduleIndex++;
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Time per day - fit modules based on duration
        const minutesPerDay = preferenceValue;
        let currentDate = new Date(start);
        let moduleIndex = 0;

        while (moduleIndex < availableModules.length) {
          let dailyMinutes = 0;
          const dayModules: LearningModule[] = [];

          // Fill the day with modules
          while (moduleIndex < availableModules.length && dailyMinutes < minutesPerDay) {
            const module = availableModules[moduleIndex];
            const moduleDuration = module.duration_minutes || 15; // Default 15 min

            if (dailyMinutes + moduleDuration <= minutesPerDay) {
              dayModules.push(module);
              dailyMinutes += moduleDuration;
              moduleIndex++;
            } else {
              break;
            }
          }

          // Schedule all modules for this day
          dayModules.forEach((module) => {
            schedule.push({
              module,
              date: new Date(currentDate),
            });
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // Create the plan
      const { data: newPlan, error: planError } = await supabase
        .from('learning_plans')
        .insert({
          user_id: user.id,
          name: planName || null,
          preference_type: preferenceType,
          preference_value: preferenceValue,
          start_date: startDate,
          is_active: true,
        })
        .select()
        .single();

      if (planError || !newPlan) {
        throw planError;
      }

      // Save topics
      if (selectedTopics.length > 0) {
        await supabase.from('learning_plan_topics').insert(
          selectedTopics.map((topic) => ({
            plan_id: newPlan.id,
            topic,
          }))
        );
      }

      // Create plan modules
      const planModulesData = schedule.map((item, index) => ({
        plan_id: newPlan.id,
        module_id: item.module.id,
        scheduled_date: item.date.toISOString().split('T')[0],
        order_index: index,
      }));

      await supabase.from('learning_plan_modules').insert(planModulesData);

      // Reset form
      setShowCreatePlan(false);
      setSelectedTopics([]);
      setPlanName('');
      setPreferenceValue(3);
      setPreferenceType('lessons_per_week');

      // Reload plan
      await loadLearningPlan();
    } catch (error) {
      console.error('Error creating learning plan:', error);
      alert('Failed to create learning plan. Please try again.');
    } finally {
      setCreatingPlan(false);
    }
  };

  const toggleTopic = (topic: string) => {
    if (topic === 'all') {
      setSelectedTopics(['all']);
    } else {
      setSelectedTopics((prev) => {
        const filtered = prev.filter((t) => t !== 'all');
        if (filtered.includes(topic)) {
          return filtered.filter((t) => t !== topic);
        } else {
          return [...filtered, topic];
        }
      });
    }
  };

  const handleCompletePlanModule = async (planModuleId: string, moduleId: string) => {
    if (!user || !currentPlan) return;

    try {
      await supabase
        .from('learning_plan_modules')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', planModuleId);

      // Also update user learning progress
      await supabase.from('user_learning_progress').upsert({
        user_id: user.id,
        module_id: moduleId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

      await loadLearningPlan();
      await loadData();
    } catch (error) {
      console.error('Error completing plan module:', error);
    }
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
              ? 'bg-white text-secondary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Learning Modules
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'plan'
              ? 'bg-white text-secondary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Learning Plan
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'ai'
              ? 'bg-white text-secondary-600 shadow-sm'
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
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
                            module.type === 'video' ? 'bg-primary-200' : 'bg-blue-100'
                          }`}
                        >
                          {module.type === 'video' ? (
                            <Video className="w-6 h-6 text-secondary-600" />
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
                              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition text-sm font-medium"
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
              <MessageCircle className="w-6 h-6 text-secondary-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Ask Your Financial Questions</h3>
            </div>

            <form onSubmit={handleAskAI} className="space-y-3">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask anything about budgeting, saving, investing, credit scores, or managing money..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
                rows={3}
                required
              />

              <button
                type="submit"
                disabled={askingAI || !newQuestion.trim()}
                className="flex items-center px-6 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {askingAI ? 'Thinking...' : 'Ask Question'}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
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
                    <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-secondary-600" />
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

      {activeTab === 'plan' && (
        <div className="space-y-4">
          {!currentPlan && !showCreatePlan && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Target className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Plan Yet</h3>
              <p className="text-gray-600 mb-6">
                Create a personalized learning plan based on your interests and schedule
              </p>
              <button
                onClick={() => setShowCreatePlan(true)}
                className="flex items-center justify-center mx-auto px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Learning Plan
              </button>
            </div>
          )}

          {showCreatePlan && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create Learning Plan</h3>
                <button
                  onClick={() => {
                    setShowCreatePlan(false);
                    setSelectedTopics([]);
                    setPlanName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  generateLearningPlan();
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g., My Financial Journey"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Topics to Learn
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                          selectedTopics.includes(topic)
                            ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {topic.charAt(0).toUpperCase() + topic.slice(1)}
                      </button>
                    ))}
                  </div>
                  {selectedTopics.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">Please select at least one topic</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Learning Preference
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => setPreferenceType('lessons_per_week')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                          preferenceType === 'lessons_per_week'
                            ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                            : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <BookOpen className="w-5 h-5 mr-2" />
                          Lessons per Week
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferenceType('time_per_day')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                          preferenceType === 'time_per_day'
                            ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                            : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <Clock className="w-5 h-5 mr-2" />
                          Time per Day
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        max={preferenceType === 'lessons_per_week' ? '14' : '120'}
                        value={preferenceValue}
                        onChange={(e) => setPreferenceValue(parseInt(e.target.value) || 1)}
                        className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        required
                      />
                      <span className="text-gray-700">
                        {preferenceType === 'lessons_per_week'
                          ? 'lessons per week'
                          : 'minutes per day'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={creatingPlan || selectedTopics.length === 0}
                    className="flex-1 px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingPlan ? 'Creating Plan...' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePlan(false);
                      setSelectedTopics([]);
                      setPlanName('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentPlan && !showCreatePlan && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {currentPlan.name || 'My Learning Plan'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-primary-100">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Started {new Date(currentPlan.start_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        {currentPlan.preference_type === 'lessons_per_week' ? (
                          <>
                            <BookOpen className="w-4 h-4 mr-1" />
                            {currentPlan.preference_value} lessons/week
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            {currentPlan.preference_value} min/day
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPlan(null);
                      setPlanModules([]);
                      setShowCreatePlan(true);
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                  >
                    Create New Plan
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">
                      {planModules.filter((m) => m.completed).length} / {planModules.length} completed
                    </span>
                  </div>
                  <div className="mt-2 bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{
                        width: `${
                          planModules.length > 0
                            ? (planModules.filter((m) => m.completed).length / planModules.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">Scheduled Modules</h4>
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
                  </div>
                ) : planModules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                    No modules scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {planModules.map((planModule) => {
                      const scheduledDate = new Date(planModule.scheduled_date);
                      const isPast = scheduledDate < new Date();
                      const isToday =
                        scheduledDate.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={planModule.id}
                          className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
                            planModule.completed
                              ? 'border-emerald-200 bg-emerald-50'
                              : isToday
                              ? 'border-secondary-300 bg-secondary-50'
                              : isPast
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div
                                className={`p-2 rounded-lg ${
                                  planModule.module.type === 'video'
                                    ? 'bg-primary-200'
                                    : 'bg-blue-100'
                                }`}
                              >
                                {planModule.module.type === 'video' ? (
                                  <Video className="w-5 h-5 text-secondary-600" />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-600" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <h5 className="font-semibold text-gray-900">
                                    {planModule.module.title}
                                  </h5>
                                  {planModule.completed && (
                                    <Check className="w-5 h-5 text-emerald-600 ml-2" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {planModule.module.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {scheduledDate.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                    {isToday && (
                                      <span className="ml-2 px-2 py-0.5 bg-secondary-500 text-white rounded-full text-xs font-medium">
                                        Today
                                      </span>
                                    )}
                                  </span>
                                  {planModule.module.duration_minutes && (
                                    <span>
                                      {planModule.module.duration_minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {!planModule.completed && (
                                <button
                                  onClick={() =>
                                    handleCompletePlanModule(planModule.id, planModule.module_id)
                                  }
                                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium"
                                >
                                  Mark Complete
                                </button>
                              )}
                              <a
                                href={planModule.module.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition text-sm font-medium"
                              >
                                Start
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

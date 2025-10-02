import { useState } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';

interface BudgetQuestionnaireProps {
  onComplete: (data: QuestionnaireData) => void;
}

export interface QuestionnaireData {
  monthly_income: number;
  top_spending_category: string;
  cut_spending_category: string;
  savings_goal_percentage: number;
  financial_goals: string[];
  spending_habits: string;
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Other',
];

const financialGoalOptions = [
  'Build Emergency Fund',
  'Pay Off Debt',
  'Save for Major Purchase',
  'Invest for Future',
  'Travel Fund',
  'Home Down Payment',
];

export function BudgetQuestionnaire({ onComplete }: BudgetQuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireData>({
    monthly_income: 0,
    top_spending_category: '',
    cut_spending_category: '',
    savings_goal_percentage: 20,
    financial_goals: [],
    spending_habits: '',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.monthly_income > 0;
      case 2:
        return formData.top_spending_category !== '';
      case 3:
        return formData.cut_spending_category !== '';
      case 4:
        return formData.savings_goal_percentage > 0;
      case 5:
        return formData.financial_goals.length > 0;
      default:
        return false;
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData({
      ...formData,
      financial_goals: formData.financial_goals.includes(goal)
        ? formData.financial_goals.filter((g) => g !== goal)
        : [...formData.financial_goals, goal],
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Budget Setup</h2>
            <span className="text-sm text-gray-600">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="flex space-x-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition ${
                  i < step ? 'bg-secondary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What's your monthly income?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Include all sources: salary, allowance, part-time jobs, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_income || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_income: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="2500.00"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  This helps us create a realistic budget plan tailored to your financial situation.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Where do you spend money the most?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select the category where most of your money goes each month.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setFormData({ ...formData, top_spending_category: category })
                    }
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      formData.top_spending_category === category
                        ? 'border-secondary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{category}</span>
                      {formData.top_spending_category === category && (
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Where do you want to cut spending?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose the category where you'd like to reduce expenses.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setFormData({ ...formData, cut_spending_category: category })
                    }
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      formData.cut_spending_category === category
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{category}</span>
                      {formData.cut_spending_category === category && (
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  How much do you want to save each month?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose a percentage of your income to save. We recommend at least 20%.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Savings Goal
                  </span>
                  <span className="text-2xl font-bold text-secondary-600">
                    {formData.savings_goal_percentage}%
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={formData.savings_goal_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      savings_goal_percentage: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-6">
                <p className="text-sm font-medium text-emerald-900 mb-1">
                  You'll save ${((formData.monthly_income * formData.savings_goal_percentage) / 100).toFixed(2)} per month
                </p>
                <p className="text-sm text-secondary-700">
                  That's ${(((formData.monthly_income * formData.savings_goal_percentage) / 100) * 12).toFixed(2)} per year!
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What are your financial goals?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select all that apply. This helps us give you better recommendations.
                </p>
              </div>

              <div className="space-y-3">
                {financialGoalOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      formData.financial_goals.includes(goal)
                        ? 'border-secondary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{goal}</span>
                      {formData.financial_goals.includes(goal) && (
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any other details about your spending habits? (Optional)
                </label>
                <textarea
                  value={formData.spending_habits}
                  onChange={(e) =>
                    setFormData({ ...formData, spending_habits: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="e.g., I order food delivery often, I need to save for tuition..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`ml-auto flex items-center px-6 py-3 rounded-lg font-medium transition ${
              canProceed()
                ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === totalSteps ? 'Create Budget Plan' : 'Next'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

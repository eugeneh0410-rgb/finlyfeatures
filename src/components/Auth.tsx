import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, BarChart3, Target, PiggyBank, BookOpen, TrendingUp, Star, ArrowRight } from 'lucide-react';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Dashboard',
      description: 'See all your finances at a glance. Track spending, monitor budgets, and get insights that help you make better money decisions.',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      icon: Target,
      title: 'Easy Budgeting',
      description: 'Set up budgets that actually work. Track textbooks, food, entertainment, and more with categories that make sense for student life.',
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      icon: PiggyBank,
      title: 'Smart Savings',
      description: 'Build different savings funds for spring break, textbooks, or emergencies. Set goals and watch your money grow automatically.',
      color: 'bg-green-100 text-green-700'
    },
    {
      icon: BookOpen,
      title: 'Financial Education',
      description: 'Learn investing, credit scores, and money management through bite-sized lessons designed for busy students. No jargon, just results.',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Junior, UC Berkeley',
      text: 'Finly completely changed how I handle money in college. I went from constantly being broke to actually saving for spring break. The budget alerts saved me so many times!',
      avatar: 'S',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Marcus Johnson',
      role: 'Senior, Georgia Tech',
      text: 'The financial education section is pure gold. I learned more about investing and credit in two weeks than in four years of college. Now I\'m actually building my credit score!',
      avatar: 'M',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-400 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Finly</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition">About</a>
              <a href="#reviews" className="text-gray-600 hover:text-gray-900 transition">Reviews</a>
            </nav>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition hidden md:block">
              Join Waitlist
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-yellow-100 rounded-full px-5 py-2.5 flex items-center space-x-2 shadow-sm">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Trusted by 50,000+ college students</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Master Your Money,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
              Master Your Future
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Stop stressing about finances. Finly makes budgeting simple for college students with smart tools, easy fund management, and financial education that actually makes sense.
          </p>
          <div className="text-xl font-semibold text-gray-700 mb-12">
            Everything You Need to Take Control
          </div>
          <p className="text-lg text-gray-600 mb-12">
            Four powerful features designed specifically for the financial challenges college students face
          </p>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Sign In/Up Form Section */}
        <div className="max-w-md mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-yellow-400 p-3 rounded-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {isSignUp ? 'Get Started' : 'Welcome Back'}
            </h2>
            <p className="text-center text-gray-600 mb-8">
              {isSignUp ? 'Create your account to start managing your finances' : 'Sign in to continue your financial journey'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                    required
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="reviews" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Loved by Students Everywhere</h2>
            <p className="text-xl text-gray-600">See what college students are saying about Finly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`${testimonial.bgColor} rounded-xl p-6 shadow-sm`}>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-5 italic text-lg leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${testimonial.bgColor === 'bg-blue-50' ? 'bg-blue-200' : 'bg-yellow-200'} flex items-center justify-center`}>
                    <span className="font-bold text-gray-700 text-lg">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm">
            Finly - Your Personal Finance Companion for College Students & Young Adults
          </p>
        </div>
      </footer>
    </div>
  );
}

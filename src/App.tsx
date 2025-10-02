import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Budgeting } from './components/Budgeting';
import { Learning } from './components/Learning';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'budgeting' | 'learning'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-yellow-50 to-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'dashboard' && <Dashboard />}
      {activeView === 'budgeting' && <Budgeting />}
      {activeView === 'learning' && <Learning />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

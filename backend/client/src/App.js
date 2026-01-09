import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ExpenseTracker from './components/ExpenseTracker';
import './App.css';

// Main app content that handles auth state
const AppContent = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        {isLogin ? (
          <Login switchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register switchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  return <ExpenseTracker />;
};

// Main App wrapper
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;

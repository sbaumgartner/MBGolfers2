import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import PasswordReset from './components/PasswordReset';
import Dashboard from './components/Dashboard';

// Auth wrapper component to handle auth states
const AuthWrapper = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'reset'

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4a9eff 0%, #1e40af 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <div className="loading-spinner" style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto 1rem' 
          }}></div>
          <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
            🏌️ MBGolfers2
          </h3>
          <p style={{ color: '#6b7280' }}>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // If user is not authenticated, show auth forms
  switch (authMode) {
    case 'register':
      return (
        <Register 
          onSwitchToLogin={() => setAuthMode('login')} 
        />
      );
    case 'reset':
      return (
        <PasswordReset 
          onSwitchToLogin={() => setAuthMode('login')} 
        />
      );
    default:
      return (
        <Login 
          onSwitchToRegister={() => setAuthMode('register')}
          onSwitchToReset={() => setAuthMode('reset')}
        />
      );
  }
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AuthWrapper />
      </div>
    </AuthProvider>
  );
}

export default App;
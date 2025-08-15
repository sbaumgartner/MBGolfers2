import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onSwitchToRegister, onSwitchToReset }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const { signIn, loading, error } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signIn(formData.email, formData.password);
    
    if (!result.success) {
      setFormErrors({ submit: result.error });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="golf-header">
          <h1>🏌️ MBGolfers2</h1>
          <p>Welcome back! Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${formErrors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={loading}
            />
            {formErrors.email && (
              <div className="error-message">{formErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
            {formErrors.password && (
              <div className="error-message">{formErrors.password}</div>
            )}
          </div>

          {(error || formErrors.submit) && (
            <div className="error-message mb-4">
              {error || formErrors.submit}
            </div>
          )}

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            onClick={onSwitchToReset}
            className="btn-secondary"
            style={{ background: 'none', border: 'none', color: '#4a9eff', textDecoration: 'underline', cursor: 'pointer' }}
            disabled={loading}
          >
            Forgot your password?
          </button>
        </div>

        <div className="text-center mt-4">
          <p>Don't have an account?{' '}
            <button 
              onClick={onSwitchToRegister}
              style={{ background: 'none', border: 'none', color: '#4a9eff', textDecoration: 'underline', cursor: 'pointer' }}
              disabled={loading}
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Demo Helper */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f0f9ff', 
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>Demo Mode:</strong> Use any email/password to sign in
          <br />
          <strong>Test roles:</strong>
          <br />
          • admin@test.com = Admin role
          <br />
          • leader@test.com = PlaygroupLeader role  
          <br />
          • user@test.com = User role
        </div>
      </div>
    </div>
  );
};

export default Login;
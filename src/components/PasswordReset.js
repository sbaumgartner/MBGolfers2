import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PasswordReset = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { resetPassword, loading, error } = useAuth();

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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await resetPassword(formData.email);
    
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setFormErrors({ submit: result.error });
    }
  };

  if (successMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="golf-header">
            <h1>🏌️ MBGolfers2</h1>
            <p>Password Reset Email Sent</p>
          </div>
          
          <div className="success-message text-center mb-4">
            {successMessage}
          </div>
          
          <button 
            onClick={onSwitchToLogin}
            className="btn"
            style={{ width: '100%' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="golf-header">
          <h1>🏌️ MBGolfers2</h1>
          <p>Reset your password</p>
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
              placeholder="Enter your email address"
              disabled={loading}
            />
            {formErrors.email && (
              <div className="error-message">{formErrors.email}</div>
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
                Sending Reset Email...
              </>
            ) : (
              'Send Reset Email'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p>Remember your password?{' '}
            <button 
              onClick={onSwitchToLogin}
              style={{ background: 'none', border: 'none', color: '#4a9eff', textDecoration: 'underline', cursor: 'pointer' }}
              disabled={loading}
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Demo Notice */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f0f9ff', 
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>Demo Mode:</strong> This will simulate sending a password reset email.
          In production, this will integrate with AWS Cognito.
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
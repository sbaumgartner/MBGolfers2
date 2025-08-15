import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Amplify configuration
import { Amplify } from 'aws-amplify';

// For now, we'll use placeholder config
// This will be replaced with actual Amplify outputs after deployment
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'placeholder',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'placeholder',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
};

// Only configure Amplify if we have real config
if (process.env.REACT_APP_USER_POOL_ID) {
  Amplify.configure(amplifyConfig);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
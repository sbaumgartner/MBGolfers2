import React, { createContext, useContext, useReducer, useEffect } from 'react';

// For now, we'll create a mock auth context since Amplify isn't configured yet
// This will be replaced with actual Amplify Auth once deployed

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Mock auth check - will be replaced with actual Amplify getCurrentUser
    const checkAuthState = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, check localStorage for mock user
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(mockUser) });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    checkAuthState();
  }, []);

  const signIn = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Mock sign in - will be replaced with Amplify signIn
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, accept any email/password combo
      const mockUser = {
        username: email,
        email: email,
        role: email.includes('admin') ? 'Admin' : 
              email.includes('leader') ? 'PlaygroupLeader' : 'User',
        groups: email.includes('admin') ? ['Admin'] : 
                email.includes('leader') ? ['PlaygroupLeader'] : ['User']
      };
      
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      dispatch({ type: 'SET_USER', payload: mockUser });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, attributes) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Mock sign up - will be replaced with Amplify signUp
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, just simulate successful signup
      return { 
        success: true, 
        message: 'Account created successfully! Please check your email for verification.' 
      };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Mock sign out - will be replaced with Amplify signOut
      localStorage.removeItem('mockUser');
      dispatch({ type: 'LOGOUT' });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Mock password reset - will be replaced with Amplify resetPassword
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { 
        success: true, 
        message: 'Password reset email sent! Please check your inbox.' 
      };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
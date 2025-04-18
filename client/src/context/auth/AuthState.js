import React, { useReducer, useEffect } from 'react';
import axios from 'axios';
import AuthContext from './authContext';
import authReducer from './authReducer';
import setAuthToken from '../../utils/setAuthToken';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_ERRORS,
  UPDATE_USER,
  SET_LOADING
} from '../types';

const AuthState = props => {
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
    error: null
  };

  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Check token and load user on mount
  useEffect(() => {
    const loadUserOnMount = async () => {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
        await loadUser();
      } else {
        // If no token, set loading to false
        dispatch({ type: SET_LOADING, payload: false });
      }
    };
    
    loadUserOnMount();
    // eslint-disable-next-line
  }, []);

  // Load User - Optimized for performance
  const loadUser = async () => {
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      // Use a timeout to limit waiting time for server response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await axios.get('/api/auth', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      dispatch({
        type: USER_LOADED,
        payload: res.data
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Request to load user was aborted due to timeout');
      } else {
        console.error('Error loading user:', err);
      }
      dispatch({ type: AUTH_ERROR });
    }
  };

  // Register User
  const register = async formData => {
    // Set loading state
    dispatch({ type: SET_LOADING, payload: true });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/users', formData, config);
      
      // Store token in localStorage and set in headers
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
      }

      // Set user info directly from registration response if available
      if (res.data && res.data.user) {
        dispatch({
          type: REGISTER_SUCCESS,
          payload: {
            ...res.data,
            user: res.data.user
          }
        });
      } else {
        dispatch({
          type: REGISTER_SUCCESS,
          payload: res.data
        });
        
        // Only load user if user data wasn't included in response
        await loadUser();
      }
      
      return { success: true };
    } catch (err) {
      dispatch({
        type: REGISTER_FAIL,
        payload: err.response?.data?.msg || 'Registration failed'
      });
      
      return { success: false, error: err.response?.data?.msg || 'Registration failed' };
    }
  };

  // Login User
  const login = async formData => {
    // Set loading state
    dispatch({ type: SET_LOADING, payload: true });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/auth', formData, config);

      if (res.data && res.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', res.data.token);
        
        // Set token in axios headers
        setAuthToken(res.data.token);
        
        // If user data is included in the response, use it directly
        if (res.data.user) {
          dispatch({
            type: LOGIN_SUCCESS,
            payload: res.data
          });
          
          // No need to make another request to get user data
          return { success: true };
        } else {
          // Dispatch success action
          dispatch({
            type: LOGIN_SUCCESS,
            payload: res.data
          });
          
          // Load user data if not included in response
          await loadUser();
          
          return { success: true };
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      // Clear any token that might be in localStorage
      localStorage.removeItem('token');
      setAuthToken(null);
      
      dispatch({
        type: LOGIN_FAIL,
        payload: err.response?.data?.msg || 'Login failed'
      });
      
      return { success: false, error: err.response?.data?.msg || 'Login failed' };
    }
  };
  
  // Update User
  const updateUser = async formData => {
    // Ensure token is set in headers
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.put('/api/users/profile', formData, config);

      dispatch({
        type: UPDATE_USER,
        payload: res.data
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      
      // Check for specific error messages from the server
      const errorMsg = err.response?.data?.msg || 'Failed to update profile';
      
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  // Logout
  const logout = () => {
    setAuthToken(null);
    dispatch({ type: LOGOUT });
  };

  // Clear Errors
  const clearErrors = () => dispatch({ type: CLEAR_ERRORS });

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        error: state.error,
        register,
        loadUser,
        login,
        logout,
        clearErrors,
        updateUser
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthState; 
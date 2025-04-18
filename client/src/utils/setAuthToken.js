import axios from 'axios';

// Set default timeout to prevent hanging requests
axios.defaults.timeout = 10000; // 10 seconds

const setAuthToken = token => {
  if (token) {
    // Set the token in localStorage for persistence across page refreshes
    localStorage.setItem('token', token);
    
    // Set the default header for axios requests
    axios.defaults.headers.common['x-auth-token'] = token;
    
    // Log for debugging
    console.log('Auth token set:', token.substring(0, 15) + '...');
  } else {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove the header
    delete axios.defaults.headers.common['x-auth-token'];
    
    console.log('Auth token removed');
  }
};

export default setAuthToken; 
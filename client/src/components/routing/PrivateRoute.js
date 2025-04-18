import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

const PrivateRoute = ({ component: Component }) => {
  const authContext = useContext(AuthContext);
  const { isAuthenticated, loading, loadUser } = authContext;
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to prevent endless loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [loading]);

  // Force reload if loading takes too long
  const handleForceReload = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loadingTimeout) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography variant="h6" gutterBottom>
          Loading is taking longer than expected
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleForceReload}
          sx={{ mt: 2 }}
        >
          Return to Login
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return isAuthenticated ? <Component /> : <Navigate to='/login' />;
};

export default PrivateRoute; 
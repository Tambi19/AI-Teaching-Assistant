import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Avatar,
  Grid,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import setAuthToken from '../../utils/setAuthToken';

const Login = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const navigate = useNavigate();

  const { login, error, clearErrors, isAuthenticated, loading: authLoading } = authContext;
  const { setAlert } = alertContext;
  const [localLoading, setLocalLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  // Handle authentication and error state changes
  useEffect(() => {
    // If authentication is successful, navigate to dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // If there was an error and we attempted to log in, show the error
    if (error && loginAttempted) {
      if (error.includes('Invalid Credentials')) {
        setErrorDetails('The email or password you entered is incorrect. Please try again.');
      } else if (error.includes('expired')) {
        setErrorDetails('Your session has expired. Please log in again.');
      } else {
        setErrorDetails(error);
      }
      
      setAlert(error, 'error');
      clearErrors();
      setLocalLoading(false);
      setLoginAttempted(false);
    }

    // If we're no longer loading after a login attempt, reset local loading state
    if (!authLoading && loginAttempted) {
      setLocalLoading(false);
      // Only reset loginAttempted when we have a definitive result
      if (isAuthenticated !== null) {
        setLoginAttempted(false);
      }
    }
    // eslint-disable-next-line
  }, [isAuthenticated, error, authLoading]);

  const [user, setUser] = useState({
    email: '',
    password: ''
  });

  const { email, password } = user;

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = e => {
    e.preventDefault();
    
    // Clear any previous errors
    setErrorDetails(null);
    
    if (email === '' || password === '') {
      setAlert('Please fill in all fields', 'error');
      setErrorDetails('Please enter both email and password.');
      return;
    }
    
    // Set loading states to provide immediate feedback
    setLocalLoading(true);
    setLoginAttempted(true);
    
    // Attempt login - the useEffect above will handle success/error
    login({ email, password });
  };

  const isLoading = localLoading || authLoading;

  return (
    <Grid container justifyContent="center" sx={{ mt: 4 }}>
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            
            {errorDetails && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {errorDetails}
              </Alert>
            )}
            
            <Box
              component="form"
              noValidate
              onSubmit={onSubmit}
              sx={{ mt: 3, width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={onChange}
                disabled={isLoading}
                error={!!errorDetails}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={onChange}
                disabled={isLoading}
                error={!!errorDetails}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="/register" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Teacher demo: teacher@example.com / password123
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Student demo: student@example.com / password123
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Login; 
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert
} from '@mui/material';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';

const JoinCourse = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verify authentication on component mount
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        // Check for token
        const token = localStorage.getItem('token');
        if (!token && isMounted) {
          navigate('/login');
          return;
        }
        
        // Set token in headers for all axios requests
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Fetch user data if needed
        if (!user && isMounted) {
          await loadUser();
        }
        
        // Check if user is a student
        if (user && user.role !== 'student' && isMounted) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        if (isMounted) {
          navigate('/login');
        }
      }
    };
    
    verifyAuth();
    
    return () => {
      isMounted = false;
    };
  }, [user, loadUser, navigate]);

  const onChange = e => {
    setCode(e.target.value.toUpperCase());
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!code) {
      setError('Please enter a course code');
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      };

      const res = await axios.post('/api/courses/join', { code }, config);
      
      setLoading(false);
      setSuccess(`Successfully joined the course: ${res.data.title}`);
      
      // Clear form
      setCode('');
      
      // Redirect to courses page after 2 seconds
      setTimeout(() => {
        navigate('/courses');
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.msg || 'Failed to join course');
      console.error('Join course error:', err);
    }
  };

  // If still loading user data, don't render anything yet
  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Join a Course
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                Enter the course code provided by your teacher to join a course.
              </Typography>
              <TextField
                name="code"
                label="Course Code"
                value={code}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., ABC123"
                inputProps={{ style: { textTransform: 'uppercase' } }}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/courses')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Course'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinCourse; 
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
  Alert,
  Divider,
  CardMedia
} from '@mui/material';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';

const CreateCourse = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user data and verify authentication
  useEffect(() => {
    let isMounted = true;
    
    const initComponent = async () => {
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
        
        // Check if user is a teacher
        if (user && user.role !== 'teacher' && isMounted) {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        if (isMounted) {
          navigate('/login');
        }
      }
    };
    
    initComponent();
    
    return () => {
      isMounted = false;
    };
  }, [user, loadUser, navigate]);

  const { title, description, imageUrl } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Make API call
      await axios.post('/api/courses', formData);
      
      // Set loading to false and navigate
      setLoading(false);
      navigate('/courses');
    } catch (err) {
      console.error('Error creating course:', err);
      setLoading(false);
      setError(err.response?.data?.msg || 'Failed to create course');
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
          Create New Course
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Course Title"
                value={title}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., Introduction to Artificial Intelligence"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Course Description"
                value={description}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                multiline
                rows={4}
                placeholder="Provide a detailed description of the course content and objectives"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Course Image
              </Typography>
              
              <TextField
                name="imageUrl"
                label="Image URL"
                value={imageUrl}
                onChange={onChange}
                fullWidth
                variant="outlined"
                placeholder="Enter a URL for the course banner image (optional)"
                helperText="Enter a valid image URL (e.g., https://example.com/image.jpg)"
                sx={{ mb: 2 }}
                disabled={loading}
              />

              {imageUrl && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Image Preview:
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      overflow: 'hidden',
                      maxHeight: '200px',
                      width: '100%'
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt={title}
                      sx={{ 
                        height: '200px',
                        objectFit: 'cover',
                        width: '100%'
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x150?text=Invalid+Image+URL";
                      }}
                    />
                  </Paper>
                </Box>
              )}
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
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCourse; 
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  CardMedia
} from '@mui/material';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import setAuthToken from '../../utils/setAuthToken';

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(null);

  // Ensure user is loaded and fetch course data
  useEffect(() => {
    if (localStorage.token) {
      loadUser();
    }
    
    const fetchCourse = async () => {
      try {
        // Ensure token is set
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        setAuthToken(token);
        
        const res = await axios.get(`/api/courses/${id}`);
        const { title, description, imageUrl } = res.data;
        
        setFormData({
          title,
          description,
          imageUrl: imageUrl || ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourse();
    // eslint-disable-next-line
  }, [id]);

  const { title, description, imageUrl } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setUpdating(true);

    // Ensure token is set in axios headers
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setUpdating(false);
      return;
    }
    
    setAuthToken(token);

    try {
      const res = await axios.put(`/api/courses/${id}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      setUpdating(false);
      setSuccess('Course updated successfully!');
      
      // Navigate to the course detail page after successful update
      setTimeout(() => {
        navigate(`/courses/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating course:', err);
      setUpdating(false);
      setError(err.response?.data?.msg || 'Failed to update course');
    }
  };

  // Redirect if not a teacher
  if (user && user.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Course
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
              <TextField
                name="title"
                label="Course Title"
                value={title}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., Introduction to Artificial Intelligence"
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
                  onClick={() => navigate(`/courses/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Course'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditCourse; 
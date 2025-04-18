import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  Divider,
  Paper,
  Alert,
  AlertTitle,
  CardMedia
} from '@mui/material';
import AuthContext from '../../context/auth/authContext';
import setAuthToken from '../../utils/setAuthToken';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const navigate = useNavigate();

  // Load courses when component mounts or retry is triggered
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure token is set in headers
        if (localStorage.token) {
          setAuthToken(localStorage.token);
        }
        
        const res = await axios.get('/api/courses');
        setCourses(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, [retryCount]);

  const handleJoinCourse = () => {
    navigate('/courses/join');
  };

  const handleCreateCourse = () => {
    // Simple direct navigation without affecting loading state
    navigate('/courses/create');
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const isTeacher = user && user.role === 'teacher';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Courses
        </Typography>
        <Box>
          {isTeacher ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateCourse}
              sx={{ ml: 2 }}
            >
              Create Course
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinCourse}
              sx={{ ml: 2 }}
            >
              Join Course
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You don't have any courses yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {isTeacher
              ? 'Create your first course to get started'
              : 'Join a course to start learning'}
          </Typography>
          {isTeacher ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateCourse}
              sx={{ mt: 2 }}
            >
              Create Your First Course
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleJoinCourse}
              sx={{ mt: 2 }}
            >
              Find Courses to Join
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={course.imageUrl || `https://source.unsplash.com/random/800x600?education-${course._id}`}
                  alt={course.title}
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/800x600?text=Course+Image";
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {course.description.length > 100
                      ? `${course.description.substring(0, 100)}...`
                      : course.description}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      {course.students ? course.students.length : 0} Students
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={() => handleViewCourse(course._id)}
                    fullWidth
                  >
                    View Course
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Courses; 
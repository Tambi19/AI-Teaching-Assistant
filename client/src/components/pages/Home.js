import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Container
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Home = () => {
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (localStorage.token) {
      authContext.loadUser();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to TeachAI Assistant
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          An AI-powered teaching assistant that automates grading and provides
          personalized feedback to students, enhancing education quality.
        </Typography>
        {!authContext.isAuthenticated ? (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              component={Link}
              to="/register"
              size="large"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/login"
              size="large"
            >
              Login
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              component={Link}
              to="/dashboard"
              size="large"
            >
              Go to Dashboard
            </Button>
          </Box>
        )}
      </Box>

      <Container maxWidth="lg">
        <Typography variant="h4" align="center" sx={{ mb: 4 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'primary.main'
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 60 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  AI-Powered Grading
                </Typography>
                <Typography>
                  Automatically grade assignments using advanced AI technology, saving teachers time and providing consistent evaluation.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'primary.main'
                }}
              >
                <SchoolIcon sx={{ fontSize: 60 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Personalized Feedback
                </Typography>
                <Typography>
                  Provide detailed, constructive feedback tailored to each student's submission to enhance their learning experience.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'primary.main'
                }}
              >
                <PeopleIcon sx={{ fontSize: 60 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Course Management
                </Typography>
                <Typography>
                  Easily create and manage courses, assignments, and student enrollments through an intuitive interface.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  color: 'primary.main'
                }}
              >
                <AssignmentIcon sx={{ fontSize: 60 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Rubric System
                </Typography>
                <Typography>
                  Create detailed rubrics that guide both students and the AI in understanding assessment criteria.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'primary.light', p: 6, mt: 8, color: 'white' }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          component="h2"
        >
          Supporting UN SDG 4: Quality Education
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          TeachAI Assistant helps make quality education more accessible and effective
          by reducing teacher workload, providing personalized learning experiences,
          and creating more time for direct student interaction.
        </Typography>
      </Box>
    </Box>
  );
};

export default Home; 
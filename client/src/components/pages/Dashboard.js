import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import setAuthToken from '../../utils/setAuthToken';

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const navigate = useNavigate();
  
  const { setAlert } = alertContext;
  const { user, loading: authLoading, loadUser } = authContext;
  
  const [stats, setStats] = useState({
    courses: 0,
    assignments: 0,
    students: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load user first if not loaded
  useEffect(() => {
    if (localStorage.token && !user) {
      loadUser();
    }
  }, [loadUser, user]);

  // Fetch dashboard data when user is loaded or retry is triggered
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Ensure token is set
        if (localStorage.token) {
          setAuthToken(localStorage.token);
        }
        
        // Fetch courses
        const courseRes = await axios.get('/api/courses');
        const courses = courseRes.data || [];
        
        let assignments = [];
        let students = 0;
        
        // Get role-specific data
        if (user.role === 'teacher') {
          // For each course, get assignments and count students
          for (const course of courses) {
            try {
              const assignmentRes = await axios.get(`/api/assignments/course/${course._id}`);
              if (assignmentRes.data && Array.isArray(assignmentRes.data)) {
                assignments = [...assignments, ...assignmentRes.data];
              }
              
              if (course.students && Array.isArray(course.students)) {
                students += course.students.length;
              }
            } catch (err) {
              console.error(`Error fetching data for course ${course._id}:`, err);
              // Continue with other courses
            }
          }
        } else {
          // For students, get all assignments
          try {
            const assignmentRes = await axios.get('/api/assignments');
            if (assignmentRes.data && Array.isArray(assignmentRes.data)) {
              assignments = assignmentRes.data;
            }
            
            // Count classmates
            courses.forEach(course => {
              if (course.students && Array.isArray(course.students)) {
                students += course.students.length;
              }
            });
            
            // Don't count self multiple times
            if (students > 0) students--;
          } catch (err) {
            console.error('Error fetching assignments:', err);
          }
        }
        
        // Update stats
        setStats({
          courses: courses.length,
          assignments: assignments.length,
          students
        });
        
        // Create recent activity items
        const activityItems = [];
        
        // Add recent assignments
        if (assignments.length > 0) {
          const sortedAssignments = [...assignments].sort((a, b) => 
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          ).slice(0, 3);
          
          sortedAssignments.forEach(assignment => {
            const date = new Date(assignment.createdAt || assignment.date);
            activityItems.push({
              type: 'assignment',
              text: `Assignment: ${assignment.title}`,
              date: isNaN(date) ? 'Recent' : date.toLocaleDateString()
            });
          });
        }
        
        // Add recent courses
        if (courses.length > 0) {
          const sortedCourses = [...courses].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ).slice(0, 1);
          
          sortedCourses.forEach(course => {
            const date = new Date(course.createdAt);
            activityItems.push({
              type: 'course',
              text: `Course: ${course.title}`,
              date: isNaN(date) ? 'Recent' : date.toLocaleDateString()
            });
          });
        }
        
        setRecentActivity(activityItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, retryCount, authLoading]);

  const handleViewCourses = () => {
    navigate('/courses');
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Show loading spinner while user or data is loading
  if (authLoading || (loading && !error)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You need to be logged in to view the dashboard.
          Please <Button color="inherit" onClick={() => navigate('/login')}>sign in</Button> to continue.
        </Alert>
      </Container>
    );
  }

  const isTeacher = user.role === 'teacher';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome back, {user.name}!
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Stats Overview */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <ClassIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5">{stats.courses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Courses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5">{stats.assignments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assignments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h5">{stats.students}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isTeacher ? 'Students' : 'Classmates'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              fullWidth
              onClick={handleViewCourses}
            >
              View My Courses
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Activity
            </Typography>
            {recentActivity.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.type === 'assignment' ? (
                          <AssignmentIcon />
                        ) : activity.type === 'course' ? (
                          <SchoolIcon />
                        ) : (
                          <AssignmentIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.text}
                        secondary={activity.date}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No recent activity to display.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Teacher-specific content */}
        {isTeacher && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Teacher Tools
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title="Course Management" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Create and manage your courses, add materials, and organize content.
                      </Typography>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Manage Courses
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title="Assignment Creation" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Create assignments, quizzes, and assessments with AI-powered grading.
                      </Typography>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Create Assignment
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title="Student Progress" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Track student performance, review submissions, and provide feedback.
                      </Typography>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        View Student Progress
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {!isTeacher && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                My Learning
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title="Upcoming Assignments" />
                    <CardContent>
                      <Typography variant="body1" color="text.secondary">
                        {stats.assignments > 0 
                          ? `You have ${stats.assignments} assignment(s) to complete.` 
                          : 'No upcoming assignments.'}
                      </Typography>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        View All Assignments
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title="My Progress" />
                    <CardContent>
                      <Typography variant="body2" gutterBottom>
                        Overall Course Completion
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={30} 
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        30% complete
                      </Typography>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        View Detailed Progress
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={() => navigate('/courses/join')}
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Join a New Course
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard; 
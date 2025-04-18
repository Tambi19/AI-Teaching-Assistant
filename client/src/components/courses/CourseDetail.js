import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { loading, user } = authContext;
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [courseLoading, setCourseLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setCourseLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setCourseLoading(false);
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        // Fetch course details
        const courseRes = await axios.get(`/api/courses/${id}`, config);
        
        if (!courseRes.data) {
          setError('Course not found or no data returned');
          setCourseLoading(false);
          return;
        }
        
        setCourse(courseRes.data);
        
        // If course has students property, set students state
        if (courseRes.data.students) {
          setStudents(courseRes.data.students);
        }
        
        // Fetch assignments for this course
        try {
          const assignmentsRes = await axios.get(`/api/assignments/course/${id}`, config);
          setAssignments(assignmentsRes.data);
        } catch (assignErr) {
          console.error('Error fetching assignments:', assignErr);
          // Don't fail the whole course load if assignments can't be fetched
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError(err.response?.data?.msg || 'Failed to load course data. Please try again later.');
      } finally {
        setCourseLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
    
    // Cleanup function
    return () => {
      setCourse(null);
      setAssignments([]);
      setStudents([]);
      setError(null);
    };
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/courses');
  };

  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteCourse = async () => {
    setDeleteLoading(true);
    
    try {
      const config = {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      };
      
      await axios.delete(`/api/courses/${id}`, config);
      
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      
      // Navigate back to courses page
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please try again later.');
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        const config = {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        };
        
        await axios.delete(`/api/assignments/${assignmentId}`, config);
        
        // Remove the deleted assignment from the state
        setAssignments(assignments.filter(a => a._id !== assignmentId));
      } catch (err) {
        console.error('Error deleting assignment:', err);
        setError('Failed to delete assignment. Please try again later.');
      }
    }
  };

  const handleUnenroll = async () => {
    if (window.confirm('Are you sure you want to unenroll from this course? You will lose access to all course materials and assignments.')) {
      try {
        const config = {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        };
        
        await axios.put(`/api/courses/${id}/unenroll`, {}, config);
        
        // Navigate back to courses page
        navigate('/courses');
      } catch (err) {
        console.error('Error unenrolling from course:', err);
        setError('Failed to unenroll from course. Please try again later.');
      }
    }
  };

  if (loading || courseLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Course not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  const isTeacher = user && user.role === 'teacher';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Courses
      </Button>
      
      <Grid container spacing={4}>
        {/* Course Header */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${course.imageUrl || `https://source.unsplash.com/random/1200x400?education-${course._id}`})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white',
              position: 'relative'
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.title}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Chip 
                    icon={<PersonIcon />} 
                    label={`Instructor: ${course.teacher.name}`}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<PeopleIcon />} 
                    label={`Students: ${students.length}`}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<AssignmentIcon />} 
                    label={`Assignments: ${assignments.length}`}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<CalendarTodayIcon />} 
                    label={`Created: ${new Date(course.createdAt).toLocaleDateString()}`}
                    sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    variant="outlined" 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    Course Code: 
                  </Typography>
                  <Chip 
                    label={course.code} 
                    color="primary" 
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'flex-end' }}>
                {isTeacher ? (
                  <Box>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large"
                      component={Link}
                      to={`/courses/${course._id}/edit`}
                      startIcon={<EditIcon />}
                      sx={{ mr: 2 }}
                    >
                      Edit Course
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="large"
                      onClick={handleDeleteDialogOpen}
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Box>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    onClick={handleUnenroll}
                  >
                    Unenroll
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Course Content */}
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="course tabs">
                <Tab label="Overview" />
                <Tab label="Content" />
                <Tab label="Assignments" />
                {isTeacher && <Tab label="Students" />}
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                About This Course
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
              
              {isTeacher && (
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Teacher Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        component={Link}
                        to={`/assignments/create/${course._id}`}
                        startIcon={<AssignmentIcon />}
                      >
                        Create Assignment
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => setTabValue(3)}
                        startIcon={<PeopleIcon />}
                      >
                        Manage Students
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </TabPanel>

            {/* Content Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Course Materials
              </Typography>
              <Typography paragraph>
                No course materials have been added yet.
              </Typography>
              
              {isTeacher && (
                <Button variant="outlined" sx={{ mt: 2 }}>
                  Add Materials
                </Button>
              )}
            </TabPanel>

            {/* Assignments Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Assignments
                </Typography>
                {isTeacher && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    component={Link}
                    to={`/assignments/create/${course._id}`}
                  >
                    Create Assignment
                  </Button>
                )}
              </Box>
              
              <Grid container spacing={3}>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <Grid item xs={12} md={6} key={assignment._id}>
                      <Card>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AssignmentIcon />
                            </Avatar>
                          }
                          title={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {assignment.title}
                              {assignment.attachments && assignment.attachments.length > 0 && (
                                <Chip 
                                  size="small"
                                  icon={<UploadFileIcon fontSize="small" />}
                                  label={`${assignment.attachments.length} File${assignment.attachments.length > 1 ? 's' : ''}`}
                                  sx={{ ml: 1, height: 24 }}
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                          subheader={`Due: ${new Date(assignment.dueDate).toLocaleDateString()} | ${assignment.totalPoints} points`}
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {assignment.description.length > 100 
                              ? `${assignment.description.substring(0, 100)}...` 
                              : assignment.description}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            component={Link}
                            to={isTeacher 
                              ? `/assignments/${assignment._id}/grade` 
                              : `/assignments/${assignment._id}/submit`}
                          >
                            {isTeacher ? 'View Submissions' : 'Submit Assignment'}
                          </Button>
                          {isTeacher && (
                            <>
                              <Button 
                                size="small"
                                component={Link}
                                to={`/assignments/${assignment._id}/edit`}
                                startIcon={<EditIcon />}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAssignment(assignment._id)}
                                startIcon={<DeleteIcon />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      No assignments have been created for this course yet.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            {/* Students Tab (Teacher only) */}
            {isTeacher && (
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>
                  Enrolled Students
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Total Enrolled: {students.length} students
                      </Typography>
                      
                      {students.length > 0 ? (
                        <List>
                          {students.map((student, index) => (
                            <ListItem key={student._id} divider={index < students.length - 1}>
                              <ListItemAvatar>
                                <Avatar>
                                  <PersonIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={student.name} 
                                secondary={student.email} 
                              />
                              <Button 
                                variant="text" 
                                size="small"
                                component={Link}
                                to={`/students/${student._id}/progress?course=${course._id}`}
                              >
                                View Progress
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No students have enrolled in this course yet.
                        </Typography>
                      )}
                      
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => {
                          // Copy course code to clipboard
                          navigator.clipboard.writeText(course.code);
                          alert(`Course code ${course.code} copied to clipboard. Share this with students to allow them to join.`);
                        }}
                      >
                        Copy Enrollment Code
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Course?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this course? This action cannot be undone.
            All associated assignments and student data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCourse} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetail; 
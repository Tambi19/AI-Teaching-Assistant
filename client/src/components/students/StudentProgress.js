import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  CircularProgress, 
  Button, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import GradeIcon from '@mui/icons-material/Grade';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AuthContext from '../../context/auth/authContext';
import axios from 'axios';

const StudentProgress = () => {
  const { id } = useParams(); // student ID
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('course');
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { user, loading: userLoading } = authContext;

  const [student, setStudent] = useState(null);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    graded: 0,
    averageScore: 0,
    progressPercentage: 0
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!courseId) {
        setError('Course ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get student info
        const studentRes = await axios.get(`/api/users/${id}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        // Get course info
        const courseRes = await axios.get(`/api/courses/${courseId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        // Get assignments for course
        const assignmentsRes = await axios.get(`/api/assignments/course/${courseId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        // Get submissions for student in this course
        const submissionsPromises = assignmentsRes.data.map(assignment => 
          axios.get(`/api/submissions/assignment/${assignment._id}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          })
        );
        
        const submissionsResults = await Promise.all(submissionsPromises);
        
        // Filter submissions for the specific student
        const studentSubmissions = submissionsResults.flatMap(res => 
          res.data.filter(sub => sub.student?._id === id || sub.student === id)
        );
        
        // Calculate stats
        const completed = studentSubmissions.length;
        const graded = studentSubmissions.filter(sub => sub.grade !== null).length;
        const gradedSubmissions = studentSubmissions.filter(sub => sub.grade !== null);
        const totalScore = gradedSubmissions.reduce((sum, sub) => sum + sub.grade, 0);
        const averageScore = gradedSubmissions.length > 0 
          ? (totalScore / gradedSubmissions.length).toFixed(1) 
          : 0;
        const progressPercentage = assignmentsRes.data.length > 0 
          ? (completed / assignmentsRes.data.length) * 100 
          : 0;
        
        setStudent(studentRes.data);
        setCourse(courseRes.data);
        setAssignments(assignmentsRes.data);
        setSubmissions(studentSubmissions);
        setStats({
          completed,
          pending: assignmentsRes.data.length - completed,
          graded,
          averageScore,
          progressPercentage
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student progress data:', err);
        setError(err.response?.data?.msg || 'Error fetching student progress data');
        setLoading(false);
      }
    };

    if (!userLoading && user?.role === 'teacher') {
      fetchStudentData();
    }
  }, [id, courseId, userLoading, user]);

  if (userLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );
  }

  if (!student || !course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Loading student information...</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get submission status for an assignment
  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(sub => sub.assignment === assignmentId || sub.assignment?._id === assignmentId);
    if (!submission) return 'Not Submitted';
    if (submission.grade !== null) return 'Graded';
    return 'Submitted';
  };

  // Get submission for an assignment
  const getSubmission = (assignmentId) => {
    return submissions.find(sub => sub.assignment === assignmentId || sub.assignment?._id === assignmentId);
  };

  // Determine if an assignment is past due
  const isPastDue = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        variant="outlined" 
        onClick={() => navigate(-1)} 
        sx={{ mb: 3 }}
      >
        Back
      </Button>
      
      <Grid container spacing={3}>
        {/* Student & Course Information */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h4">
                {student.name}'s Progress
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                icon={<GradeIcon />} 
                label={`Average Score: ${stats.averageScore}%`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<AssignmentIcon />} 
                label={`Course: ${course.title}`} 
                variant="outlined" 
              />
              <Chip 
                icon={<PersonIcon />} 
                label={`Email: ${student.email}`}
                variant="outlined" 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Progress Summary */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progress Summary
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Completion
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.progressPercentage} 
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {stats.progressPercentage.toFixed(0)}% Complete
              </Typography>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Completed Assignments
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.completed} / {assignments.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Graded Assignments
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.graded} / {stats.completed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Average Score
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.averageScore}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Assignment Progress Table */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assignment Progress
            </Typography>
            
            {assignments.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Assignment</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((assignment) => {
                      const status = getSubmissionStatus(assignment._id);
                      const submission = getSubmission(assignment._id);
                      
                      return (
                        <TableRow key={assignment._id}>
                          <TableCell>
                            <Typography variant="body1">
                              {assignment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {assignment.description.substring(0, 100)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon 
                                fontSize="small" 
                                color={isPastDue(assignment.dueDate) ? "error" : "inherit"} 
                                sx={{ mr: 1 }} 
                              />
                              {formatDate(assignment.dueDate)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {status === 'Graded' && (
                              <Chip 
                                icon={<CheckCircleIcon />} 
                                label="Graded" 
                                color="success" 
                                size="small" 
                              />
                            )}
                            {status === 'Submitted' && (
                              <Chip 
                                icon={<PendingIcon />} 
                                label="Submitted" 
                                color="primary" 
                                size="small" 
                              />
                            )}
                            {status === 'Not Submitted' && isPastDue(assignment.dueDate) && (
                              <Chip 
                                label="Overdue" 
                                color="error" 
                                size="small" 
                              />
                            )}
                            {status === 'Not Submitted' && !isPastDue(assignment.dueDate) && (
                              <Chip 
                                label="Pending" 
                                color="warning" 
                                size="small" 
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {submission?.grade !== null && submission?.grade !== undefined
                              ? `${submission.grade} / ${assignment.totalPoints || 100}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {submission && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  if (submission && submission._id) {
                                    navigate(`/submissions/${submission._id}`);
                                  } else {
                                    // Show error or fallback
                                    alert('Submission details not available');
                                  }
                                }}
                              >
                                View Details
                              </Button>
                            )}
                            {!submission && (
                              <Typography variant="body2" color="text.secondary">
                                No submission
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No assignments have been created for this course yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProgress; 
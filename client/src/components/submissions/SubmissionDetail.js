import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  CircularProgress, 
  Button, 
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  TextField
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import GradeIcon from '@mui/icons-material/Grade';
import FeedbackIcon from '@mui/icons-material/Feedback';
import AuthContext from '../../context/auth/authContext';
import axios from 'axios';

const SubmissionDetail = () => {
  const { id } = useParams(); // submission ID
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { user, loading: userLoading } = authContext;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        
        const res = await axios.get(`/api/submissions/${id}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        setSubmission(res.data);
        
        if (res.data.feedback) {
          setFeedback(res.data.feedback);
        }
        
        if (res.data.grade !== null) {
          setGrade(res.data.grade.toString());
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching submission details:', err);
        setError(err.response?.data?.msg || 'Error fetching submission');
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchSubmission();
    }
  }, [id, userLoading]);

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    
    if (!grade || !feedback) {
      return setError('Grade and feedback are required');
    }
    
    try {
      setGrading(true);
      
      await axios.put(`/api/submissions/${id}/grade`, 
        { 
          grade: parseInt(grade), 
          feedback 
        },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );
      
      // Refresh submission data
      const res = await axios.get(`/api/submissions/${id}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      
      setSubmission(res.data);
      setGrading(false);
    } catch (err) {
      console.error('Error grading submission:', err);
      setError(err.response?.data?.msg || 'Error grading submission');
      setGrading(false);
    }
  };

  if (userLoading || loading) {
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
          variant="outlined" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Submission not found</Alert>
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

  const isTeacher = user && user.role === 'teacher';
  const isGraded = submission.grade !== null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {/* Assignment Information */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h4">
                {submission.assignment?.title || 'Assignment'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                icon={<PersonIcon />} 
                label={`Student: ${submission.student?.name || 'Unknown'}`} 
                variant="outlined" 
              />
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Submitted: ${formatDate(submission.submittedAt)}`} 
                variant="outlined" 
              />
              {isGraded && (
                <Chip 
                  icon={<GradeIcon />} 
                  label={`Grade: ${submission.grade} / ${submission.assignment?.totalPoints || 100}`} 
                  color="success" 
                  variant="outlined" 
                />
              )}
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {submission.assignment?.description || 'No description available'}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Submission Content */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submission
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              border: '1px solid #ddd',
              borderRadius: 1,
              minHeight: '200px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {submission.content}
            </Box>
          </Paper>
        </Grid>
        
        {/* Feedback Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Feedback
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isTeacher && !isGraded ? (
              <form onSubmit={handleGradeSubmit}>
                <TextField
                  label="Grade"
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0, max: submission.assignment?.totalPoints || 100 }}
                  helperText={`Enter a grade from 0 to ${submission.assignment?.totalPoints || 100}`}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  label="Feedback"
                  multiline
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  fullWidth
                  required
                  helperText="Provide constructive feedback for the student"
                  sx={{ mb: 2 }}
                />
                
                <Button 
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={grading}
                >
                  {grading ? 'Saving...' : 'Submit Grade'}
                </Button>
              </form>
            ) : (
              <Box>
                {isGraded ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GradeIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h5">
                        Grade: {submission.grade} / {submission.assignment?.totalPoints || 100}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <FeedbackIcon sx={{ mr: 1, mt: 0.5 }} />
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {submission.feedback || 'No feedback provided.'}
                      </Typography>
                    </Box>
                    
                    {submission.gradedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Graded on {formatDate(submission.gradedAt)}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    This submission has not been graded yet.
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubmissionDetail; 
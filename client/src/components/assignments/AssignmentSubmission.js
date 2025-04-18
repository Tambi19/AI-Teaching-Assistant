import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GradingIcon from '@mui/icons-material/Grading';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const AssignmentSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { loading: userLoading, user } = authContext;
  const { setAlert } = alertContext;
  
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [submission, setSubmission] = useState({
    content: '',
    file: null,
    fileName: ''
  });
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        // Fetch assignment details with any existing submission
        const res = await axios.get(`/api/assignments/${id}`, config);
        
        if (res.data && res.data.assignment) {
          setAssignment(res.data.assignment);
          
          // Fetch course details
          if (res.data.assignment.course) {
            const courseId = typeof res.data.assignment.course === 'object' 
              ? res.data.assignment.course._id 
              : res.data.assignment.course;
              
            try {
              const courseRes = await axios.get(`/api/courses/${courseId}`, config);
              setCourse(courseRes.data);
            } catch (courseErr) {
              console.error('Error fetching course details:', courseErr);
              // Don't fail the whole assignment load if course details can't be fetched
            }
          }
          
          // If there's an existing submission, set it
          if (res.data.submission) {
            setExistingSubmission(res.data.submission);
            setSubmission({
              ...submission,
              content: res.data.submission.content || ''
            });
            
            // Check if the submission has been graded
            if (res.data.submission.status === 'graded' || res.data.submission.grade !== null) {
              // Create feedback object from submission data
              const feedbackObj = {
                score: res.data.submission.grade || 0,
                summary: res.data.submission.feedback || '',
                comments: res.data.submission.rubricGrades 
                  ? res.data.submission.rubricGrades.map(rg => ({
                      text: rg.feedback,
                      type: rg.score > 0 ? 'positive' : 'negative'
                    })) 
                  : [],
                gradedAt: res.data.submission.gradedAt || null,
                gradedBy: res.data.submission.gradedBy || 'teacher'
              };
              
              setFeedback(feedbackObj);
            }
          }
        } else {
          setError('Assignment not found or no data returned');
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError(err.response?.data?.msg || 'Failed to load assignment. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssignmentData();
    }
    
    // Cleanup function to reset state when component unmounts
    return () => {
      setAssignment(null);
      setCourse(null);
      setExistingSubmission(null);
      setFeedback(null);
      setLoading(false);
      setError(null);
    };
  }, [id]);
  
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
  
  if (!assignment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Assignment not found</Alert>
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
  const isSubmitted = existingSubmission !== null;
  const isFeedbackAvailable = feedback !== null;
  const isPastDue = new Date() > new Date(assignment.dueDate);
  
  const handleTextChange = (e) => {
    setSubmission({ ...submission, content: e.target.value });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setSubmission({
        ...submission,
        file: file,
        fileName: file.name
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submission.content.trim()) {
      setAlert('Please provide content for your submission', 'error');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      };
      
      const submissionData = {
        assignment: id,
        content: submission.content
      };
      
      const res = await axios.post('/api/submissions', submissionData, config);
      
      setSubmitting(false);
      setExistingSubmission(res.data);
      setAlert('Assignment submitted successfully!', 'success');
      
      // Don't reload the whole page, just update the component state
      setSubmission({
        content: res.data.content || '',
        file: null,
        fileName: ''
      });
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setSubmitting(false);
      setAlert(err.response?.data?.msg || 'Failed to submit assignment', 'error');
    }
  };
  
  const getActiveStep = () => {
    if (isFeedbackAvailable) return 2;
    if (isSubmitted) return 1;
    return 0;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Instructions from assignment description
  const instructions = assignment.description ? 
    assignment.description.split('\n').filter(line => line.trim().startsWith('-')) :
    [];
  
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
                {assignment.title}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Due: ${formatDate(assignment.dueDate)}`} 
                color={isPastDue ? "error" : "primary"} 
                variant="outlined" 
              />
              <Chip 
                icon={<GradingIcon />} 
                label={`Max Score: ${assignment.totalPoints || 100}`} 
                variant="outlined" 
              />
              {course && (
                <Chip 
                  label={`Course: ${course.title}`} 
                  variant="outlined" 
                />
              )}
            </Box>
            
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>
            
            {instructions.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Instructions:
                </Typography>
                
                <List dense>
                  {instructions.map((instruction, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={instruction.replace('-', '').trim()} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Display attached files */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                  Attached Files:
                </Typography>
                <List dense sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {assignment.attachments.map((file, index) => (
                    <ListItem key={index} divider={index < assignment.attachments.length - 1}>
                      <ListItemIcon>
                        <UploadFileIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(2)} KB`} 
                      />
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          // Create an anchor element and trigger download
                          const link = document.createElement('a');
                          link.href = file.data;
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Submission Progress */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submission Progress
            </Typography>
            
            <Stepper activeStep={getActiveStep()} sx={{ my: 3 }}>
              <Step>
                <StepLabel>Start Assignment</StepLabel>
              </Step>
              <Step>
                <StepLabel>Submit Work</StepLabel>
              </Step>
              <Step>
                <StepLabel>Receive Feedback</StepLabel>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
        
        {/* Submission Form or Submission Details */}
        <Grid item xs={12} md={isSubmitted ? 6 : 12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isSubmitted ? 'Your Submission' : 'Submit Your Work'}
            </Typography>
            
            {isSubmitted ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Submitted on: {formatDate(existingSubmission.createdAt || new Date())}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Submission Content:
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {existingSubmission.content}
                </Typography>
                
                {existingSubmission.fileName && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Uploaded File:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <UploadFileIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {existingSubmission.fileName}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                {isPastDue ? (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    This assignment is past due. You can no longer submit your work.
                  </Alert>
                ) : (
                  <>
                    <TextField
                      label="Your Submission"
                      multiline
                      rows={6}
                      fullWidth
                      placeholder="Describe your approach and provide your answer here..."
                      value={submission.content}
                      onChange={handleTextChange}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <Box sx={{ mb: 3 }}>
                      <input
                        accept="*/*"
                        style={{ display: 'none' }}
                        id="upload-file"
                        type="file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="upload-file">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload File (Optional)
                        </Button>
                      </label>
                      {submission.fileName && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <UploadFileIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {submission.fileName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={submitting || isPastDue}
                      startIcon={submitting ? <CircularProgress size={20} /> : null}
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Feedback Section */}
        {isSubmitted && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Feedback
              </Typography>
              
              {isFeedbackAvailable ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <GradingIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5" color="primary">
                      Score: {feedback.score}/{assignment.totalPoints || 100}
                    </Typography>
                  </Box>
                  
                  {feedback.comments && feedback.comments.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Comments:
                      </Typography>
                      
                      {feedback.comments.map((comment, index) => (
                        <Card 
                          key={index} 
                          variant="outlined" 
                          sx={{ 
                            mb: 2, 
                            borderLeft: '4px solid', 
                            borderColor: comment.type === 'positive' ? 'success.main' : 'error.main' 
                          }}
                        >
                          <CardContent>
                            <Typography variant="body2">
                              {comment.text}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                  
                  {feedback.summary && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        Summary:
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {feedback.summary}
                      </Typography>
                    </>
                  )}
                  
                  {feedback.gradedAt && (
                    <Typography variant="body2" color="text.secondary" align="right">
                      Graded on: {formatDate(feedback.gradedAt)}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                  <FeedbackIcon color="disabled" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="body1" align="center" color="text.secondary">
                    Your submission is being reviewed.
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary">
                    Feedback will be available once grading is complete.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default AssignmentSubmission; 
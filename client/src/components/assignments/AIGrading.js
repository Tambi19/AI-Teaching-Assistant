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
  Slider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import axios from 'axios';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submission-tabpanel-${index}`}
      aria-labelledby={`submission-tab-${index}`}
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

const AIGrading = () => {
  const { id } = useParams();  // This is the assignment ID
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { loading: userLoading, user } = authContext;
  const { setAlert } = alertContext;
  
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState({
    score: 0,
    comments: [],
    summary: ''
  });
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('positive');
  const [isSaving, setIsSaving] = useState(false);
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
        
        // Fetch assignment details
        const assignmentRes = await axios.get(`/api/assignments/${id}`, config);
        
        if (!assignmentRes.data || !assignmentRes.data.assignment) {
          setError('Assignment not found');
          setLoading(false);
          return;
        }
        
        setAssignment(assignmentRes.data.assignment);
        
        // Fetch all submissions for this assignment
        const submissionsRes = await axios.get(`/api/submissions/assignment/${id}`, config);
        
        // Set submissions
        setSubmissions(submissionsRes.data);
        
        // Set first submission as current if any exist
        if (submissionsRes.data.length > 0) {
          setCurrentSubmission(submissionsRes.data[0]);
          
          // Initialize feedback from existing submission if it has grades
          if (submissionsRes.data[0].grade !== null) {
            setFeedback({
              score: submissionsRes.data[0].grade,
              summary: submissionsRes.data[0].feedback || '',
              comments: submissionsRes.data[0].rubricGrades ? 
                submissionsRes.data[0].rubricGrades.map(rg => ({
                  text: rg.feedback,
                  type: rg.score > 0 ? 'positive' : 'negative'
                })) : []
            });
          } else {
            // Initialize feedback with empty values
            setFeedback({
              score: 0,
              comments: [],
              summary: ''
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.msg || 'Failed to load assignment data');
        setLoading(false);
      }
    };
    
    fetchAssignmentData();
  }, [id]);
  
  const generateAIAnalysis = () => {
    // This would be replaced with actual AI analysis in a real implementation
    setIsAnalyzing(true);
    
    // Mock AI analysis generation - in a real app, you'd call your AI service
    setTimeout(() => {
      const mockAnalysis = {
        overallQuality: 85,
        strengths: [
          'Proper understanding of the concepts',
          'Good explanation of the approach',
          'Well-structured submission'
        ],
        weaknesses: [
          'Could improve detail in some areas',
          'Minor errors in implementation'
        ],
        suggestedFeedback: [
          {
            text: 'Excellent work on explaining your approach to the problem.',
            type: 'positive'
          },
          {
            text: 'Consider adding more details about your implementation process next time.',
            type: 'negative'
          }
        ],
        suggestedScore: 85
      };
      
      setAiAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      
      // Pre-populate feedback with AI suggestions
      setFeedback({
        score: mockAnalysis.suggestedScore,
        comments: mockAnalysis.suggestedFeedback,
        summary: `Overall good work. Strengths include ${mockAnalysis.strengths[0].toLowerCase()} and ${mockAnalysis.strengths[1].toLowerCase()}. Areas for improvement include ${mockAnalysis.weaknesses[0].toLowerCase()}.`
      });
    }, 2000);
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSelectSubmission = (submission) => {
    setCurrentSubmission(submission);
    
    // Reset feedback if changing submissions
    if (submission.grade !== null) {
      setFeedback({
        score: submission.grade,
        summary: submission.feedback || '',
        comments: submission.rubricGrades ? 
          submission.rubricGrades.map(rg => ({
            text: rg.feedback,
            type: rg.score > 0 ? 'positive' : 'negative'
          })) : []
      });
    } else {
      setFeedback({
        score: 0,
        comments: [],
        summary: ''
      });
    }
    
    // Reset AI analysis
    setAiAnalysis(null);
  };
  
  const handleScoreChange = (event, newValue) => {
    setFeedback({ ...feedback, score: newValue });
  };
  
  const handleCommentTypeChange = (event, newType) => {
    if (newType !== null) {
      setCommentType(newType);
    }
  };
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      text: newComment,
      type: commentType
    };
    
    setFeedback({
      ...feedback,
      comments: [...feedback.comments, comment]
    });
    
    setNewComment('');
  };
  
  const handleRemoveComment = (index) => {
    const updatedComments = feedback.comments.filter((_, i) => i !== index);
    
    setFeedback({
      ...feedback,
      comments: updatedComments
    });
  };
  
  const handleSummaryChange = (e) => {
    setFeedback({ ...feedback, summary: e.target.value });
  };
  
  const handleSubmitFeedback = async () => {
    if (!currentSubmission) return;
    
    try {
      setIsSaving(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setAlert('Authentication token not found. Please log in again.', 'error');
        setIsSaving(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      // Prepare rubric grades from comments
      const rubricGrades = feedback.comments.map(comment => ({
        criteria: comment.type === 'positive' ? 'Strength' : 'Area for Improvement',
        score: comment.type === 'positive' ? 1 : 0,
        feedback: comment.text
      }));
      
      const gradeData = {
        grade: feedback.score,
        feedback: feedback.summary,
        rubricGrades: rubricGrades
      };
      
      await axios.put(`/api/submissions/${currentSubmission._id}/grade`, gradeData, config);
      
      setAlert('Feedback submitted successfully', 'success');
      
      // Update the submission in the list
      const updatedSubmission = {
        ...currentSubmission,
        grade: feedback.score,
        feedback: feedback.summary,
        rubricGrades: rubricGrades,
        status: 'graded',
        gradedBy: 'teacher',
        gradedAt: new Date()
      };
      
      setCurrentSubmission(updatedSubmission);
      
      // Update submissions list
      setSubmissions(submissions.map(s => 
        s._id === currentSubmission._id ? updatedSubmission : s
      ));
      
      setIsSaving(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setAlert(err.response?.data?.msg || 'Failed to submit feedback', 'error');
      setIsSaving(false);
    }
  };
  
  // Only teachers should access this page
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
  
  if (user && user.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }
  
  if (!assignment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const formatDate = (dateString) => {
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
                {assignment.title}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Due: ${formatDate(assignment.dueDate)}`} 
                color={new Date() > new Date(assignment.dueDate) ? "error" : "primary"} 
                variant="outlined" 
              />
              <Chip 
                icon={<AssignmentIcon />} 
                label={`Max Score: ${assignment.totalPoints || 100}`} 
                variant="outlined" 
              />
              <Chip 
                icon={<PersonIcon />} 
                label={`Submissions: ${submissions.length}`}
                variant="outlined" 
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Student Submissions */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="scrollable"
                scrollButtons="auto"
              >
                {submissions.length > 0 ? (
                  submissions.map((submission, index) => (
                    <Tab 
                      key={submission._id} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {submission.student.name}
                          </Typography>
                          {submission.grade !== null && (
                            <Chip 
                              label={`${submission.grade}/${assignment.totalPoints || 100}`} 
                              size="small" 
                              color="primary"
                            />
                          )}
                        </Box>
                      } 
                      onClick={() => handleSelectSubmission(submission)}
                    />
                  ))
                ) : (
                  <Tab label="No Submissions" disabled />
                )}
              </Tabs>
            </Box>
            
            {submissions.length > 0 ? (
              <TabPanel value={tabValue} index={tabValue}>
                {currentSubmission && (
                  <Grid container spacing={3}>
                    {/* Submission Content */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Submission
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Submitted by {currentSubmission.student.name} on {formatDate(currentSubmission.submittedAt)}
                          </Typography>
                        </Box>
                        
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default', maxHeight: '400px', overflow: 'auto' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {currentSubmission.content}
                          </Typography>
                        </Paper>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            AI Assistance
                          </Typography>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<SmartToyIcon />}
                            onClick={generateAIAnalysis}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Submission'}
                          </Button>
                        </Box>
                        
                        {isAnalyzing && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" gutterBottom>
                              AI is analyzing the submission...
                            </Typography>
                            <LinearProgress />
                          </Box>
                        )}
                        
                        {aiAnalysis && (
                          <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                AI Analysis
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  Overall Quality: {aiAnalysis.overallQuality}/100
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={aiAnalysis.overallQuality} 
                                  color="primary"
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Box>
                              
                              <Typography variant="body2" gutterBottom>
                                Strengths:
                              </Typography>
                              <List dense>
                                {aiAnalysis.strengths.map((strength, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                      <CheckCircleIcon color="success" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={strength} />
                                  </ListItem>
                                ))}
                              </List>
                              
                              <Typography variant="body2" gutterBottom>
                                Areas for Improvement:
                              </Typography>
                              <List dense>
                                {aiAnalysis.weaknesses.map((weakness, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                      <EditIcon color="error" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={weakness} />
                                  </ListItem>
                                ))}
                              </List>
                              
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  Suggested Score: {aiAnalysis.suggestedScore}/{assignment.totalPoints || 100}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    </Grid>
                    
                    {/* Grading Form */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Feedback
                        </Typography>
                        
                        {currentSubmission.status === 'graded' && (
                          <Alert severity="info" sx={{ mb: 3 }}>
                            This submission was already graded on {formatDate(currentSubmission.gradedAt)}
                          </Alert>
                        )}
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography id="score-slider" gutterBottom>
                            Score: {feedback.score}/{assignment.totalPoints || 100}
                          </Typography>
                          <Slider
                            value={feedback.score}
                            onChange={handleScoreChange}
                            aria-labelledby="score-slider"
                            valueLabelDisplay="auto"
                            min={0}
                            max={assignment.totalPoints || 100}
                          />
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>
                          Comments:
                        </Typography>
                        
                        <Box sx={{ mb: 3 }}>
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
                              <CardContent sx={{ py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  {comment.text}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveComment(index)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </CardContent>
                            </Card>
                          ))}
                          
                          <Box sx={{ display: 'flex', mb: 2 }}>
                            <TextField
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              fullWidth
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <ToggleButtonGroup
                              value={commentType}
                              exclusive
                              onChange={handleCommentTypeChange}
                              aria-label="comment type"
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <ToggleButton value="positive" aria-label="positive">
                                <Tooltip title="Positive">
                                  <CheckCircleIcon color="success" />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="negative" aria-label="negative">
                                <Tooltip title="Needs Improvement">
                                  <EditIcon color="error" />
                                </Tooltip>
                              </ToggleButton>
                            </ToggleButtonGroup>
                            <Button
                              variant="outlined"
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              startIcon={<AddCircleIcon />}
                            >
                              Add
                            </Button>
                          </Box>
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>
                          Summary Feedback:
                        </Typography>
                        <TextField
                          value={feedback.summary}
                          onChange={handleSummaryChange}
                          multiline
                          rows={4}
                          fullWidth
                          placeholder="Provide overall feedback for the student..."
                          sx={{ mb: 3 }}
                        />
                        
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={handleSubmitFeedback}
                          disabled={isSaving || !feedback.summary.trim()}
                          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        >
                          {isSaving ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </TabPanel>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No students have submitted this assignment yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIGrading; 
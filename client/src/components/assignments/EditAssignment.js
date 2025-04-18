// EditAssignment component

import React, { useState, useEffect, useContext, useRef } from 'react';
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
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import setAuthToken from '../../utils/setAuthToken';

const EditAssignment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;
  const fileInputRef = useRef(null);

  // Format date to YYYY-MM-DDT00:00 format for datetime-local input
  const getFormattedDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: getFormattedDate(new Date()),
    totalPoints: 100,
    aiGradingEnabled: true,
    course: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [rubricItems, setRubricItems] = useState([]);
  const [newRubricItem, setNewRubricItem] = useState({
    criteria: '',
    weight: 10,
    description: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (localStorage.token) {
      loadUser();
    }
    
    const fetchAssignment = async () => {
      try {
        setFetchLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setFetchLoading(false);
          return;
        }
        
        setAuthToken(token);
        
        const res = await axios.get(`/api/assignments/${id}`);
        const assignment = res.data.assignment;
        
        // Set form data
        setFormData({
          title: assignment.title,
          description: assignment.description,
          dueDate: getFormattedDate(new Date(assignment.dueDate)),
          totalPoints: assignment.totalPoints,
          aiGradingEnabled: assignment.aiGradingEnabled,
          course: typeof assignment.course === 'object' ? assignment.course._id : assignment.course
        });
        
        // Set rubric items if they exist
        if (assignment.rubric && assignment.rubric.length > 0) {
          setRubricItems(assignment.rubric);
        }
        
        // Set attachments if they exist
        if (assignment.attachments && assignment.attachments.length > 0) {
          setAttachments(assignment.attachments);
        }
        
        // Fetch course details
        const courseId = typeof assignment.course === 'object' ? assignment.course._id : assignment.course;
        const courseRes = await axios.get(`/api/courses/${courseId}`);
        setCourse(courseRes.data);
        
        setFetchLoading(false);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Failed to fetch assignment details');
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, loadUser]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSwitchChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const onRubricItemChange = e => {
    setNewRubricItem({ ...newRubricItem, [e.target.name]: e.target.value });
  };

  const addRubricItem = () => {
    if (!newRubricItem.criteria || !newRubricItem.weight) {
      setError('Criteria and weight are required for rubric items');
      return;
    }

    setRubricItems([...rubricItems, newRubricItem]);
    setNewRubricItem({
      criteria: '',
      weight: 10,
      description: ''
    });
  };

  const removeRubricItem = (index) => {
    setRubricItems(rubricItems.filter((_, i) => i !== index));
  };

  // File upload handlers
  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Please select a file under 10MB.');
        return;
      }
      
      // Create a file object with name, type, and data URL
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        };
        
        setAttachments([...attachments, newAttachment]);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Ensure token is set in axios headers
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    setAuthToken(token);

    try {
      const assignmentData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        rubric: rubricItems,
        attachments: attachments
      };
      
      await axios.put(`/api/assignments/${id}`, assignmentData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      setSuccess('Assignment updated successfully!');
      
      // Navigate back to the course detail page after successful update
      setTimeout(() => {
        navigate(`/courses/${formData.course}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err.response?.data?.msg || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not a teacher
  if (user && user.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { title, description, dueDate, totalPoints, aiGradingEnabled } = formData;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Assignment
        </Typography>
        
        {course && (
          <Typography variant="subtitle1" gutterBottom color="text.secondary">
            Course: {course.title}
          </Typography>
        )}
        
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
                label="Assignment Title"
                value={title}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., Midterm Project"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Assignment Description"
                value={description}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                multiline
                rows={4}
                placeholder="Provide detailed instructions for this assignment"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="dueDate"
                label="Due Date"
                type="datetime-local"
                value={dueDate}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="totalPoints"
                label="Total Points"
                type="number"
                value={totalPoints}
                onChange={onChange}
                fullWidth
                required
                variant="outlined"
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={aiGradingEnabled}
                    onChange={onSwitchChange}
                    name="aiGradingEnabled"
                    color="primary"
                  />
                }
                label="Enable AI Grading"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Grading Rubric
              </Typography>
              
              <List>
                {rubricItems.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`${item.criteria} (${item.weight}%)`}
                      secondary={item.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => removeRubricItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Add Rubric Item
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="criteria"
                      label="Criteria"
                      value={newRubricItem.criteria}
                      onChange={onRubricItemChange}
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., Code Quality"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="weight"
                      label="Weight (%)"
                      type="number"
                      value={newRubricItem.weight}
                      onChange={onRubricItemChange}
                      fullWidth
                      variant="outlined"
                      inputProps={{ min: 1, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description (Optional)"
                      value={newRubricItem.description}
                      onChange={onRubricItemChange}
                      fullWidth
                      variant="outlined"
                      placeholder="Describe what this criteria evaluates"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addRubricItem}
                    >
                      Add Rubric Item
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Assignment Files
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleFileClick}
                  sx={{ mb: 2 }}
                >
                  Attach Files
                </Button>
                
                {attachments.length > 0 && (
                  <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                    {attachments.map((file, index) => (
                      <ListItem key={index} divider={index < attachments.length - 1}>
                        <ListItemIcon>
                          <UploadFileIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name} 
                          secondary={`${(file.size / 1024).toFixed(2)} KB`} 
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => removeAttachment(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate(`/courses/${formData.course}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Assignment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditAssignment;

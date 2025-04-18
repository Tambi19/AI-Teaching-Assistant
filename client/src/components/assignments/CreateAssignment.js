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
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const fileInputRef = useRef(null);

  // Format current date to YYYY-MM-DDT00:00 format for the datetime-local input
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
    dueDate: getFormattedDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Default to 1 week from now
    totalPoints: 100,
    aiGradingEnabled: true
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
  const [course, setCourse] = useState(null);

  const { title, description, dueDate, totalPoints, aiGradingEnabled } = formData;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        };

        const res = await axios.get(`/api/courses/${courseId}`, config);
        setCourse(res.data);
      } catch (err) {
        setError('Failed to fetch course details');
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

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
    
    if (!title || !description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const assignmentData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        course: courseId,
        rubric: rubricItems,
        attachments: attachments
      };

      const res = await axios.post('/api/assignments', assignmentData, config);
      
      // Navigate to the course detail page after successful creation
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.response?.data?.msg || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not a teacher
  if (user && user.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Assignment
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
            
            {/* File Attachments Section */}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Assignment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateAssignment; 
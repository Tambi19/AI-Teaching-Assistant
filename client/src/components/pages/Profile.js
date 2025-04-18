import React, { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';

const Profile = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const { user, loading, updateUser } = authContext;
  const { setAlert } = alertContext;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    role: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [debug, setDebug] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        role: user.role || 'student',
        profileImage: user.profileImage || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setImagePreview(user.profileImage || '');
    }
  }, [user]);

  if (loading || !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { name, email, bio, role, profileImage, currentPassword, newPassword, confirmPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  // Function to resize image
  const resizeImage = (file, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with reduced quality
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
          resolve(resizedImage);
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB before resize)
      if (file.size > 5 * 1024 * 1024) {
        setAlert('Image is too large. Please select an image under 5MB.', 'error');
        return;
      }
      
      try {
        // Resize and compress the image
        const resizedImage = await resizeImage(file);
        setImagePreview(resizedImage);
        setFormData({ ...formData, profileImage: resizedImage });
        setDebug(`Image processed. Size: ${Math.round(resizedImage.length/1024)}KB`);
      } catch (err) {
        setAlert('Error processing image. Please try a different image.', 'error');
        console.error('Image processing error:', err);
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (newPassword !== '' && newPassword !== confirmPassword) {
      setAlert('New passwords do not match', 'error');
      return;
    }

    setSaving(true);
    
    // Only send certain fields to the API
    const updateData = {
      name,
      bio,
      profileImage
    };
    
    try {
      const result = await updateUser(updateData);
      
      if (result.success) {
        setAlert('Profile updated successfully', 'success');
        setIsEditing(false);
      } else {
        setAlert(result.error, 'error');
      }
    } catch (err) {
      setAlert('An error occurred while updating your profile', 'error');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <IconButton 
              onClick={handleImageClick}
              disabled={!isEditing}
              sx={{ p: 0, mb: 2 }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  isEditing ? (
                    <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
                      <AddAPhotoIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  ) : null
                }
              >
                <Avatar
                  src={imagePreview}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main'
                  }}
                >
                  {!imagePreview && <PersonIcon sx={{ fontSize: 80 }} />}
                </Avatar>
              </Badge>
            </IconButton>
            
            <Typography variant="h5" gutterBottom>
              {user.name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                mt: 2
              }}
            >
              <Button
                variant={isEditing ? "outlined" : "contained"}
                sx={{ mr: 1 }}
                onClick={() => setIsEditing(!isEditing)}
                disabled={saving}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Profile Information
            </Typography>
            
            <Box component="form" onSubmit={onSubmit} sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    fullWidth
                    disabled={!isEditing || saving}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    name="email"
                    value={email}
                    onChange={onChange}
                    fullWidth
                    disabled
                    required
                    type="email"
                    helperText="Email cannot be changed"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Bio"
                    name="bio"
                    value={bio}
                    onChange={onChange}
                    fullWidth
                    disabled={!isEditing || saving}
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                      labelId="role-label"
                      id="role"
                      name="role"
                      value={role}
                      label="Role"
                      onChange={onChange}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="teacher">Teacher</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {isEditing && (
                <>
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Current Password"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={onChange}
                        fullWidth
                        type="password"
                        disabled={saving}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="New Password"
                        name="newPassword"
                        value={newPassword}
                        onChange={onChange}
                        fullWidth
                        type="password"
                        disabled={saving}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        fullWidth
                        type="password"
                        disabled={saving}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
              
              {isEditing && (
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              
              {debug && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  {debug}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 
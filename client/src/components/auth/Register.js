import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Avatar,
  Grid,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

const Register = () => {
  const authContext = useContext(AuthContext);
  const alertContext = useContext(AlertContext);
  const navigate = useNavigate();

  const { register, error, clearErrors, isAuthenticated } = authContext;
  const { setAlert } = alertContext;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    if (error) {
      setAlert(error, 'error');
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error, isAuthenticated]);
  
  useEffect(() => {
    // Only handle errors in useEffect, not navigation
    if (error) {
      setAlert(error, 'error');
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error]);

  // Only handle error notifications, not redirects (handled in onSubmit)
  useEffect(() => {
    if (error) {
      setAlert(error, 'error');
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error]);

  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'student'
  });

  const { name, email, password, password2, role } = user;

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    // Validate the form inputs
    if (name === '' || email === '' || password === '' || role === '') {
      setAlert('Please enter all fields', 'error');
      return;
    } 
    if (password !== password2) {
      setAlert('Passwords do not match', 'error');
      return;
    } 
    if (password.length < 6) {
      setAlert('Password must be at least 6 characters', 'error');
      return;
    }
    
    // Using early returns above to make logic clearer
    const result = await register({
      name,
      email,
      password,
      role
    });
    
    // If registration was successful, redirect immediately
    if (result && result.success) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <Grid container justifyContent="center" sx={{ mt: 4 }}>
      <Grid item xs={12} sm={10} md={8} lg={6}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <PersonAddAltIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign up
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={onSubmit}
              sx={{ mt: 3, width: '100%' }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={onChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={onChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={onChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password2"
                    label="Confirm Password"
                    type="password"
                    id="password2"
                    value={password2}
                    onChange={onChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="/login" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Register; 
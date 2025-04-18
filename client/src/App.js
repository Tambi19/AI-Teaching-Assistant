import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import './App.css';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Alert from './components/layout/Alert';
import Home from './components/pages/Home';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './components/pages/Dashboard';
import Courses from './components/courses/Courses';
import CourseDetail from './components/courses/CourseDetail';
import Profile from './components/pages/Profile';
import AssignmentSubmission from './components/assignments/AssignmentSubmission';
import AssignmentGrading from './components/assignments/AIGrading';
import NotFound from './components/pages/NotFound';
import PrivateRoute from './components/routing/PrivateRoute';
import CreateCourse from './components/courses/CreateCourse';
import EditCourse from './components/courses/EditCourse';
import JoinCourse from './components/courses/JoinCourse';
import CreateAssignment from './components/assignments/CreateAssignment';
import EditAssignment from './components/assignments/EditAssignment';
import StudentProgress from './components/students/StudentProgress';
import SubmissionDetail from './components/submissions/SubmissionDetail';

// Context
import AuthState from './context/auth/AuthState';
import AlertState from './context/alert/AlertState';

// Utils
import setAuthToken from './utils/setAuthToken';
import ErrorBoundary from './components/common/ErrorBoundary';

// Global error handler
const handleGlobalError = (error, errorInfo) => {
  console.error('Global error:', error);
  console.error('Error details:', errorInfo);
};

// Load token into headers on app load
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  // Monitor and handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Application is online. Reconnecting services...');
      if (localStorage.token) {
        setAuthToken(localStorage.token); // Re-set token after coming back online
      }
    };

    const handleOffline = () => {
      console.log('Application is offline. Some features may be unavailable.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthState>
      <AlertState>
        <Router>
          <ErrorBoundary onError={handleGlobalError}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <CssBaseline />
              <Navbar />
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="container">
                  <Alert />
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
                    
                    {/* Course Routes */}
                    <Route path="/courses" element={<PrivateRoute component={Courses} />} />
                    <Route path="/courses/create" element={<PrivateRoute component={CreateCourse} />} />
                    <Route path="/courses/join" element={<PrivateRoute component={JoinCourse} />} />
                    <Route path="/courses/edit/:id" element={<PrivateRoute component={EditCourse} />} />
                    <Route path="/courses/:id" element={<PrivateRoute component={CourseDetail} />} />
                    
                    {/* Assignment Routes */}
                    <Route path="/assignments/create/:courseId" element={<PrivateRoute component={CreateAssignment} />} />
                    <Route path="/assignments/:id/submit" element={<PrivateRoute component={AssignmentSubmission} />} />
                    <Route path="/assignments/:id/grade" element={<PrivateRoute component={AssignmentGrading} />} />
                    <Route path="/assignments/:id/edit" element={<PrivateRoute component={EditAssignment} />} />
                    
                    {/* Student Routes */}
                    <Route path="/students/:id/progress" element={<PrivateRoute component={StudentProgress} />} />
                    
                    {/* Submission Routes */}
                    <Route path="/submissions/:id" element={<PrivateRoute component={SubmissionDetail} />} />
                    
                    {/* Profile */}
                    <Route path="/profile" element={<PrivateRoute component={Profile} />} />
                    
                    {/* Redirect from incorrect URLs to dashboard if authenticated */}
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    
                    {/* 404 Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Box>
              <Footer />
            </Box>
          </ErrorBoundary>
        </Router>
      </AlertState>
    </AuthState>
  );
};

export default App;

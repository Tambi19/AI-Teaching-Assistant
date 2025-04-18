import React, { Component } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRefresh = () => {
    // Reload the current page
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to homepage and refresh
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Container>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '80vh'
            }}
          >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
              <Typography variant="h4" component="h1" gutterBottom color="error">
                Something went wrong
              </Typography>
              <Typography variant="body1" paragraph>
                We apologize for the inconvenience. The application has encountered an unexpected error.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Try refreshing the page or returning to the home page.
              </Typography>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  Go to Home
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 
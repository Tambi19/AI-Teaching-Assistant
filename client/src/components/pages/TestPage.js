import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const TestPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Application Test Page
        </Typography>
        <Typography variant="body1" paragraph>
          This is a test page to verify that the React application is working correctly.
        </Typography>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
          <Typography variant="h6">
            If you can see this, the application has been successfully set up!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestPage; 
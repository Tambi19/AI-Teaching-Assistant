const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');

// Load env variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb', extended: false }));

// Global error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON', err);
    return res.status(400).json({ msg: 'Invalid JSON in request body' });
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Define routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/ai', require('./routes/ai'));

// Set port - try alternative ports if the main one is in use
const PORT = process.env.PORT || 5000;
const ALTERNATIVE_PORTS = [5001, 5002, 5003, 5004];
let currentPort = PORT;

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Increase timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10 // Limit connection pool size
};

// Connect to MongoDB with retry mechanism
const connectDB = async (retryCount = 5) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/teach-ai-assistant', mongoOptions);
    console.log('MongoDB Connected Successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    
    if (retryCount <= 0) {
      console.error('Failed to connect to MongoDB after multiple attempts. Exiting...');
      return false;
    }
    
    console.log(`Retrying connection in 3 seconds... (${retryCount} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return connectDB(retryCount - 1);
  }
};

// Start the application
const startApp = async () => {
  // Connect to MongoDB
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error('MongoDB connection failed. Exiting...');
    process.exit(1);
  }

  // Setup mongoose error handlers
  mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => {
      connectDB(1).catch(err => {
        console.error('Failed to reconnect to MongoDB:', err);
      });
    }, 5000);
  });
  
  // Always serve static assets regardless of environment
  // This allows us to serve the frontend from the same server in dev and prod
  app.use(express.static('client/build'));
  
  // Define non-API routes to be handled by React frontend
  app.get(/^(?!\/api|\/health).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });

  // Serve static assets
  if (fs.existsSync(path.join(__dirname, 'client', 'build'))) {
    // If build folder exists, serve from there
    app.use(express.static('client/build'));
    
    // Define non-API routes to be handled by React frontend
    app.get(/^(?!\/api|\/health).*/, (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
  } else {
    // If in development and no build folder, proxy to React dev server
    if (process.env.NODE_ENV !== 'production') {
      app.get(/^(?!\/api|\/health).*/, (req, res) => {
        res.redirect('http://localhost:3000' + req.path);
      });
      
      console.log('\x1b[33m%s\x1b[0m', '⚠️ No build folder found. API running at http://localhost:' + currentPort);
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Please start React dev server separately with: npm start --prefix client');
      console.log('\x1b[33m%s\x1b[0m', '⚠️ Frontend will be available at: http://localhost:3000');
    }
  }
  
  // Try to start the server on the primary port
  try {
    const server = app.listen(PORT, () => {
      currentPort = PORT;
      console.log(`Server running on port ${PORT}`);
      console.log(`Access the API at: http://localhost:${PORT}`);
    }).on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use, trying alternative ports...`);
        tryAlternativePorts(0);
      } else {
        console.error('Server error:', e.message);
        process.exit(1);
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      console.log('Server will continue running');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled promise rejection:', reason);
      console.log('Server will continue running');
    });
    
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
  
  // Try alternative ports if the main one is busy
  function tryAlternativePorts(index) {
    if (index >= ALTERNATIVE_PORTS.length) {
      console.error('All ports are busy. Please free up a port or specify a different one.');
      process.exit(1);
      return;
    }

    const alternativePort = ALTERNATIVE_PORTS[index];
    app.listen(alternativePort, () => {
      currentPort = alternativePort;
      console.log(`Server running on alternative port ${alternativePort}`);
      console.log(`Access the API at: http://localhost:${alternativePort}`);
    }).on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${alternativePort} is also busy, trying next port...`);
        tryAlternativePorts(index + 1);
      } else {
        console.error('Server error:', e.message);
        process.exit(1);
      }
    });
  }
};

// Start the application
startApp().catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
}); 
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    console.log('Auth middleware: No token provided in request');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user data from token
    req.user = decoded.user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // Log the specific error for debugging
    console.error('Token verification failed:', err.message);
    
    // Send appropriate error message based on error type
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        msg: 'Token has expired. Please login again.',
        error: 'token_expired'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        msg: 'Invalid token. Please login again.',
        error: 'invalid_token'
      });
    }
    
    // Generic error for other cases
    res.status(401).json({ 
      msg: 'Token is not valid', 
      error: 'auth_failed'
    });
  }
}; 
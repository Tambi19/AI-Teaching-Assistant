const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  code: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a unique code before saving if one doesn't exist
CourseSchema.pre('save', async function(next) {
  // Only generate code if it doesn't exist
  if (!this.code) {
    // Generate random 6-character alphanumeric code
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };
    
    // Check if the code is unique
    let isUnique = false;
    let code;
    
    // Try up to 5 times to generate a unique code
    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const existingCourse = await mongoose.model('course').findOne({ code });
      if (!existingCourse) {
        isUnique = true;
        break;
      }
    }
    
    if (!isUnique) {
      return next(new Error('Unable to generate a unique course code. Please try again.'));
    }
    
    this.code = code;
  }
  
  next();
});

module.exports = mongoose.model('course', CourseSchema); 
const mongoose = require('mongoose');

const SubmissionSchema = mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  gradedBy: {
    type: String,
    enum: ['ai', 'teacher', null],
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
  rubricGrades: [
    {
      criteria: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true
      },
      feedback: {
        type: String,
        default: ''
      }
    }
  ],
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  }
});

module.exports = mongoose.model('submission', SubmissionSchema); 
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @route   POST api/submissions
// @desc    Create a new submission
// @access  Private/Student
router.post(
  '/',
  [
    auth,
    [
      check('assignment', 'Assignment ID is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Only students can submit assignments' });
    }

    const { assignment, content } = req.body;

    try {
      // Verify assignment exists and student has access
      const assignmentDoc = await Assignment.findById(assignment).populate('course');
      
      if (!assignmentDoc) {
        return res.status(404).json({ msg: 'Assignment not found' });
      }
      
      const course = assignmentDoc.course;
      
      // Check if student is enrolled in the course
      if (!course.students.includes(req.user.id)) {
        return res.status(403).json({ msg: 'Not enrolled in this course' });
      }
      
      // Check if assignment is past due
      const now = new Date();
      if (now > assignmentDoc.dueDate) {
        return res.status(400).json({ msg: 'Assignment is past due' });
      }
      
      // Check if student has already submitted
      const existingSubmission = await Submission.findOne({
        assignment,
        student: req.user.id
      });
      
      if (existingSubmission) {
        return res.status(400).json({ msg: 'You have already submitted this assignment' });
      }
      
      const newSubmission = new Submission({
        assignment,
        student: req.user.id,
        content
      });

      const submission = await newSubmission.save();
      
      // If AI grading is enabled, trigger AI grading here
      // This will be implemented in the AI routes
      if (assignmentDoc.aiGradingEnabled) {
        // We'll implement this in a separate route
      }
      
      res.json(submission);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/submissions/assignment/:assignmentId
// @desc    Get all submissions for an assignment
// @access  Private/Teacher
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    
    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    
    // Verify teacher owns the course
    const course = await Course.findById(assignment.course);
    
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view these submissions' });
    }
    
    // For student, only return their own submission
    if (req.user.role === 'student') {
      const submission = await Submission.findOne({
        assignment: assignmentId,
        student: req.user.id
      }).populate('student', 'name');
      
      return res.json(submission ? [submission] : []);
    }
    
    // For teacher, return all submissions
    const submissions = await Submission.find({
      assignment: assignmentId
    }).populate('student', 'name');
    
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/submissions/:id
// @desc    Get submission by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name')
      .populate({
        path: 'assignment',
        select: 'title description rubric totalPoints',
        populate: {
          path: 'course',
          select: 'title teacher'
        }
      });

    if (!submission) {
      return res.status(404).json({ msg: 'Submission not found' });
    }

    // Check if user has access to this submission
    if (
      req.user.role === 'student' && 
      submission.student._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this submission' });
    }

    if (
      req.user.role === 'teacher' && 
      submission.assignment.course.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this submission' });
    }

    res.json(submission);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/submissions/:id/grade
// @desc    Grade a submission
// @access  Private/Teacher
router.put(
  '/:id/grade',
  [
    auth,
    [
      check('grade', 'Grade is required').isNumeric(),
      check('feedback', 'Feedback is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to grade submissions' });
    }

    const { grade, feedback, rubricGrades } = req.body;

    try {
      let submission = await Submission.findById(req.params.id).populate({
        path: 'assignment',
        populate: {
          path: 'course'
        }
      });

      if (!submission) {
        return res.status(404).json({ msg: 'Submission not found' });
      }

      // Verify teacher owns the course
      if (
        submission.assignment.course.teacher.toString() !== req.user.id && 
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ msg: 'Not authorized to grade this submission' });
      }

      // Validate grade is within assignment total points
      if (grade > submission.assignment.totalPoints) {
        return res.status(400).json({ 
          msg: `Grade cannot exceed total points (${submission.assignment.totalPoints})` 
        });
      }

      submission.grade = grade;
      submission.feedback = feedback;
      submission.gradedBy = 'teacher';
      submission.gradedAt = Date.now();
      submission.status = 'graded';
      
      if (rubricGrades) {
        submission.rubricGrades = rubricGrades;
      }

      await submission.save();
      res.json(submission);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Submission not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router; 
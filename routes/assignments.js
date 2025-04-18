const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');

// @route   GET api/assignments
// @desc    Get all assignments for a course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify user has access to course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    // Check if user has access to this course
    if (req.user.role === 'student' && !course.students.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to access this course' });
    }
    
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to access this course' });
    }
    
    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/assignments
// @desc    Create a new assignment
// @access  Private/Teacher
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('course', 'Course is required').not().isEmpty(),
      check('dueDate', 'Due date is required').not().isEmpty(),
      check('totalPoints', 'Total points are required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to create assignments' });
    }

    const { title, description, course, dueDate, totalPoints, rubric, aiGradingEnabled, attachments } = req.body;

    try {
      // Verify teacher owns the course
      const courseDoc = await Course.findById(course);
      
      if (!courseDoc) {
        return res.status(404).json({ msg: 'Course not found' });
      }
      
      if (courseDoc.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to create assignments for this course' });
      }
      
      const newAssignment = new Assignment({
        title,
        description,
        course,
        dueDate,
        totalPoints,
        rubric: rubric || [],
        attachments: attachments || [],
        aiGradingEnabled: aiGradingEnabled !== undefined ? aiGradingEnabled : true
      });

      const assignment = await newAssignment.save();
      res.json(assignment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/assignments/:id
// @desc    Get assignment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title teacher students');

    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    // Check if user has access to this assignment's course
    const course = assignment.course;
    
    if (req.user.role === 'student' && !course.students.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to access this assignment' });
    }
    
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to access this assignment' });
    }

    // For students, also check if they've submitted already
    if (req.user.role === 'student') {
      const submission = await Submission.findOne({
        assignment: req.params.id,
        student: req.user.id
      }).select('-__v'); // Include all submission data

      return res.json({
        assignment,
        submission: submission || null
      });
    }

    res.json({ assignment });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/assignments/:id
// @desc    Update assignment
// @access  Private/Teacher
router.put('/:id', auth, async (req, res) => {
  const { title, description, dueDate, totalPoints, rubric, aiGradingEnabled, attachments } = req.body;

  // Build assignment object
  const assignmentFields = {};
  if (title) assignmentFields.title = title;
  if (description) assignmentFields.description = description;
  if (dueDate) assignmentFields.dueDate = dueDate;
  if (totalPoints) assignmentFields.totalPoints = totalPoints;
  if (rubric) assignmentFields.rubric = rubric;
  if (attachments) assignmentFields.attachments = attachments;
  if (aiGradingEnabled !== undefined) assignmentFields.aiGradingEnabled = aiGradingEnabled;

  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    // Verify teacher owns the course for this assignment
    const course = await Course.findById(assignment.course);
    
    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update this assignment' });
    }

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: assignmentFields },
      { new: true }
    );

    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/assignments/:id
// @desc    Delete an assignment
// @access  Private/Teacher
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    // Verify teacher owns the course for this assignment
    const course = await Course.findById(assignment.course);
    
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    
    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this assignment' });
    }

    // Delete all submissions related to this assignment
    await Submission.deleteMany({ assignment: req.params.id });
    
    // Delete the assignment
    await Assignment.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Assignment deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
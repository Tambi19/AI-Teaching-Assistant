const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   GET api/courses
// @desc    Get all courses for a user (all courses if teacher, enrolled courses if student)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let courses;
    if (user.role === 'teacher') {
      // Teachers get all courses they created
      courses = await Course.find({ teacher: req.user.id })
        .populate('teacher', ['name', 'email'])
        .sort({ createdAt: -1 });
    } else {
      // Students get courses they are enrolled in
      courses = await Course.find({ students: req.user.id })
        .populate('teacher', ['name', 'email'])
        .sort({ createdAt: -1 });
    }

    res.json(courses);
  } catch (err) {
    console.error('Error getting courses:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', ['name', 'email'])
      .populate('students', ['name', 'email']);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is the teacher or a student in the course
    const isTeacher = course.teacher._id.toString() === req.user.id;
    const isStudent = course.students.some(student => student._id.toString() === req.user.id);

    if (!isTeacher && !isStudent) {
      return res.status(401).json({ msg: 'Not authorized to view this course' });
    }

    res.json(course);
  } catch (err) {
    console.error('Error getting course by ID:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/courses
// @desc    Create a course
// @access  Private (Teachers only)
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (user.role !== 'teacher') {
        return res.status(401).json({ msg: 'Only teachers can create courses' });
      }

      const { title, description, imageUrl } = req.body;

      // Generate a random 6-character alphanumeric code for the course
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const course = new Course({
        title,
        description,
        imageUrl,
        teacher: req.user.id,
        students: [],
        code
      });

      await course.save();
      res.json(course);
    } catch (err) {
      console.error('Error creating course:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/courses/:id
// @desc    Update a course
// @access  Private (Teacher who created the course only)
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is the teacher of the course
    if (course.teacher.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this course' });
    }

    const { title, description, imageUrl } = req.body;

    // Update fields if they exist
    if (title) course.title = title;
    if (description) course.description = description;
    if (imageUrl) course.imageUrl = imageUrl;

    await course.save();
    res.json(course);
  } catch (err) {
    console.error('Error updating course:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private (Teacher who created the course only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is the teacher of the course
    if (course.teacher.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this course' });
    }

    // Use deleteOne instead of remove (which is deprecated)
    await Course.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Course removed' });
  } catch (err) {
    console.error('Error deleting course:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private (Students only)
router.put('/:id/enroll', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(401).json({ msg: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is already enrolled
    if (course.students.includes(req.user.id)) {
      return res.status(400).json({ msg: 'User already enrolled in this course' });
    }

    // Add user to students array
    course.students.push(req.user.id);
    await course.save();

    res.json(course);
  } catch (err) {
    console.error('Error enrolling in course:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/courses/:id/unenroll
// @desc    Unenroll from a course
// @access  Private (Students only)
router.put('/:id/unenroll', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(401).json({ msg: 'Only students can unenroll from courses' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is enrolled
    if (!course.students.includes(req.user.id)) {
      return res.status(400).json({ msg: 'User not enrolled in this course' });
    }

    // Remove user from students array
    course.students = course.students.filter(
      student => student.toString() !== req.user.id
    );

    await course.save();
    res.json(course);
  } catch (err) {
    console.error('Error unenrolling from course:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/courses/join
// @desc    Join a course by code
// @access  Private (Students only)
router.post('/join', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(401).json({ msg: 'Only students can join courses' });
    }

    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ msg: 'Course code is required' });
    }

    // Find the course by code
    const course = await Course.findOne({ code });

    if (!course) {
      return res.status(404).json({ msg: 'Invalid course code. Please check and try again.' });
    }

    // Check if user is already enrolled
    if (course.students.some(student => student.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'You are already enrolled in this course' });
    }

    // Add user to students array
    course.students.push(req.user.id);
    await course.save();

    res.json(course);
  } catch (err) {
    console.error('Error joining course:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

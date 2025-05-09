// Route for joining courses by code
// This file contains only the route handler code to be integrated into courses.js

/*
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
*/

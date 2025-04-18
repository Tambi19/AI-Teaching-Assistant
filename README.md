# TeachAI Assistant

An AI-powered teacher assistant for automated grading and feedback.

## Features

- **User Authentication**: Secure registration and login for teachers and students
- **Course Management**: Create, edit, and manage courses with enrollment functionality
- **Assignment Management**: Create, edit, and track assignments with due dates
- **Submission System**: Students can submit assignments and teachers can provide feedback
- **Student Progress Tracking**: Monitor student performance with detailed analytics
- **AI Assistant**: AI-powered tools to help with various teaching tasks

## Tech Stack

- **Frontend**: React, Material-UI, Context API
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## How to Run the Project in One Go

This project has been configured to run both the frontend and backend in one go, making it easy to get started.

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB running locally or a MongoDB Atlas connection



### Manual Start

If you prefer to run commands manually:

```bash
# Install dependencies
npm install
npm run client-install

# Build and start
npm run start-all
```

Once running, access the application at: http://localhost:5000

## Development Mode

If you're actively developing and want hot reloading:

```bash
npm run dev 
```

This starts both the backend (http://localhost:5000) and frontend (http://localhost:3000) in development mode with hot reloading.

## Usage Guide

### Teacher Accounts

Teachers can:
- Create and manage courses
- Add and edit assignments
- View student submissions
- Provide feedback and grades
- Track student progress

### Student Accounts

Students can:
- Enroll in available courses
- View and submit assignments
- Track their progress across courses
- Review feedback and grades

### Registration

1. Navigate to the registration page
2. Select your role (teacher or student)
3. Fill in your details
4. Verify your account (if enabled)

### Course Management

1. Create a new course (teachers only)
2. Add a course description and details
3. Publish the course for students to enroll
4. Manage enrolled students

### Assignment Creation

1. Navigate to a course you teach
2. Create a new assignment
3. Add details, instructions, and due date
4. Publish the assignment for students

### Submission Process

1. Navigate to the assignment as a student
2. Complete the assignment requirements
3. Submit your work before the due date
4. Wait for teacher feedback

## Troubleshooting

- If you get a "port already in use" error, the server will automatically try ports 5001-5004
- Ensure MongoDB is running if you're using a local database
- Check the console for any error messages

## Development

### Project Structure

```
teach-ai-assistant/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   │   ├── components/     # React components
│   │   ├── context/        # Context API providers
│   │   ├── App.js          # Main application component
│   │   └── ...
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # Express API routes
├── server.js               # Express server setup
└── ...
```

### Scripts

- `npm run server`: Start the backend server
- `npm run client`: Start the frontend server
- `npm run dev`: Start both servers (using concurrently)

## License

[MIT](LICENSE)

## Contributors

- Tambi rao  

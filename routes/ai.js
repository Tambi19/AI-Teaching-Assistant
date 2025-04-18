const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const OpenAI = require('openai');
const natural = require('natural');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @route   POST api/ai/grade-submission/:id
// @desc    Auto-grade a submission using AI
// @access  Private/Teacher
router.post('/grade-submission/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to use AI grading' });
    }

    const submissionId = req.params.id;
    
    // Verify submission exists
    const submission = await Submission.findById(submissionId).populate({
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
    
    // Get assignment details
    const assignment = submission.assignment;
    
    // Prepare prompt for OpenAI
    const prompt = `
      I have a student submission for an assignment titled "${assignment.title}". This is a detailed grading task.
      
      ASSIGNMENT DETAILS:
      TITLE: ${assignment.title}
      DESCRIPTION: ${assignment.description}
      TOTAL POINTS: ${assignment.totalPoints}
      
      RUBRIC:
      ${assignment.rubric.map(r => `- ${r.criteria} (${r.weight} points): ${r.description || ''}`).join('\n')}
      
      STUDENT SUBMISSION:
      ${submission.content}
      
      Please provide:
      1. A grade out of ${assignment.totalPoints} points that accurately reflects the submission quality relative to THIS specific assignment
      2. Detailed feedback for the student on THIS specific assignment
      3. Scores for each rubric criteria WITH specific feedback for each
      
      For grading:
      - The grade MUST be appropriate for the SPECIFIC assignment title "${assignment.title}"
      - Do NOT give scores of exactly 85/100 as a default
      - Be critical and fair in your assessment based on the ACTUAL submission content
      - Consider the specific requirements of this assignment type when grading
    `;
    
    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an experienced teaching assistant specialized in analyzing and grading student submissions for the specific assignment being reviewed. Your feedback must be tailored to the particular assignment title and requirements. Provide accurate, fair assessments that truly reflect the quality of work submitted. Avoid defaulting to standard scores (like 85/100). Your assessment should demonstrate that you've carefully evaluated how well the submission meets the specific assignment's criteria."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    // Extract the response
    const aiGradingResult = aiResponse.choices[0].message.content;
    
    // Parse the AI response to extract grades
    // This is a simple heuristic and might need to be improved based on the actual format of AI responses
    let overallGrade = null;
    let feedback = aiGradingResult;
    const rubricGrades = [];
    
    // Extract overall grade (enhanced pattern matching)
    const gradeMatch = aiGradingResult.match(/grade:?\s*(\d+\.?\d*)/i) || 
                      aiGradingResult.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*${assignment.totalPoints}/i) ||
                      aiGradingResult.match(/score:?\s*(\d+\.?\d*)/i);
    
    if (gradeMatch) {
      overallGrade = parseFloat(gradeMatch[1]);
    }
    
    // Extract rubric scores if we have a rubric
    if (assignment.rubric && assignment.rubric.length > 0) {
      assignment.rubric.forEach(rubricItem => {
        const regex = new RegExp(`${rubricItem.criteria}[^:]*:?\\s*(\\d+\\.?\\d*)\\s*(?:points|point|pts|pt)?`, 'i');
        const match = aiGradingResult.match(regex);
        
        if (match) {
          const score = parseFloat(match[1]);
          
          // Find feedback related to this criteria
          const tokenizer = new natural.SentenceTokenizer();
          const sentences = tokenizer.tokenize(aiGradingResult);
          
          // Look for sentences containing the criteria name
          const relevantSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes(rubricItem.criteria.toLowerCase())
          );
          
          rubricGrades.push({
            criteria: rubricItem.criteria,
            score: score,
            feedback: relevantSentences.join(' ')
          });
        }
      });
    }
    
    // Update the submission with AI-generated grades
    submission.grade = overallGrade;
    submission.feedback = feedback;
    submission.gradedBy = 'ai';
    submission.gradedAt = Date.now();
    submission.status = 'graded';
    
    if (rubricGrades.length > 0) {
      submission.rubricGrades = rubricGrades;
    }
    
    await submission.save();
    
    res.json({
      submission,
      aiGradingResult
    });
  } catch (err) {
    console.error('AI Grading Error:', err.message);
    res.status(500).send('AI Grading Error');
  }
});

// @route   POST api/ai/bulk-grade/:assignmentId
// @desc    Bulk grade all ungraded submissions for an assignment
// @access  Private/Teacher
router.post('/bulk-grade/:assignmentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to use AI grading' });
    }

    const assignmentId = req.params.assignmentId;
    
    // Verify assignment exists
    const assignment = await Assignment.findById(assignmentId).populate('course');
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    
    // Verify teacher owns the course
    if (
      assignment.course.teacher.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ msg: 'Not authorized to grade for this assignment' });
    }
    
    // Find all ungraded submissions for this assignment
    const submissions = await Submission.find({
      assignment: assignmentId,
      status: 'submitted'
    });
    
    if (submissions.length === 0) {
      return res.json({ msg: 'No ungraded submissions found' });
    }
    
    // Start a background process to grade all submissions
    // This would typically be done with a proper job queue in production
    res.json({ 
      msg: `Started bulk grading ${submissions.length} submissions. This may take some time.`,
      submissionCount: submissions.length
    });
    
    // Generate assignment-specific expectations based on title/description
    let assignmentExpectations = "";
    const titleLower = assignment.title.toLowerCase();
    
    // Custom expectations based on common assignment types
    if (titleLower.includes("essay") || titleLower.includes("research") || titleLower.includes("paper")) {
      assignmentExpectations = `
        For this essay/research assignment, evaluate:
        - Clear thesis statement and argument structure
        - Quality of supporting evidence and citations
        - Logical flow and organization
        - Grammar, spelling, and writing style
        - Depth of analysis and critical thinking
      `;
    } else if (titleLower.includes("quiz") || titleLower.includes("test") || titleLower.includes("exam")) {
      assignmentExpectations = `
        For this quiz/test, evaluate:
        - Accuracy of answers against standard solutions
        - Completeness of responses
        - Proper showing of work/steps where applicable
        - Understanding of key concepts
        - No partial credit for completely wrong answers
      `;
    } else if (titleLower.includes("programming") || titleLower.includes("code") || titleLower.includes("algorithm")) {
      assignmentExpectations = `
        For this programming assignment, evaluate:
        - Code correctness and functionality
        - Algorithm efficiency and approach
        - Code organization and readability
        - Implementation of required features
        - Documentation and comments
      `;
    } else if (titleLower.includes("presentation") || titleLower.includes("slide") || titleLower.includes("speech")) {
      assignmentExpectations = `
        For this presentation assignment, evaluate:
        - Organization and flow of content
        - Visual design and clarity
        - Coverage of required topics
        - Quality of supporting materials
        - Communication effectiveness
      `;
    } else if (titleLower.includes("lab") || titleLower.includes("experiment") || titleLower.includes("practical")) {
      assignmentExpectations = `
        For this lab/practical assignment, evaluate:
        - Following of proper procedures
        - Accuracy of observations and data collection
        - Analysis and interpretation of results
        - Understanding of underlying concepts
        - Conclusions drawn from the experiment
      `;
    } else if (titleLower.includes("reflection") || titleLower.includes("journal") || titleLower.includes("diary")) {
      assignmentExpectations = `
        For this reflection assignment, evaluate:
        - Depth of personal insight
        - Connection to course concepts
        - Critical thinking about experiences
        - Growth in understanding
        - Quality of writing and expression
      `;
    } else if (titleLower.includes("discussion") || titleLower.includes("debate") || titleLower.includes("forum")) {
      assignmentExpectations = `
        For this discussion assignment, evaluate:
        - Engagement with the topic
        - Quality of original contributions
        - Response to others' ideas
        - Use of evidence and reasoning
        - Clarity and focus of communication
      `;
    } else if (titleLower.includes("project") || titleLower.includes("portfolio") || titleLower.includes("capstone")) {
      assignmentExpectations = `
        For this project assignment, evaluate:
        - Achievement of project goals
        - Quality of implementation/execution
        - Creativity and originality
        - Technical proficiency shown
        - Documentation and presentation
      `;
    } else if (titleLower.includes("review") || titleLower.includes("summary") || titleLower.includes("critique")) {
      assignmentExpectations = `
        For this review/critique assignment, evaluate:
        - Comprehensive coverage of the source material
        - Critical analysis rather than just summary
        - Supported opinions and judgments
        - Logical organization of critique
        - Insight beyond surface-level observations
      `;
    } else if (titleLower.includes("analysis") || titleLower.includes("case study") || titleLower.includes("evaluation")) {
      assignmentExpectations = `
        For this analysis assignment, evaluate:
        - Depth of analytical thinking
        - Application of relevant concepts/theories
        - Evidence-based reasoning
        - Consideration of multiple perspectives
        - Logical conclusions from analysis
      `;
    }
    
    // Process submissions one by one to avoid rate limits
    for (const submission of submissions) {
      try {
        // Prepare prompt for OpenAI with enhanced directives
        const prompt = `
          I have a student submission for an assignment titled "${assignment.title}" that needs accurate and fair assessment. 

          ASSIGNMENT DETAILS:
          TITLE: ${assignment.title}
          DESCRIPTION: ${assignment.description}
          TOTAL POINTS: ${assignment.totalPoints}
          
          ${assignmentExpectations}
          
          RUBRIC:
          ${assignment.rubric.map(r => `- ${r.criteria} (${r.weight} points): ${r.description || ''}`).join('\n')}
          
          STUDENT SUBMISSION:
          ${submission.content}
          
          REQUIREMENTS FOR GRADING:
          1. Analyze the submission based on the SPECIFIC content submitted, NOT based on generic patterns
          2. Start by identifying major flaws or incorrect answers - if present, the grade must reflect this
          3. Strictly avoid default or "safe" scoring patterns (especially 85/100 or similar generic scores)
          4. If the submission is poor quality, grade it accordingly (can be below 60%)
          5. If the submission is completely incorrect or off-topic, assign a very low score (0-40%)
          6. If the submission is exceptional, it can receive a high score (90-100%)
          7. Provide a final grade as "Grade: X out of ${assignment.totalPoints}"
          8. In the rubric scoring, ensure each criteria score aligns with actual content quality
          9. Provide detailed, specific feedback that references actual content from the submission
          
          Make sure that you have carefully analyzed the submission to ensure it meets the requirements for "${assignment.title}" before assigning any score.
        `;
        
        // Call OpenAI API with enhanced system prompt
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an advanced educational assessment AI specializing in critical evaluation of student work for "${assignment.title}" assignments.

Your primary responsibilities:
1. Thoroughly analyze submission content against assignment requirements
2. Detect incorrect answers, plagiarism, or off-topic responses
3. Provide detailed, evidence-based justification for all scores
4. NEVER default to generic scoring patterns (especially avoid 85/100)
5. Allocate scores based on actual content quality, not generosity
6. Be appropriately critical of low-quality or incorrect work
7. Specifically reference actual submission content in your feedback

You must detect and penalize:
- Missing required components
- Incorrect answers or solutions
- Vague, generic, or irrelevant content
- Off-topic responses
- Low-effort submissions

Your scoring should show a clear correlation between content quality and points awarded.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.5, // Lower temperature for more consistent, critical evaluation
          max_tokens: 1500,
        });
        
        // Extract the response
        const aiGradingResult = aiResponse.choices[0].message.content;
        
        // Parse the AI response to extract grades
        let overallGrade = null;
        let feedback = aiGradingResult;
        const rubricGrades = [];
        
        // Enhanced regex patterns for grade extraction
        const gradePatterns = [
          /grade:?\s*(\d+\.?\d*)/i,
          /(\d+\.?\d*)\s*(?:out of|\/)\s*${assignment.totalPoints}/i,
          /score:?\s*(\d+\.?\d*)/i,
          /points:?\s*(\d+\.?\d*)/i,
          /total:?\s*(\d+\.?\d*)/i,
          /overall:?\s*(\d+\.?\d*)/i
        ];
        
        // Try each pattern until we find a match
        for (const pattern of gradePatterns) {
          const match = aiGradingResult.match(pattern);
          if (match) {
            overallGrade = parseFloat(match[1]);
            break;
          }
        }
        
        // If we still don't have a grade, try to extract a percentage and convert
        if (!overallGrade) {
          const percentMatch = aiGradingResult.match(/(\d+\.?\d*)%/);
          if (percentMatch) {
            const percent = parseFloat(percentMatch[1]);
            overallGrade = (percent / 100) * assignment.totalPoints;
          }
        }
        
        // Extract rubric scores with enhanced regex
        if (assignment.rubric && assignment.rubric.length > 0) {
          assignment.rubric.forEach(rubricItem => {
            // Try multiple patterns for each criteria
            const patterns = [
              new RegExp(`${rubricItem.criteria}[^:]*:?\\s*(\\d+\\.?\\d*)\\s*(?:points|point|pts|pt)?`, 'i'),
              new RegExp(`${rubricItem.criteria}[^:]*:?\\s*(?:score|points|grade)?\\s*:?\\s*(\\d+\\.?\\d*)`, 'i'),
              new RegExp(`for\\s+(?:the\\s+)?${rubricItem.criteria}[^:]*:?\\s*(\\d+\\.?\\d*)`, 'i')
            ];
            
            let score = null;
            
            // Try each pattern
            for (const regex of patterns) {
              const match = aiGradingResult.match(regex);
              if (match) {
                score = parseFloat(match[1]);
                break;
              }
            }
            
            // If no match, try to infer score from content
            if (score === null) {
              const tokenizer = new natural.SentenceTokenizer();
              const sentences = tokenizer.tokenize(aiGradingResult);
              
              // Find sentences containing the criteria name
              const relevantSentences = sentences.filter(sentence => 
                sentence.toLowerCase().includes(rubricItem.criteria.toLowerCase())
              );
              
              // Look for numbers in those sentences
              if (relevantSentences.length > 0) {
                const numberMatch = relevantSentences.join(' ').match(/(\d+\.?\d*)/);
                if (numberMatch) {
                  score = parseFloat(numberMatch[1]);
                }
              }
            }
            
            // If we found a score, add it to rubricGrades
            if (score !== null) {
              // Find feedback related to this criteria
              const tokenizer = new natural.SentenceTokenizer();
              const sentences = tokenizer.tokenize(aiGradingResult);
              
              // Look for sentences containing the criteria name
              const relevantSentences = sentences.filter(sentence => 
                sentence.toLowerCase().includes(rubricItem.criteria.toLowerCase())
              );
              
              rubricGrades.push({
                criteria: rubricItem.criteria,
                score: score,
                feedback: relevantSentences.join(' ')
              });
            }
          });
        }
        
        // If we still don't have an overall grade but have rubric grades, calculate from them
        if (!overallGrade && rubricGrades.length > 0) {
          let totalWeight = 0;
          let weightedScore = 0;
          
          assignment.rubric.forEach((rubricItem, index) => {
            if (index < rubricGrades.length) {
              totalWeight += rubricItem.weight;
              weightedScore += rubricGrades[index].score;
            }
          });
          
          if (totalWeight > 0) {
            overallGrade = (weightedScore / totalWeight) * assignment.totalPoints;
          }
        }
        
        // Default to zero if still no grade (better than an arbitrary value)
        if (!overallGrade) {
          overallGrade = 0;
          feedback = "The AI grading system couldn't determine a grade from the response. Please review the submission manually.\n\n" + feedback;
        }
        
        // Update the submission with AI-generated grades
        submission.grade = overallGrade;
        submission.feedback = feedback;
        submission.gradedBy = 'ai';
        submission.gradedAt = Date.now();
        submission.status = 'graded';
        
        if (rubricGrades.length > 0) {
          submission.rubricGrades = rubricGrades;
        }
        
        await submission.save();
        
        // Add a delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Error grading submission ${submission._id}:`, err.message);
        // Continue with other submissions even if one fails
      }
    }
  } catch (err) {
    console.error('Bulk AI Grading Error:', err.message);
    // Since we already sent a response, we'll just log the error
  }
});

// @route   POST api/ai/feedback/:id
// @desc    Generate personalized feedback for a student
// @access  Private/Teacher
router.post('/feedback/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to generate AI feedback' });
    }

    const submissionId = req.params.id;
    
    // Verify submission exists
    const submission = await Submission.findById(submissionId).populate({
      path: 'assignment',
      populate: {
        path: 'course'
      }
    }).populate('student', 'name');
    
    if (!submission) {
      return res.status(404).json({ msg: 'Submission not found' });
    }
    
    // Verify teacher owns the course
    if (
      submission.assignment.course.teacher.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ msg: 'Not authorized to provide feedback for this submission' });
    }
    
    // Extract rubric feedback if available
    let rubricFeedback = "";
    if (submission.rubricGrades && submission.rubricGrades.length > 0) {
      rubricFeedback = "Rubric Assessment:\n" + 
        submission.rubricGrades.map(rg => 
          `- ${rg.criteria}: ${rg.score} points - ${rg.feedback}`
        ).join('\n');
    }
    
    // Analyze assignment type to provide better context
    let assignmentType = "general";
    const titleLower = submission.assignment.title.toLowerCase();
    
    if (titleLower.includes("essay") || titleLower.includes("research") || titleLower.includes("paper")) {
      assignmentType = "essay";
    } else if (titleLower.includes("quiz") || titleLower.includes("test") || titleLower.includes("exam")) {
      assignmentType = "assessment";
    } else if (titleLower.includes("programming") || titleLower.includes("code") || titleLower.includes("algorithm")) {
      assignmentType = "coding";
    } else if (titleLower.includes("presentation") || titleLower.includes("slide") || titleLower.includes("speech")) {
      assignmentType = "presentation";
    } else if (titleLower.includes("lab") || titleLower.includes("experiment") || titleLower.includes("practical")) {
      assignmentType = "lab";
    } else if (titleLower.includes("reflection") || titleLower.includes("journal") || titleLower.includes("diary")) {
      assignmentType = "reflection";
    } else if (titleLower.includes("project") || titleLower.includes("portfolio") || titleLower.includes("capstone")) {
      assignmentType = "project";
    }
    
    // Determine performance level based on grade
    let performanceLevel = "average";
    const gradePercent = (submission.grade / submission.assignment.totalPoints) * 100;
    
    if (gradePercent >= 90) {
      performanceLevel = "excellent";
    } else if (gradePercent >= 80) {
      performanceLevel = "good";
    } else if (gradePercent >= 70) {
      performanceLevel = "satisfactory";
    } else if (gradePercent < 60) {
      performanceLevel = "needs improvement";
    }
    
    // Prepare prompt for OpenAI
    const prompt = `
      I need to provide detailed, personalized feedback to a student named ${submission.student.name} on their ${assignmentType} submission for "${submission.assignment.title}".
      
      ASSIGNMENT DETAILS:
      TITLE: ${submission.assignment.title}
      DESCRIPTION: ${submission.assignment.description}
      
      STUDENT SUBMISSION:
      ${submission.content}
      
      CURRENT GRADE: ${submission.grade} out of ${submission.assignment.totalPoints} (${performanceLevel} performance)
      
      CURRENT FEEDBACK:
      ${submission.feedback}
      
      RUBRIC FEEDBACK:
      ${rubricFeedback}
      
      Please generate improved, personalized feedback that:
      1. Addresses the student by name (${submission.student.name})
      2. Provides specific comments on actual content from their submission
      3. Highlights 2-3 specific strengths with concrete examples from their work
      4. Identifies 2-3 areas for improvement with specific reference to their work
      5. Offers actionable, tailored suggestions to help them improve on this specific assignment type
      6. Ends with an encouraging note appropriate to their performance level
      
      The feedback must:
      - Be specifically tailored to the assignment "${submission.assignment.title}"
      - Reference actual content from the student's submission
      - Avoid generic comments that could apply to any submission
      - Match the tone to the student's performance level (${performanceLevel})
    `;
    
    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educator specializing in providing detailed, constructive feedback for ${assignmentType} assignments.

Your feedback must:
1. Address specific content from the student's work (quote actual passages when relevant)
2. Provide insights tailored to this specific assignment type
3. Demonstrate careful reading of the submission
4. Balance encouragement with honest critique
5. Provide concrete examples of how to improve

Avoid:
- Generic feedback that could apply to any submission
- Vague platitudes or empty praise
- Focusing only on superficial elements
- Suggesting improvements unrelated to their actual work

Your goal is to help the student understand exactly what they did well and where/how they can improve on this specific assignment.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    // Extract the response
    const personalizedFeedback = aiResponse.choices[0].message.content;
    
    res.json({
      originalFeedback: submission.feedback,
      personalizedFeedback
    });
  } catch (err) {
    console.error('AI Feedback Error:', err.message);
    res.status(500).send('AI Feedback Error');
  }
});

module.exports = router; 
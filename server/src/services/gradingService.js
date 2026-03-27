/**
 * Grading Service
 * Pure functions for grading quiz answers against questions.
 */

/**
 * Grades a single answer against a question.
 * 
 * @param {Object} question - The database question record
 * @param {string|null} studentAnswer - The student's submitted answer
 * @returns {Object} { isCorrect: boolean, score: number }
 */
const gradeAnswer = (question, studentAnswer) => {
  if (studentAnswer === null || studentAnswer === undefined || String(studentAnswer).trim() === '') {
    return { isCorrect: false, score: 0 };
  }

  const { type, correctAnswer, tolerance, points } = question;
  // Make sure answer is a string for comparisons
  const answerStr = String(studentAnswer).trim();

  if (type === 'mcq') {
    const isCorrect = answerStr === correctAnswer.trim();
    return { isCorrect, score: isCorrect ? points : 0 };
  }

  if (type === 'numerical') {
    const studentNum = parseFloat(answerStr);
    const correctNum = parseFloat(correctAnswer);

    if (!isFinite(studentNum) || !isFinite(correctNum)) {
      return { isCorrect: false, score: 0 };
    }

    const difference = Math.abs(studentNum - correctNum);
    const isCorrect = difference <= tolerance;
    return { isCorrect, score: isCorrect ? points : 0 };
  }

  return { isCorrect: false, score: 0 };
};

/**
 * Grades an entire attempt.
 * 
 * @param {Array} questions - Array of question records for the chapter
 * @param {Array} answers - Array of { questionId, studentAnswer } from the submission
 * @returns {Array} Array of graded answers ready to be saved
 */
const gradeAttempt = (questions, answers) => {
  // Create a fast lookup for answers
  const answerMap = new Map();
  if (Array.isArray(answers)) {
    answers.forEach(a => {
      answerMap.set(a.questionId, a.studentAnswer);
    });
  }

  return questions.map(question => {
    // If student didn't provide an answer for this question, it's null
    const studentAnswer = answerMap.has(question.id) ? answerMap.get(question.id) : null;
    const { isCorrect, score } = gradeAnswer(question, studentAnswer);
    
    return {
      questionId: question.id,
      studentAnswer: studentAnswer !== null ? String(studentAnswer) : null,
      isCorrect,
      score,
    };
  });
};

module.exports = { gradeAnswer, gradeAttempt };

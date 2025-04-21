<!-- src/pages/AttemptDetails.vue -->
<template>
  <div class="attempt-details">
    <h2 class="page-title">Quiz Attempt Results</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading attempt details...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="errorMessage" class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
      </div>
      <p>{{ errorMessage }}</p>
      <router-link to="/my-quizzes" class="btn">Back to My Quizzes</router-link>
    </div>

    <!-- Attempt Details View -->
    <div v-else-if="attempt" class="attempt-details-container">
      <!-- Quiz Info Panel -->
      <div class="attempt-summary">
        <h3>{{ quiz.title }}</h3>
        
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">{{ Math.round((attempt.score / attempt.totalQuestions) * 100) }}%</div>
            <div class="summary-label">Score</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value">{{ attempt.score }} / {{ attempt.totalQuestions }}</div>
            <div class="summary-label">Questions</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value">{{ formatTime(attempt.elapsedTime) }}</div>
            <div class="summary-label">Time Taken</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value pass-fail" :class="{'pass': attempt.isPassed}">
              {{ attempt.isPassed ? 'PASSED' : 'FAILED' }}
            </div>
            <div class="summary-label">Result</div>
          </div>
        </div>
        
        <div class="meta-details">
          <div class="meta-item">
            <span class="meta-label">Attempt Date:</span>
            <span class="meta-value">{{ formatDate(attempt.completedAt) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Difficulty:</span>
            <span class="meta-value difficulty-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</span>
          </div>
        </div>
      </div>

      <!-- Answers Review -->
      <div class="answers-review">
        <h3>Question Review</h3>
        
        <ul class="question-list">
          <li 
            v-for="(answer, index) in answers" 
            :key="answer.questionId" 
            class="question-item"
            :class="{'correct': answer.isCorrect, 'incorrect': !answer.isCorrect}"
          >
            <div class="question-header">
              <div class="question-number">Q{{ index + 1 }}</div>
              <div class="question-text">{{ answer.questionText }}</div>
              <div class="result-indicator" :class="{'correct': answer.isCorrect}">
                {{ answer.isCorrect ? '✓' : '✗' }}
              </div>
            </div>
            
            <ul class="options-list">
              <li 
                v-for="option in answer.options" 
                :key="option.optionId" 
                class="option-item"
                :class="{
                  'selected': option.optionId === answer.selectedOptionId,
                  'correct': option.isCorrect
                }"
              >
                <span class="option-text">{{ option.answerText }}</span>
                <span v-if="option.isCorrect && option.optionId !== answer.selectedOptionId" class="correct-indicator">
                  Correct Answer
                </span>
              </li>
            </ul>
            
            <div class="answer-explanation" v-if="!answer.isCorrect">
              <p>
                <strong>Correct answer:</strong> 
                {{ getCorrectAnswerText(answer.options) }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div class="action-buttons">
        <router-link :to="`/quiz/${quiz.quizId}`" class="retake-btn">Retake Quiz</router-link>
        <router-link to="/my-quizzes" class="back-btn">Back to My Quizzes</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const attemptId = parseInt(route.params.id as string)

// State
const quiz = ref<any>(null)
const attempt = ref<any>(null)
const answers = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// Define types for better type checking
interface QuizOption {
  optionId: number;
  answerText: string;
  isCorrect: boolean;
}

interface QuizAnswer {
  questionId: number;
  questionText: string;
  selectedOptionId: number;
  isCorrect: boolean;
  options: QuizOption[];
}

// Load quiz data
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  if (isNaN(attemptId)) {
    errorMessage.value = 'Invalid attempt ID'
    isLoading.value = false
    return
  }
  
  try {
    await Promise.all([
      loadAttemptDetails(),
      loadQuizDetails(),
      loadAnswers()
    ])
  } catch (error: any) {
    console.error('Error loading attempt details:', error)
    errorMessage.value = error.message || 'Failed to load attempt details'
  } finally {
    isLoading.value = false
  }
})

// Load attempt details
async function loadAttemptDetails() {
  const { getDB } = await import('@/db/index')
  const db = await getDB()
  
  const result = db.exec(`
    SELECT 
      a.attempt_id,
      a.quiz_id,
      a.user_id,
      a.score,
      a.total_questions,
      a.started_at,
      a.completed_at,
      a.elapsed_time,
      a.is_passed
    FROM QuizAttempts a
    WHERE a.attempt_id = ? AND a.user_id = ?
  `, [attemptId, auth.state.user!.userId])
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Attempt not found or you do not have permission to view it')
  }
  
  attempt.value = {
    attemptId: result[0].values[0][0],
    quizId: result[0].values[0][1],
    userId: result[0].values[0][2],
    score: result[0].values[0][3],
    totalQuestions: result[0].values[0][4],
    startedAt: result[0].values[0][5],
    completedAt: result[0].values[0][6],
    elapsedTime: result[0].values[0][7],
    isPassed: result[0].values[0][8] === 1
  }
}

// Load quiz details
async function loadQuizDetails() {
  const { getDB } = await import('@/db/index')
  const db = await getDB()
  
  // Wait for attempt data to be loaded
  if (!attempt.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const result = db.exec(`
    SELECT 
      quiz_id,
      title,
      description,
      difficulty
    FROM Quizzes
    WHERE quiz_id = ?
  `, [attempt.value.quizId])
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Quiz not found')
  }
  
  quiz.value = {
    quizId: result[0].values[0][0],
    title: result[0].values[0][1],
    description: result[0].values[0][2],
    difficulty: result[0].values[0][3]
  }
}

// Load answers for this attempt
async function loadAnswers() {
  const { getDB } = await import('@/db/index')
  const db = await getDB()
  
  // Wait for attempt data to be loaded
  if (!attempt.value) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Get all answered questions with their selected options
  const result = db.exec(`
    SELECT 
      q.question_id,
      q.question_text,
      a.selected_option_id,
      a.is_correct
    FROM AttemptAnswers a
    JOIN Questions q ON a.question_id = q.question_id
    WHERE a.attempt_id = ?
    ORDER BY q.question_id
  `, [attemptId])
  
  if (result.length > 0 && result[0].values.length > 0) {
    const answersData: QuizAnswer[] = result[0].values.map((row: any) => ({
      questionId: Number(row[0]),
      questionText: String(row[1]),
      selectedOptionId: Number(row[2]),
      isCorrect: row[3] === 1,
      options: [] // Will be filled below
    }))
    
    // For each question, get all possible options
    for (const answer of answersData) {
      const optionsResult = db.exec(`
        SELECT 
          option_id,
          answer_text,
          is_correct
        FROM AnswerOptions
        WHERE question_id = ?
        ORDER BY option_id
      `, [answer.questionId])
      
      if (optionsResult.length > 0 && optionsResult[0].values.length > 0) {
        answer.options = optionsResult[0].values.map((row: any) => ({
          optionId: Number(row[0]),
          answerText: String(row[1]),
          isCorrect: row[2] === 1
        }))
      }
    }
    
    answers.value = answersData
  }
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format time in minutes and seconds
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Get the correct answer text
function getCorrectAnswerText(options: QuizOption[]) {
  const correctOption = options.find(opt => opt.isCorrect)
  return correctOption ? correctOption.answerText : 'Unknown'
}
</script>

<style scoped>
.attempt-details {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-title {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Loading and error states */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-md);
}

.error-icon {
  color: rgb(255, 89, 89);
  margin-bottom: var(--spacing-md);
}

.error-container p {
  margin-bottom: var(--spacing-md);
  color: var(--text-alt);
  max-width: 400px;
}

/* Attempt details layout */
.attempt-details-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.attempt-summary, .answers-review {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.attempt-summary h3, .answers-review h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
}

/* Summary grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.summary-card {
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--text-alt);
}

.pass-fail {
  padding: 0.2rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.pass-fail.pass {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

/* Meta details */
.meta-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-top: 1px solid var(--input-border);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.meta-label {
  color: var(--text-alt);
  font-size: 0.9rem;
}

.meta-value {
  font-weight: 500;
  color: var(--text-main);
}

.difficulty-badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.difficulty-badge.easy {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.difficulty-badge.medium {
  background: rgba(255, 171, 0, 0.15);
  color: #ffab00;
}

.difficulty-badge.hard {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

/* Question review */
.question-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.question-item {
  margin-bottom: var(--spacing-md);
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border-left: 3px solid var(--input-border);
}

.question-item.correct {
  border-left-color: #2ed573;
}

.question-item.incorrect {
  border-left-color: #ff4757;
}

.question-header {
  padding: var(--spacing-sm);
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
}

.question-number {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  font-size: 1rem;
  padding-right: 40px; /* Space for the indicator */
}

.result-indicator {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
  font-weight: bold;
}

.result-indicator.correct {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

/* Options list */
.options-list {
  list-style: none;
  padding: var(--spacing-sm);
  margin: 0;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--input-border);
  position: relative;
}

.option-item.selected {
  background: rgba(255, 71, 87, 0.1);
  border-color: rgba(255, 71, 87, 0.3);
}

.option-item.correct {
  background: rgba(46, 213, 115, 0.1);
  border-color: rgba(46, 213, 115, 0.3);
}

.option-item.selected.correct {
  background: rgba(46, 213, 115, 0.2);
  border-color: rgba(46, 213, 115, 0.5);
}

.option-text {
  flex: 1;
}

.correct-indicator {
  font-size: 0.8rem;
  padding: 0.1rem 0.4rem;
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
  border-radius: 10px;
  font-weight: 500;
}

/* Answer explanation */
.answer-explanation {
  padding: var(--spacing-sm);
  margin: 0 var(--spacing-sm) var(--spacing-sm);
  background: rgba(95, 121, 149, 0.1);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.answer-explanation p {
  margin: 0;
  line-height: 1.5;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.retake-btn, .back-btn, .btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  flex: 1;
}

.retake-btn {
  background: var(--accent);
  color: white;
}

.retake-btn:hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

.back-btn, .btn {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.back-btn:hover, .btn:hover {
  background: var(--panel-bg);
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive layout */
@media (max-width: 768px) {
  .attempt-details {
    padding: var(--spacing-md);
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .meta-details {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
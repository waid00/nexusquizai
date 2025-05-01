<!-- src/pages/QuizDetails.vue -->
<template>
  <div class="quiz-details">
    <h2 class="page-title" v-if="quiz">{{ quiz.title }}</h2>
    <h2 class="page-title" v-else>Quiz Details</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading quiz details...</p>
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
      <router-link to="/" class="btn">Back to Home</router-link>
    </div>

    <!-- Quiz Details View -->
    <div v-else-if="quiz" class="quiz-details-container">
      <!-- Quiz Info Panel -->
      <div class="info-panel">
        <div class="quiz-meta">
          <div class="meta-item">
            <div class="meta-label">Difficulty</div>
            <div class="meta-value difficulty-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Questions</div>
            <div class="meta-value">{{ questions.length }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Created</div>
            <div class="meta-value">{{ formatDate(quiz.createdAt) }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Times Taken</div>
            <div class="meta-value">{{ attemptCount }}</div>
          </div>
        </div>

        <div class="quiz-description">
          <h3>Description</h3>
          <p>{{ quiz.description || 'No description provided for this quiz.' }}</p>
        </div>

        <div class="author-info">
          <h3>Created by</h3>
          <div class="author-name">{{ quiz.authorName }}</div>
        </div>

        <div class="quiz-actions">
          <!-- Owner-specific actions -->
          <div v-if="isOwner" class="owner-actions">
            <button class="edit-quiz-btn" @click="editQuiz">Edit Quiz</button>
            <button class="action-btn take-quiz" @click="takeQuiz">Try Quiz</button>
            <button class="delete-quiz-btn" @click="confirmDeleteQuiz">Delete Quiz</button>
          </div>
          
          <!-- Non-owner actions -->
          <div v-else class="solver-actions">
            <button class="take-quiz-btn" @click="takeQuiz">Take Quiz</button>
            <button 
              v-if="auth.state.isAuthenticated"
              class="upvote-btn" 
              :class="{ active: hasUserUpvoted }"
              @click="toggleUpvote"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ upvoteCount }}</span>
              Upvote
            </button>
            <button 
              v-else
              class="upvote-btn" 
              @click="promptLogin"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ upvoteCount }}</span>
              Login to Upvote
            </button>
          </div>
          
          <router-link to="/" class="back-btn">Back to Home</router-link>
        </div>
      </div>



            <!-- Quiz Stats (visible to owners or after attempting) -->
            <div v-if="attemptCount > 0 && (isOwner || hasAttempted)" class="quiz-stats">
        <h3>Quiz Statistics</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">Average Score</div>
            <div class="stat-value">{{ avgScore }}%</div>
            <div class="stat-detail">{{ avgCorrect }} / {{ questions.length }} correct on average</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">Pass Rate</div>
            <div class="stat-value">{{ passRate }}%</div>
            <div class="stat-detail">{{ passCount }} of {{ attemptCount }} attempts passed</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">Average Time</div>
            <div class="stat-value">{{ formatTime(avgTime) }}</div>
            <div class="stat-detail">to complete this quiz</div>
          </div>
        </div>

        <div class="difficulty-distribution">
          <h4>Success Rate by Question</h4>
          <div class="question-success-bars">
            <div 
              v-for="(question, index) in questions" 
              :key="question.questionId" 
              class="question-success-item"
            >
              <div class="question-label">Q{{ index + 1 }}</div>
              <div class="success-bar-container">
                <div 
                  class="success-bar" 
                  :style="{ width: `${calculateSuccessRate(question.questionId)}%` }"
                  :class="getSuccessRateClass(calculateSuccessRate(question.questionId))"
                ></div>
                <div class="success-rate-label">{{ calculateSuccessRate(question.questionId) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="attemptCount === 0" class="no-attempts">
        <p>This quiz hasn't been taken yet. Be the first to take it!</p>
      </div>
      <!-- Questions Preview -->
      <div class="questions-preview">
        <h3>Quiz Questions</h3>
        
        <ul class="question-list">
          <li 
            v-for="(question, index) in questions" 
            :key="question.questionId" 
            class="question-item"
            :class="{ expanded: expandedQuestions[question.questionId] }"
            @click="toggleQuestionExpand(question.questionId)"
          >
            <div class="question-header">
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-content">
                <div class="question-text">{{ question.questionText }}</div>
                <div class="question-type-badge" :class="question.questionType">
                  {{ formatQuestionType(question.questionType) }}
                </div>
              </div>
              <button class="expand-btn">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  fill="currentColor" 
                  :class="{'rotate-icon': expandedQuestions[question.questionId]}"
                  viewBox="0 0 16 16"
                >
                  <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            
            <!-- Expanded content with answer options -->
            <div v-if="expandedQuestions[question.questionId]" class="question-details">
              <div class="answer-options">
                <template v-if="question.questionType === 'multiple_choice'">
                  <div 
                    v-for="option in getAnswerOptions(question.questionId)" 
                    :key="option.optionId" 
                    class="answer-option"
                    :class="{ correct: option.isCorrect && (isOwner || hasAttempted) }"
                  >
                    <div class="option-marker">
                      <span v-if="option.isCorrect && (isOwner || hasAttempted)" class="correct-marker">✓</span>
                      <span v-else class="option-letter">{{ option.optionLetter }}</span>
                    </div>
                    <div class="option-text">{{ option.optionText }}</div>
                  </div>
                </template>
                
                <template v-else-if="question.questionType === 'true_false'">
                  <div 
                    class="answer-option"
                    :class="{ correct: getCorrectTrueFalseAnswer(question.questionId) === true && (isOwner || hasAttempted) }"
                  >
                    <div class="option-marker">
                      <span v-if="getCorrectTrueFalseAnswer(question.questionId) === true && (isOwner || hasAttempted)" class="correct-marker">✓</span>
                      <span v-else class="option-letter">T</span>
                    </div>
                    <div class="option-text">True</div>
                  </div>
                  <div 
                    class="answer-option"
                    :class="{ correct: getCorrectTrueFalseAnswer(question.questionId) === false && (isOwner || hasAttempted) }"
                  >
                    <div class="option-marker">
                      <span v-if="getCorrectTrueFalseAnswer(question.questionId) === false && (isOwner || hasAttempted)" class="correct-marker">✓</span>
                      <span v-else class="option-letter">F</span>
                    </div>
                    <div class="option-text">False</div>
                  </div>
                </template>
                
                <template v-else-if="question.questionType === 'fill_blank'">
                  <div class="answer-option fill-blank">
                    <div class="option-text">
                      <span v-if="isOwner || hasAttempted">
                        Answer: <span class="correct-answer">{{ getBlankAnswer(question.questionId) }}</span>
                      </span>
                      <span v-else>
                        The answer will be revealed after you take the quiz.
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </li>
        </ul>
        
        <div v-if="!isOwner && !hasAttempted" class="answer-note">
          <p>Correct answers will be shown after you attempt the quiz.</p>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal
        :show="showConfirmation"
        :title="confirmationData.title"
        :message="confirmationData.message"
        :confirm-text="confirmationData.confirmText"
        :type="confirmationData.type"
        @confirm="confirmAction"
        @cancel="cancelConfirmation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { toggleQuizUpvote, checkUserUpvote } from '@/api/supabase'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const quizId = parseInt(route.params.id as string)

// Quiz data
const quiz = ref<any>(null)
const questions = ref<any[]>([])
const attempts = ref<any[]>([])
const answerOptions = ref<{[key: number]: any[]}>({})
const questionStats = ref<{[key: number]: {correct: number, total: number}}>({})
const isLoading = ref(true)
const errorMessage = ref('')
const expandedQuestions = reactive<{[key: number]: boolean}>({})
const upvoteCount = ref(0)
const hasUserUpvoted = ref(false)
const userAttempts = ref<any[]>([])

// Stats data
const avgScore = ref(0)
const avgCorrect = ref(0)
const passRate = ref(0)
const passCount = ref(0)
const avgTime = ref(0)

// Confirmation modal state
const showConfirmation = ref(false)
const confirmationData = reactive({
  title: '',
  message: '',
  confirmText: 'Confirm',
  type: 'warning',
  action: ''
})

// Computed properties for view logic
const isOwner = computed(() => {
  return auth.state.isAuthenticated && 
         auth.state.user && 
         quiz.value && 
         quiz.value.ownerId === auth.state.user.userId
})

const hasAttempted = computed(() => {
  return userAttempts.value.length > 0
})

// Stats computed properties
const attemptCount = computed(() => attempts.value.length)

// Format a date string
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Format time in seconds to minutes:seconds
const formatTime = (seconds: number) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Navigation functions
const editQuiz = () => {
  router.push(`/edit-quiz/${quizId}`)
}

const takeQuiz = () => {
  router.push(`/quiz/${quizId}`)
}

// Upvote handling
const toggleUpvote = async () => {
  if (!auth.state.isAuthenticated) {
    promptLogin()
    return
  }
  
  try {
    const result = await toggleQuizUpvote(quizId, auth.state.user!.userId)
    hasUserUpvoted.value = !hasUserUpvoted.value
    upvoteCount.value = hasUserUpvoted.value ? upvoteCount.value + 1 : upvoteCount.value - 1
  } catch (error) {
    console.error('Error toggling upvote:', error)
  }
}

const promptLogin = () => {
  router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
}

// Question display helpers
const toggleQuestionExpand = (questionId: number) => {
  expandedQuestions[questionId] = !expandedQuestions[questionId]
}

const formatQuestionType = (type: string) => {
  if (type === 'multiple_choice') return 'Multiple Choice'
  if (type === 'true_false') return 'True/False'
  if (type === 'fill_blank') return 'Fill in the Blank'
  return type
}

// Answer handling functions
const getAnswerOptions = (questionId: number) => {
  return answerOptions.value[questionId] || []
}

const getCorrectTrueFalseAnswer = (questionId: number) => {
  const question = questions.value.find(q => q.questionId === questionId)
  return question?.correctAnswer === 'true'
}

const getBlankAnswer = (questionId: number) => {
  const question = questions.value.find(q => q.questionId === questionId)
  return question?.correctAnswer || 'N/A'
}

// Statistics functions
const calculateSuccessRate = (questionId: number) => {
  const stats = questionStats.value[questionId]
  if (!stats || stats.total === 0) return 0
  return Math.round((stats.correct / stats.total) * 100)
}

const getSuccessRateClass = (rate: number) => {
  if (rate >= 70) return 'high'
  if (rate >= 40) return 'medium'
  return 'low'
}

// Confirm delete quiz
function confirmDeleteQuiz() {
  confirmationData.title = 'Delete Quiz';
  confirmationData.message = `Are you sure you want to delete "${quiz.value.title}"? This action cannot be undone.`;
  confirmationData.confirmText = 'Delete';
  confirmationData.type = 'danger';
  confirmationData.action = 'deleteQuiz';
  
  showConfirmation.value = true;
}

// Delete a quiz (soft delete)
async function deleteQuiz() {
  try {
    const { error } = await supabase
      .from('Quizzes')
      .update({ is_deleted: true })
      .eq('id', quizId)
      .eq('owner_id', auth.state.user!.userId)

    if (error) throw error

    // Redirect to my quizzes page
    router.push('/my-quizzes');
  } catch (error) {
    console.error('Error deleting quiz:', error)
    alert('Failed to delete quiz. Please try again.')
  }
}

// Handle confirmation modal actions
function confirmAction() {
  switch (confirmationData.action) {
    case 'deleteQuiz':
      deleteQuiz();
      break;
  }
  
  showConfirmation.value = false;
}

// Cancel confirmation
function cancelConfirmation() {
  showConfirmation.value = false;
}

// Load quiz data
onMounted(async () => {
  if (isNaN(quizId)) {
    errorMessage.value = 'Invalid quiz ID'
    isLoading.value = false
    return
  }
  
  try {
    // First check if the quiz exists and is public or user is the owner
    const { data: quizAccessData, error: accessError } = await supabase
      .from('Quizzes')
      .select('id, owner_id, is_public, is_deleted')
      .eq('id', quizId)
      .single()
    
    if (accessError || !quizAccessData) {
      throw new Error('Quiz not found')
    }
    
    // Check if quiz is deleted
    if (quizAccessData.is_deleted) {
      throw new Error('This quiz has been deleted')
    }
    
    // Check access permissions
    const isOwner = auth.state.isAuthenticated && 
                    auth.state.user && 
                    quizAccessData.owner_id === auth.state.user.userId
    
    const isPublic = quizAccessData.is_public
    
    // If quiz is not public and user is not the owner, redirect
    if (!isPublic && !isOwner) {
      errorMessage.value = 'This quiz is private and you do not have permission to view it'
      isLoading.value = false
      return
    }
    
    // Load quiz details
    await loadQuizDetails()
    
    // Load questions
    await loadQuestions()
    
    // Load attempts
    await loadAttempts()
    
    // Load upvotes
    await loadUpvotes()
    
    // Check if current user has upvoted this quiz
    if (auth.state.isAuthenticated && auth.state.user) {
      const hasUpvoted = await checkUserUpvote(quizId, auth.state.user.userId)
      hasUserUpvoted.value = hasUpvoted
      
      // Check if user has attempted this quiz
      userAttempts.value = attempts.value.filter(a => 
        a.userId === auth.state.user?.userId
      )
    }
    
    // Load answer options for all questions
    await loadAnswerOptions()
    
    // Calculate question stats
    calculateQuestionStats()
    
    // Calculate stats for display
    calculateStats()
    
  } catch (error: any) {
    console.error('Error loading quiz details:', error)
    errorMessage.value = error.message || 'Failed to load quiz details'
  } finally {
    isLoading.value = false
  }
})

// Load basic quiz details
async function loadQuizDetails() {
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      id, 
      title, 
      description, 
      difficulty, 
      created_at, 
      published_at,
      owner_id,
      Users (username)
    `)
    .eq('id', quizId)
    .single()
  
  if (error || !data) {
    throw new Error('Quiz not found')
  }
  
  quiz.value = {
    quizId: data.id,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    createdAt: data.created_at,
    publishedAt: data.published_at,
    ownerId: data.owner_id,
    authorName: data.Users?.username || 'Unknown'
  }
}

// Load questions for this quiz
async function loadQuestions() {
  const { data, error } = await supabase
    .from('Questions')
    .select('id, question_text, question_type, difficulty')
    .eq('quiz_id', quizId)
    .order('id', { ascending: true })
  
  if (error) throw error
  
  if (data && data.length > 0) {
    questions.value = data.map(row => ({
      questionId: row.id,
      questionText: row.question_text,
      questionType: row.question_type,
      difficulty: row.difficulty
    }))
  }
}

// Load answer options for all questions
async function loadAnswerOptions() {
  for (const question of questions.value) {
    const { data, error } = await supabase
      .from('AnswerOptions')
      .select('*')
      .eq('question_id', question.questionId)
      .order('id', { ascending: true })
    
    if (error) {
      console.error('Error loading answer options:', error)
      continue
    }
    
    if (data && data.length > 0) {
      // Transform data and assign letter labels (A, B, C, D...)
      const options = data.map((option, index) => ({
        optionId: option.id,
        optionText: option.answer_text,
        optionLetter: String.fromCharCode(65 + index), // A, B, C, etc.
        isCorrect: option.is_correct
      }))
      
      answerOptions.value[question.questionId] = options
    }
  }
}

// Load quiz attempts
async function loadAttempts() {
  const { data, error } = await supabase
    .from('QuizAttempts')
    .select(`
      id,
      user_id,
      score,
      total_questions,
      started_at,
      completed_at,
      elapsed_time,
      is_passed
    `)
    .eq('quiz_id', quizId)
    .order('completed_at', { ascending: false })
  
  if (error) throw error
  
  if (data && data.length > 0) {
    attempts.value = data.map(row => ({
      attemptId: row.id,
      userId: row.user_id,
      score: row.score,
      totalQuestions: row.total_questions,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      elapsedTime: row.elapsed_time,
      isPassed: row.is_passed
    }))
  }
}

// Load upvote count
async function loadUpvotes() {
  const { count, error } = await supabase
    .from('QuizUpvotes')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId)
  
  if (!error) {
    upvoteCount.value = count || 0
  }
}

// Calculate stats for each question
async function calculateQuestionStats() {
  if (attempts.value.length === 0 || questions.value.length === 0) return
  
  // Initialize questionStats with empty data for all questions
  questions.value.forEach(question => {
    questionStats.value[question.questionId] = {
      total: 0,
      correct: 0
    }
  })
  
  // For each question, get the stats from AttemptAnswers
  for (const question of questions.value) {
    const { data, error } = await supabase
      .from('AttemptAnswers')
      .select('is_correct')
      .eq('question_id', question.questionId)
    
    if (error) {
      console.error('Error fetching question stats:', error)
      continue
    }
    
    if (data && data.length > 0) {
      const total = data.length
      const correct = data.filter(answer => answer.is_correct).length
      
      questionStats.value[question.questionId] = {
        total,
        correct
      }
    }
  }
}

// Calculate aggregate stats
function calculateStats() {
  if (attempts.value.length === 0) return
  
  // Average score
  const totalPercentage = attempts.value.reduce((acc, attempt) => {
    return acc + (attempt.score / attempt.totalQuestions * 100)
  }, 0)
  avgScore.value = Math.round(totalPercentage / attempts.value.length)
  
  // Average correct answers
  const totalCorrect = attempts.value.reduce((acc, attempt) => {
    return acc + attempt.score
  }, 0)
  avgCorrect.value = Math.round((totalCorrect / attempts.value.length) * 10) / 10
  
  // Pass count and rate
  passCount.value = attempts.value.filter(attempt => attempt.isPassed).length
  passRate.value = Math.round((passCount.value / attempts.value.length) * 100)
  
  // Average time
  const totalTime = attempts.value.reduce((acc, attempt) => {
    return acc + attempt.elapsedTime
  }, 0)
  avgTime.value = Math.round(totalTime / attempts.value.length)
}
</script>

<style scoped>
.quiz-details {
  max-width: 1000px;
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

/* Quiz details layout */
.quiz-details-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.info-panel, .questions-preview, .quiz-stats, .no-attempts {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

/* Quiz meta information */
.quiz-meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.meta-item {
  text-align: center;
}

.meta-label {
  color: var(--text-alt);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.meta-value {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-main);
}

.difficulty-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
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

/* Quiz description & author */
.quiz-description, .author-info {
  margin-bottom: var(--spacing-md);
}

.quiz-description h3, .author-info h3 {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-sm);
  color: var(--text-main);
}

.quiz-description p {
  color: var(--text-alt);
  line-height: 1.5;
}

.author-name {
  font-weight: 600;
  color: var(--text-main);
}

/* Quiz actions */
.quiz-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
}

.owner-actions, .solver-actions {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.take-quiz-btn, .edit-quiz-btn, .try-quiz-btn {
  background: var(--accent);
  color: white;
  flex: 1;
}

.take-quiz-btn:hover, .edit-quiz-btn:hover, .try-quiz-btn:hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

.delete-quiz-btn {
  background: rgba(255, 71, 87, 0.9);
  color: white;
  flex: 1;
}

.delete-quiz-btn:hover {
  background: rgba(255, 71, 87, 1);
}

.view-attempts-btn, .back-btn, .btn, .upvote-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  border: none;
  transition: all 0.2s ease;
  min-width: 120px;
}

.view-attempts-btn {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  flex: 1;
}

.view-attempts-btn:hover {
  background: var(--panel-bg);
}

.back-btn, .btn {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.back-btn:hover, .btn:hover {
  background: var(--panel-bg);
}

.upvote-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-alt);
  border: 1px solid var(--input-border);
  flex: 1;
}

.upvote-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.upvote-btn.active {
  background: rgba(46, 213, 115, 0.1);
  color: var(--accent);
  border-color: var(--accent);
}

.upvote-icon {
  font-size: 1.1rem;
}

.upvote-count {
  font-weight: 600;
  margin-right: 4px;
}

/* Questions preview */
.questions-preview h3, .quiz-stats h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
  color: var(--text-main);
}

.question-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.question-item {
  margin-bottom: var(--spacing-sm);
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  overflow: hidden;
}

.question-header {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-sm);
  cursor: pointer;
}

.question-number {
  width: 24px;
  height: 24px;
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

.question-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.question-text {
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.4;
}

.question-type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(95, 121, 149, 0.1);
  color: var(--text-alt);
  flex-shrink: 0;
  white-space: nowrap;
}

.expand-btn {
  background: transparent;
  border: none;
  color: var(--text-alt);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin-left: auto;
  transition: transform 0.3s ease;
}

.rotate-icon {
  transform: rotate(180deg);
}

/* Answer options display */
.question-details {
  padding: 0 var(--spacing-sm) var(--spacing-sm) calc(24px + var(--spacing-sm) * 2);
  animation: slideDown 0.3s ease-out;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.answer-option {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.answer-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.answer-option.correct {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
}

.option-marker {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  margin-right: var(--spacing-sm);
  font-weight: 600;
  font-size: 0.8rem;
}

.correct-marker {
  color: #2ed573;
}

.option-letter {
  color: var(--text-alt);
}

.option-text {
  font-size: 0.9rem;
  color: var(--text-main);
}

.fill-blank .option-text {
  padding: var(--spacing-xs) 0;
}

.correct-answer {
  font-weight: 600;
  color: #2ed573;
}

.answer-note {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-alt);
  text-align: center;
}

/* Quiz stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.stat-title {
  font-size: 0.9rem;
  color: var(--text-alt);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.25rem;
}

.stat-detail {
  font-size: 0.85rem;
  color: var(--text-alt);
}

/* Success rate by question */
.difficulty-distribution h4 {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-main);
}

.question-success-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.question-label {
  width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-alt);
}

.success-bar-container {
  flex: 1;
  height: 24px;
  background: var(--input-bg);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}

.success-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-light) 100%);
  transition: width 1s ease-out;
}

.success-bar.high {
  background: linear-gradient(90deg, #2ed573 0%, #7bed9f 100%);
}

.success-bar.medium {
  background: linear-gradient(90deg, #ffab00 0%, #ffd699 100%);
}

.success-bar.low {
  background: linear-gradient(90deg, #ff4757 0%, #ff7f8e 100%);
}

.success-rate-label {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* No attempts message */
.no-attempts {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--text-alt);
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

/* Responsive layout - remove the side-by-side layout since we're now stacking vertically */
@media (min-width: 768px) {

  .info-panel {
    width: 100%;
  }
  
  .questions-preview {
    width: 100%;
  }
  
  .quiz-stats, .no-attempts {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .quiz-meta {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .question-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .quiz-actions, .owner-actions, .solver-actions {
    flex-direction: column;
  }
  
  .back-btn {
    width: 100%;
  }
}
</style>
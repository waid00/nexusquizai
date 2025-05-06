<!-- src/pages/AttemptDetails.vue -->
<template>
  <div class="attempt-details">
    <h2 class="page-title">{{ t('quiz.quizResults') }}</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('common.loading') }}</p>
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
      <router-link to="/my-quizzes" class="btn">{{ t('common.back') }} {{ t('myQuizzes.title') }}</router-link>
    </div>

    <!-- Attempt Details View -->
    <div v-else-if="attempt" class="attempt-details-container">
      <!-- Quiz Info Panel -->
      <div class="attempt-summary">
        <h3>{{ quiz.title }}</h3>
        
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">{{ Math.round((attempt.score / attempt.totalQuestions) * 100) }}%</div>
            <div class="summary-label">{{ t('quiz.score') }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value">{{ attempt.score }} / {{ attempt.totalQuestions }}</div>
            <div class="summary-label">{{ t('quiz.questions') }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value">{{ formatTime(attempt.elapsedTime) }}</div>
            <div class="summary-label">{{ t('myQuizzes.time') }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-value pass-fail" :class="{'pass': attempt.isPassed}">
              {{ attempt.isPassed ? t('quiz.pass') : t('quiz.fail') }}
            </div>
            <div class="summary-label">{{ t('quiz.results') }}</div>
          </div>
        </div>
        
        <div class="meta-details">
          <div class="meta-item">
            <span class="meta-label">{{ t('myQuizzes.date') }}:</span>
            <span class="meta-value">{{ formatDate(attempt.completedAt) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">{{ t('quiz.difficulty') }}:</span>
            <span class="meta-value difficulty-badge" :class="quiz.difficulty">{{ t(`quiz.${quiz.difficulty}`) }}</span>
          </div>
        </div>
      </div>

      <!-- Answers Review -->
      <div class="answers-review">
        <h3>{{ t('quiz.question') }} {{ t('common.view') }}</h3>
        
        <ul class="question-list">
          <li 
            v-for="(answer, index) in answers" 
            :key="answer.questionId" 
            class="question-item"
            :class="{'correct': answer.isCorrect, 'incorrect': !answer.isCorrect}"
          >
            <div class="question-header">
              <div class="question-number">{{ index + 1 }}</div>
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
                  {{ t('quiz.correctAnswer') }}
                </span>
              </li>
            </ul>
            
            <div class="answer-explanation" v-if="!answer.isCorrect">
              <p>
                <strong>{{ t('quiz.correctAnswer') }}:</strong> 
                {{ getCorrectAnswerText(answer.options) }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div class="action-buttons">
        <router-link :to="`/quiz/${quiz.quizId}`" class="retake-btn">{{ t('quiz.retakeQuiz') }}</router-link>
        <router-link to="/my-quizzes" class="back-btn">{{ t('common.back') }} {{ t('myQuizzes.title') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { useLanguage } from '@/context/LanguageContext'
import '@/assets/pages/attempt.css';

const languageContext = useLanguage()
if (!languageContext) {
  throw new Error('Language context is not available')
}
const { t } = languageContext
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
  selectedOptionId: number | null;
  isCorrect: boolean | null;
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
    // First load the attempt details
    await loadAttemptDetails()
    
    // Then load the quiz details and answers
    await Promise.all([
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

// Load attempt details from Supabase
async function loadAttemptDetails() {
  const { data, error } = await supabase
    .from('QuizAttempts')
    .select(`
      id,
      quiz_id,
      user_id,
      score,
      total_questions,
      started_at,
      completed_at,
      elapsed_time,
      is_passed
    `)
    .eq('id', attemptId)
    .eq('user_id', auth.state.user!.userId)
    .single();
  
  if (error || !data) {
    throw new Error('Attempt not found or you do not have permission to view it');
  }
  
  attempt.value = {
    attemptId: data.id,
    quizId: data.quiz_id,
    userId: data.user_id,
    score: data.score,
    totalQuestions: data.total_questions,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    elapsedTime: data.elapsed_time,
    isPassed: data.is_passed
  }
}

// Load quiz details from Supabase
async function loadQuizDetails() {
  // Wait for attempt data to be loaded if needed
  if (!attempt.value) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      id,
      title,
      description,
      difficulty
    `)
    .eq('id', attempt.value.quizId)
    .single();
  
  if (error || !data) {
    throw new Error('Quiz not found');
  }
  
  quiz.value = {
    quizId: data.id,
    title: data.title,
    description: data.description,
    difficulty: data.difficulty
  }
}

// Load answers for this attempt from Supabase
async function loadAnswers() {
  // Wait for attempt data to be loaded if needed
  if (!attempt.value) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Get all answered questions with their selected options
  const { data, error } = await supabase
    .from('AttemptAnswers')
    .select(`
      id,
      question_id,
      selected_option_id,
      is_correct,
      Questions!inner (
        id,
        question_text
      )
    `)
    .eq('attempt_id', attemptId)
    .order('question_id');
  
  if (error) {
    throw error;
  }
  
  if (data && data.length > 0) {
    const answersData: QuizAnswer[] = data.map(row => ({
      questionId: row.question_id,
      questionText: row.Questions?.question_text || 'Question text unavailable',
      selectedOptionId: row.selected_option_id,
      isCorrect: row.is_correct,
      options: [] // Will be filled below
    }));
    
    // For each question, get all possible options
    for (const answer of answersData) {
      const { data: optionsData, error: optionsError } = await supabase
        .from('AnswerOptions')
        .select(`
          id,
          answer_text,
          is_correct
        `)
        .eq('question_id', answer.questionId)
        .order('id');
      
      if (optionsError) {
        console.error('Error fetching options:', optionsError);
        continue;
      }
      
      if (optionsData && optionsData.length > 0) {
        answer.options = optionsData.map(opt => ({
          optionId: opt.id,
          answerText: opt.answer_text,
          isCorrect: opt.is_correct
        }));
      }
    }
    
    answers.value = answersData;
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
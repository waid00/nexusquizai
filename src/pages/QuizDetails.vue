<!-- src/pages/QuizDetails.vue -->
<template>
  <div class="quiz-details">
    <h2 class="page-title" v-if="quiz">{{ quiz.title }}</h2>
    <h2 class="page-title" v-else>{{ t('quiz.quizDetails') }}</h2>

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
      <router-link to="/" class="btn btn-back">{{ t('common.backToHome') }}</router-link>
    </div>

    <!-- Quiz Details View -->
    <div v-else-if="quiz" class="quiz-details-container">
      <!-- Quiz Info Panel -->
      <div class="info-panel">
        <div class="quiz-meta">
          <div class="meta-item">
            <div class="meta-label">{{ t('quiz.difficulty') }}</div>
            <div class="meta-value difficulty-badge" :class="quiz.difficulty">{{ t(`quiz.${quiz.difficulty}`) }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">{{ t('quiz.questions') }}</div>
            <div class="meta-value">{{ questions.length }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">{{ t('quiz.created') }}</div>
            <div class="meta-value">{{ formatDate(quiz.createdAt) }}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">{{ t('quiz.timesTaken') }}</div>
            <div class="meta-value">{{ attemptCount }}</div>
          </div>
        </div>

        <div class="quiz-info-container">
          <div class="quiz-description">
            <h3>{{ t('quiz.description') }}</h3>
            <p>{{ quiz.description || t('quiz.noDescription') }}</p>
          </div>

          <div class="author-info">
            <h3>{{ t('quiz.createdBy') }}</h3>
            <div class="author-name">{{ quiz.authorName }}</div>
          </div>
        </div>

        <div class="quiz-actions">
          <!-- Owner-specific actions -->
          <div v-if="isOwner" class="owner-actions">
            <button class="btn btn-primary" @click="editQuiz">{{ t('quiz.editQuiz') }}</button>
            <button class="btn btn-primary" @click="takeQuiz">{{ t('quiz.startQuiz') }}</button>
            <button class="btn btn-danger" @click="confirmDeleteQuiz">{{ t('quiz.deleteQuiz') }}</button>
          </div>
          
          <!-- Non-owner actions -->
          <div v-else class="solver-actions">
            <button class="btn btn-primary" @click="takeQuiz">{{ t('quiz.startQuiz') }}</button>
            <button 
              v-if="auth.state.isAuthenticated"
              class="btn btn-upvote" 
              :class="{ active: hasUserUpvoted }"
              @click="toggleUpvote"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ upvoteCount }}</span>
              {{ t('quiz.upvote') }}
            </button>
            <button 
              v-else
              class="btn btn-upvote" 
              @click="promptLogin"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ upvoteCount }}</span>
              {{ t('quiz.loginToUpvote') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Quiz Stats (visible to owners or after attempting) -->
      <div v-if="attemptCount > 0 && (isOwner || hasAttempted)" class="quiz-stats">
        <h3>{{ t('quiz.quizStatistics') }}</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">{{ t('quiz.averageScore') }}</div>
            <div class="stat-value">{{ avgScore }}%</div>
            <div class="stat-detail">{{ avgCorrect }} / {{ questions.length }} {{ t('quiz.correctOnAverage') }}</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">{{ t('quiz.passRate') }}</div>
            <div class="stat-value">{{ passRate }}%</div>
            <div class="stat-detail">{{ passCount }} {{ t('quiz.of') }} {{ attemptCount }} {{ t('quiz.attemptsPassed') }}</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">{{ t('quiz.averageTime') }}</div>
            <div class="stat-value">{{ formatTime(avgTime) }}</div>
            <div class="stat-detail">{{ t('quiz.toCompleteThisQuiz') }}</div>
          </div>
        </div>

        <div class="difficulty-distribution">
          <h4>{{ t('quiz.successRateByQuestion') }}</h4>
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

      <!-- Advanced Analytics (visible only to admins and quiz owners) -->
      <div v-if="isAdmin || isOwner" class="advanced-analytics">
        <h3>{{ t('quiz.advancedAnalytics') }}</h3>
        
        <div class="analytics-tabs">
          <button 
            :class="['tab-btn', { active: activeAnalyticsTab === 'attempts' }]" 
            @click="activeAnalyticsTab = 'attempts'"
          >
            {{ t('quiz.attemptHistory') }}
          </button>
          <button 
            :class="['tab-btn', { active: activeAnalyticsTab === 'users' }]" 
            @click="activeAnalyticsTab = 'users'"
          >
            {{ t('quiz.userPerformance') }}
          </button>
          <button 
            :class="['tab-btn', { active: activeAnalyticsTab === 'trends' }]" 
            @click="activeAnalyticsTab = 'trends'"
          >
            {{ t('quiz.performanceTrends') }}
          </button>
        </div>
        
        <!-- Attempt History Tab -->
        <div v-if="activeAnalyticsTab === 'attempts'" class="analytics-tab-content">
          <div class="attempts-list">
            <div v-if="attempts.length === 0" class="empty-state">
              <p>{{ t('quiz.noAttemptsRecorded') }}</p>
            </div>
            <table v-else class="attempts-table">
              <thead>
                <tr>
                  <th>{{ t('common.user') }}</th>
                  <th>{{ t('quiz.score') }}</th>
                  <th>{{ t('quiz.result') }}</th>
                  <th>{{ t('quiz.time') }}</th>
                  <th>{{ t('quiz.date') }}</th>
                  <th>{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attempt in sortedAttempts" :key="attempt.attemptId">
                  <td>{{ getUsernameById(attempt.userId) }}</td>
                  <td>{{ attempt.score }} / {{ attempt.totalQuestions }}</td>
                  <td>
                    <span 
                      class="badge"
                      :class="{ 'pass': attempt.isPassed, 'fail': !attempt.isPassed }"
                    >
                      {{ attempt.isPassed ? t('quiz.passed') : t('quiz.failed') }}
                    </span>
                  </td>
                  <td>{{ formatTime(attempt.elapsedTime) }}</td>
                  <td>{{ formatDateWithTime(attempt.completedAt) }}</td>
                  <td>
                    <button class="view-btn" @click="viewAttemptDetails(attempt.attemptId)">
                      {{ t('common.viewDetails') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- User Performance Tab -->
        <div v-if="activeAnalyticsTab === 'users'" class="analytics-tab-content">
          <div class="user-performance-chart">
            <h4>{{ t('quiz.topPerformers') }}</h4>
            <div v-if="userPerformance.length === 0" class="empty-state">
              <p>{{ t('quiz.noUserPerformanceData') }}</p>
            </div>
            <table v-else class="attempts-table">
              <thead>
                <tr>
                  <th>{{ t('quiz.rank') }}</th>
                  <th>{{ t('common.username') }}</th>
                  <th>{{ t('quiz.attempts') }}</th>
                  <th>{{ t('quiz.bestScore') }}</th>
                  <th>{{ t('quiz.avgScore') }}</th>
                  <th>{{ t('quiz.bestTime') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, index) in userPerformance" :key="user.userId">
                  <td>{{ index + 1 }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.attemptCount }}</td>
                  <td>{{ user.bestScore }}%</td>
                  <td>{{ user.avgScore }}%</td>
                  <td>{{ formatTime(user.bestTime) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Performance Trends Tab -->
        <div v-if="activeAnalyticsTab === 'trends'" class="analytics-tab-content">
          <div class="trends-content">
            <div class="trend-section">
              <h4>{{ t('quiz.attemptCountOverTime') }}</h4>
              <div v-if="attemptCounts.length === 0" class="empty-state">
                <p>{{ t('quiz.noTrendData') }}</p>
              </div>
              <div v-else>
                <table class="attempts-table">
                  <thead>
                    <tr>
                      <th>{{ t('quiz.timePeriod') }}</th>
                      <th>{{ t('quiz.attemptCount') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(count, index) in attemptCounts" :key="'attempt-' + index">
                      <td>{{ trendTimePeriods[index] }}</td>
                      <td>{{ count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="trend-section">
              <h4>{{ t('quiz.averageScoreTrend') }}</h4>
              <div v-if="avgScoreTrend.length === 0" class="empty-state">
                <p>{{ t('quiz.noTrendData') }}</p>
              </div>
              <div v-else>
                <table class="attempts-table">
                  <thead>
                    <tr>
                      <th>{{ t('quiz.timePeriod') }}</th>
                      <th>{{ t('quiz.averageScore') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(score, index) in avgScoreTrend" :key="'score-' + index">
                      <td>{{ trendTimePeriods[index] }}</td>
                      <td>{{ score }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="attemptCount === 0" class="no-attempts">
        <p>{{ t('quiz.noAttemptsYet') }}</p>
      </div>
      
      <!-- Questions Preview -->
      <div class="questions-preview">
        <h3>{{ t('quiz.quizQuestions') }}</h3>
        
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
                    <div class="option-text">{{ t('common.yes') }}</div>
                  </div>
                  <div 
                    class="answer-option"
                    :class="{ correct: getCorrectTrueFalseAnswer(question.questionId) === false && (isOwner || hasAttempted) }"
                  >
                    <div class="option-marker">
                      <span v-if="getCorrectTrueFalseAnswer(question.questionId) === false && (isOwner || hasAttempted)" class="correct-marker">✓</span>
                      <span v-else class="option-letter">F</span>
                    </div>
                    <div class="option-text">{{ t('common.no') }}</div>
                  </div>
                </template>
                
                <template v-else-if="question.questionType === 'fill_blank'">
                  <div class="answer-option fill-blank">
                    <div class="option-text">
                      <span v-if="isOwner || hasAttempted">
                        {{ t('quiz.answer') }}: <span class="correct-answer">{{ getBlankAnswer(question.questionId) }}</span>
                      </span>
                      <span v-else>
                        {{ t('quiz.answerRevealedAfterQuiz') }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </li>
        </ul>
        
        <div v-if="!isOwner && !hasAttempted" class="answer-note">
          <p>{{ t('quiz.correctAnswersShownAfterAttempt') }}</p>
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
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/api/supabase'
import { auth } from '@/store/auth'
import { useLanguage } from '@/context/LanguageContext'
import '@/assets/pages/quizdetails.css';
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const language = useLanguage()
const t = (key: string) => language?.t?.(key) || key

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

// Analytics data
const activeAnalyticsTab = ref('attempts')
const usernames = reactive<{[key: number]: string}>({})
const userPerformance = ref<any[]>([])
const trendTimePeriods = ref<string[]>([])
const attemptCounts = ref<number[]>([])
const avgScoreTrend = ref<number[]>([])
const maxAttemptCount = ref(0)

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

const isAdmin = computed(() => {
  return auth.state.isAuthenticated && 
         auth.state.user && 
         auth.state.user.roleId === 1 // Admin role ID is 1
})

const hasAttempted = computed(() => {
  return userAttempts.value.length > 0
})

// Stats computed properties
const attemptCount = computed(() => attempts.value.length)

// Sorted attempts for the table (most recent first)
const sortedAttempts = computed(() => {
  return [...attempts.value].sort((a, b) => {
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  })
})

// Format a date string
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Format date with time
const formatDateWithTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
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

const viewAttemptDetails = (attemptId: number) => {
  router.push(`/attempt/${attemptId}`)
}

// Get username by user ID (for analytics)
const getUsernameById = (userId: number) => {
  return usernames[userId] || 'Unknown User'
}

// Calculate bar height for trend charts
const calculateBarHeight = (value: number, maxValue: number) => {
  if (maxValue === 0) return '0%'
  const percentage = (value / maxValue) * 100
  return `${percentage}%`
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

// Format question type for display
const formatQuestionType = (type: string) => {
  if (type === 'multiple_choice') return t('quiz.multipleChoice')
  if (type === 'true_false') return t('quiz.trueFalse')
  if (type === 'fill_blank') return t('quiz.fillBlank')
  return type
}

// Toggle quiz upvote function
const toggleQuizUpvote = async (quizId: number, userId: number) => {
  // Check if user has already upvoted
  const { data: existingUpvotes, error: fetchError } = await supabase
    .from('QuizUpvotes')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .limit(1); // Fetch as array, limit 1
  
  if (fetchError) {
    console.error('Error fetching existing upvote during toggle:', fetchError);
    throw fetchError;
  }
  
  const upvoteExists = existingUpvotes && existingUpvotes.length > 0;
  
  // If upvote exists, remove it
  if (upvoteExists) {
    const upvoteId = existingUpvotes[0].id; // Get the ID of the specific upvote record
    const { error: deleteError } = await supabase
      .from('QuizUpvotes')
      .delete()
      .eq('id', upvoteId); // Delete by its primary key 'id'
    
    if (deleteError) {
      console.error('Error deleting upvote:', deleteError);
      throw deleteError;
    }
    return false; // Indicates upvote was removed
  } 
  // Otherwise add upvote
  else {
    const { error: insertError } = await supabase
      .from('QuizUpvotes')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting upvote:', insertError);
      throw insertError;
    }
    return true; // Indicates upvote was added
  }
};

// Check if user has upvoted this quiz
const checkUserUpvote = async (quizId: number, userId: number) => {
  const { data, error } = await supabase
    .from('QuizUpvotes')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .limit(1); // Fetch as array, limit 1
  
  if (error) {
    console.error('Error checking upvote status:', error);
    return false;
  }
  
  return data !== null && data.length > 0; // Check if array is not null and has elements
};

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
  confirmationData.title = t('quiz.deleteQuiz');
  confirmationData.message = t('quiz.deleteQuizConfirmation');
  confirmationData.confirmText = t('common.delete');
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
    
    // Load advanced analytics data for admins and quiz owners
    if ((auth.state.user && auth.state.user.roleId === 1) || isOwner) {
      await loadAnalyticsData()
    }
    
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

// Load analytics data (for admins and quiz owners)
async function loadAnalyticsData() {
  if (attempts.value.length === 0) return
  
  // Get unique user IDs
  const userIds = Array.from(new Set(attempts.value.map(a => a.userId)))
  
  // Load usernames for all users who attempted the quiz
  await loadUsernames(userIds)
  
  // Generate user performance data
  generateUserPerformanceData(userIds)
  
  // Generate trend data
  generateTrendData()
}

// Load usernames for user IDs
async function loadUsernames(userIds: number[]) {
  if (userIds.length === 0) return
  
  const { data, error } = await supabase
    .from('Users')
    .select('id, username')
    .in('id', userIds)
  
  if (error) {
    console.error('Error loading usernames:', error)
    return
  }
  
  if (data && data.length > 0) {
    data.forEach(user => {
      usernames[user.id] = user.username
    })
  }
}

// Generate user performance data
function generateUserPerformanceData(userIds: number[]) {
  const performance: any[] = []
  
  userIds.forEach(userId => {
    const userAttempts = attempts.value.filter(a => a.userId === userId)
    if (userAttempts.length === 0) return
    
    const scores = userAttempts.map(a => Math.round((a.score / a.totalQuestions) * 100))
    const times = userAttempts.map(a => a.elapsedTime)
    
    performance.push({
      userId,
      username: usernames[userId] || 'Unknown User',
      attemptCount: userAttempts.length,
      bestScore: Math.max(...scores),
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestTime: Math.min(...times)
    })
  })
  
  // Sort by best score (highest first)
  userPerformance.value = performance.sort((a, b) => b.bestScore - a.bestScore)
}

// Generate trend data for charts
function generateTrendData() {
  // Get all attempt dates
  const attemptDates = attempts.value.map(a => new Date(a.completedAt))
  
  // Sort dates in ascending order
  attemptDates.sort((a, b) => a.getTime() - b.getTime())
  
  if (attemptDates.length === 0) return
  
  // Get the oldest and newest dates
  const oldestDate = attemptDates[0]
  const newestDate = attemptDates[attemptDates.length - 1]
  
  // Create time periods (use weeks if range > 30 days, otherwise use days)
  const daysDiff = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
  const useWeeks = daysDiff > 30
  const numPeriods = Math.min(useWeeks ? 12 : 14, Math.max(5, daysDiff / (useWeeks ? 7 : 1)))
  
  // Create periods
  const periods = []
  const periodData: { label: string, attempts: any[] }[] = []
  
  for (let i = 0; i < numPeriods; i++) {
    const date = new Date(oldestDate)
    date.setDate(date.getDate() + i * (useWeeks ? 7 : 1))
    
    const formatter = new Intl.DateTimeFormat('default', {
      month: 'short',
      day: 'numeric'
    })
    
    const label = formatter.format(date)
    periods.push(label)
    periodData.push({
      label,
      attempts: []
    })
  }
  
  // Assign attempts to periods
  for (const attempt of attempts.value) {
    const attemptDate = new Date(attempt.completedAt)
    const daysSinceStart = Math.floor((attemptDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
    const periodIndex = Math.min(Math.floor(daysSinceStart / (useWeeks ? 7 : 1)), numPeriods - 1)
    
    if (periodIndex >= 0 && periodIndex < periodData.length) {
      periodData[periodIndex].attempts.push(attempt)
    }
  }
  
  // Calculate attempt counts and average scores for each period
  const counts = periodData.map(period => period.attempts.length)
  const avgScores = periodData.map(period => {
    if (period.attempts.length === 0) return 0
    const total = period.attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions * 100), 0)
    return Math.round(total / period.attempts.length)
  })
  
  // Store data for charts
  trendTimePeriods.value = periods
  attemptCounts.value = counts
  avgScoreTrend.value = avgScores
  maxAttemptCount.value = Math.max(...counts)
}
</script>
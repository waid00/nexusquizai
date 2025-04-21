<!-- src/pages/MyQuizzes.vue -->
<template>
  <div class="my-quizzes">
    <h2 class="page-title">My Quizzes</h2>

    <div class="tab-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'created' }]" 
        @click="activeTab = 'created'"
      >
        Created Quizzes
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'attempts' }]" 
        @click="activeTab = 'attempts'"
      >
        Quiz Attempts
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your quizzes...</p>
    </div>

    <!-- Created Quizzes Tab -->
    <div v-else-if="activeTab === 'created'" class="tab-content">
      <div v-if="createdQuizzes.length === 0" class="empty-state">
        <p>You haven't created any quizzes yet.</p>
        <router-link to="/generate" class="action-btn">Create a Quiz</router-link>
      </div>

      <div v-else class="quiz-list">
        <div 
          v-for="quiz in createdQuizzes" 
          :key="quiz.quizId" 
          class="quiz-card"
        >
          <div class="quiz-card-header">
            <h3 class="quiz-title">{{ quiz.title }}</h3>
            <span class="quiz-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</span>
          </div>
          <div class="quiz-card-body">
            <p class="quiz-description">{{ quiz.description }}</p>
            <div class="quiz-stats">
              <div class="stat-item">
                <span class="stat-label">Questions</span>
                <span class="stat-value">{{ quiz.questionCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Attempts</span>
                <span class="stat-value">{{ quiz.attemptCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Created</span>
                <span class="stat-value">{{ formatDate(quiz.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="quiz-card-actions">
            <button class="action-btn take-quiz" @click="takeQuiz(quiz.quizId)">Take Quiz</button>
            <button class="action-btn view-details" @click="viewQuizDetails(quiz.quizId)">View Details</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Attempts Tab -->
    <div v-else-if="activeTab === 'attempts'" class="tab-content">
      <div v-if="quizAttempts.length === 0" class="empty-state">
        <p>You haven't taken any quizzes yet.</p>
        <router-link to="/generate" class="action-btn">Take a Quiz</router-link>
      </div>

      <div v-else class="attempts-list">
        <div 
          v-for="attempt in quizAttempts" 
          :key="attempt.attemptId" 
          class="attempt-card"
          :class="{ 'passed': attempt.isPassed }"
        >
          <div class="attempt-card-header">
            <h3 class="quiz-title">{{ attempt.quizTitle }}</h3>
            <div 
              class="pass-status"
              :class="{ 'passed': attempt.isPassed }"
            >
              {{ attempt.isPassed ? 'PASSED' : 'FAILED' }}
            </div>
          </div>
          <div class="attempt-card-body">
            <div class="attempt-stats">
              <div class="stat-item">
                <span class="stat-label">Score</span>
                <span class="stat-value">{{ Math.round((attempt.score / attempt.totalQuestions) * 100) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Questions</span>
                <span class="stat-value">{{ attempt.score }} / {{ attempt.totalQuestions }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Time</span>
                <span class="stat-value">{{ formatTime(attempt.elapsedTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Date</span>
                <span class="stat-value">{{ formatDate(attempt.completedAt) }}</span>
              </div>
            </div>
          </div>
          <div class="attempt-card-actions">
            <button class="action-btn take-quiz" @click="retakeQuiz(attempt.quizId)">Retake Quiz</button>
            <button class="action-btn view-results" @click="viewAttemptDetails(attempt.attemptId)">View Results</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'

const router = useRouter()
const activeTab = ref('created')
const isLoading = ref(true)
const createdQuizzes = ref<any[]>([])
const quizAttempts = ref<any[]>([])

// On component mount, fetch user's quizzes and attempts
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  try {
    await Promise.all([
      fetchCreatedQuizzes(),
      fetchQuizAttempts()
    ])
  } catch (error) {
    console.error('Error loading quiz data:', error)
  } finally {
    isLoading.value = false
  }
})

// Fetch quizzes created by the user
async function fetchCreatedQuizzes() {
  const { getDB } = await import('@/db/index')
  const db = await getDB()
  
  try {
    // Get all quizzes created by the user with question count and attempt count
    const result = db.exec(`
      SELECT 
        q.quiz_id as quizId,
        q.title,
        q.description,
        q.difficulty,
        q.created_at as createdAt,
        q.published_at as publishedAt,
        (SELECT COUNT(*) FROM Questions WHERE quiz_id = q.quiz_id) as questionCount,
        (SELECT COUNT(*) FROM QuizAttempts WHERE quiz_id = q.quiz_id) as attemptCount
      FROM Quizzes q
      WHERE q.owner_id = ?
      ORDER BY q.created_at DESC
    `, [auth.state.user!.userId])
    
    if (result.length > 0 && result[0].values.length > 0) {
      // Convert the result to an array of objects
      createdQuizzes.value = result[0].values.map((row: any[]) => {
        return {
          quizId: row[0],
          title: row[1],
          description: row[2],
          difficulty: row[3],
          createdAt: row[4],
          publishedAt: row[5],
          questionCount: row[6],
          attemptCount: row[7]
        }
      })
    }
  } catch (error) {
    console.error('Error fetching created quizzes:', error)
    throw error
  }
}

// Fetch quiz attempts by the user
async function fetchQuizAttempts() {
  const { getDB } = await import('@/db/index')
  const db = await getDB()
  
  try {
    // Get all quiz attempts by the user
    const result = db.exec(`
      SELECT 
        a.attempt_id as attemptId,
        a.quiz_id as quizId,
        q.title as quizTitle,
        a.score,
        a.total_questions as totalQuestions,
        a.elapsed_time as elapsedTime,
        a.completed_at as completedAt,
        a.is_passed as isPassed
      FROM QuizAttempts a
      JOIN Quizzes q ON a.quiz_id = q.quiz_id
      WHERE a.user_id = ?
      ORDER BY a.completed_at DESC
    `, [auth.state.user!.userId])
    
    if (result.length > 0 && result[0].values.length > 0) {
      // Convert the result to an array of objects
      quizAttempts.value = result[0].values.map((row: any[]) => {
        return {
          attemptId: row[0],
          quizId: row[1],
          quizTitle: row[2],
          score: row[3],
          totalQuestions: row[4],
          elapsedTime: row[5],
          completedAt: row[6],
          isPassed: row[7] === 1
        }
      })
    }
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    throw error
  }
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format time in minutes and seconds
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Navigate to take a quiz
function takeQuiz(quizId: number) {
  router.push(`/quiz/${quizId}`)
}

// Navigate to retake a quiz
function retakeQuiz(quizId: number) {
  router.push(`/quiz/${quizId}`)
}

// View details of a quiz
function viewQuizDetails(quizId: number) {
  router.push(`/quiz/${quizId}/details`)
}

// View details of an attempt
function viewAttemptDetails(attemptId: number) {
  router.push(`/attempt/${attemptId}`)
}
</script>

<style scoped>
.my-quizzes {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-title {
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--input-border);
  padding-bottom: 2px;
}

.tab-btn {
  background: none;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-alt);
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;
}

.tab-btn.active {
  color: var(--accent);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--accent);
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.empty-state p {
  margin-bottom: var(--spacing-md);
  color: var(--text-alt);
}

/* Quiz Cards */
.quiz-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-md);
}

.quiz-card, .attempt-card {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quiz-card:hover, .attempt-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.quiz-card-header, .attempt-card-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--input-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
}

.quiz-badge {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: capitalize;
}

.quiz-badge.easy {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.quiz-badge.medium {
  background: rgba(255, 171, 0, 0.15);
  color: #ffab00;
}

.quiz-badge.hard {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.quiz-card-body, .attempt-card-body {
  padding: var(--spacing-md);
  flex-grow: 1;
}

.quiz-description {
  color: var(--text-alt);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quiz-stats, .attempt-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--spacing-xs);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-alt);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
}

.quiz-card-actions, .attempt-card-actions {
  padding: var(--spacing-md);
  border-top: 1px solid var(--input-border);
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.action-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  text-decoration: none;
  flex: 1;
}

.take-quiz {
  background: var(--accent);
  color: white;
  border: none;
}

.take-quiz:hover {
  background: rgba(46, 204, 113, 0.8);
}

.view-details, .view-results {
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.view-details:hover, .view-results:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Attempts specific styling */
.attempts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.attempt-card {
  position: relative;
}

.pass-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.pass-status.passed {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .my-quizzes {
    padding: var(--spacing-md);
  }
  
  .quiz-list {
    grid-template-columns: 1fr;
  }
  
  .tab-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.9rem;
  }
}
</style>
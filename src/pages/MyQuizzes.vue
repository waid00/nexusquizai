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
          :class="quiz.difficulty"
        >
          <div class="quiz-card-header">
            <h3 class="quiz-title">{{ quiz.title }}</h3>
            <span class="quiz-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</span>
          </div>
          <div class="quiz-card-body">
            <p class="quiz-description">{{ quiz.description }}</p>
            
            <div class="privacy-toggle">
              <span class="toggle-label">{{ quiz.isPublic ? 'Public' : 'Private' }}</span>
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="quiz.isPublic" 
                  @change="toggleQuizPrivacy(quiz)"
                >
                <span class="slider round"></span>
              </label>
            </div>
            
            <div class="quiz-stats">
              <div class="stat-item">
                <span class="stat-label">Questions</span>
                <span class="stat-value">{{ quiz.questionCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Attempts</span>
                <span class="stat-value">{{ quiz.attemptCount }}</span>
              </div>
              <div class="stat-item created-date">
                <span class="stat-label">Created</span>
                <span class="stat-value">{{ formatDate(quiz.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="quiz-card-footer-container">
            <button 
              class="quiz-card-footer upvote"
              :class="{ active: quiz.hasUserUpvoted }"
              @click.stop="toggleUpvote(quiz)"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ quiz.upvoteCount }}</span>
            </button>
            
            <button 
              class="quiz-card-footer take-quiz"
              @click.stop="takeQuiz(quiz.quizId)"
            >
              Attempt
            </button>
            
            <button 
              class="quiz-card-footer view-details"
              @click.stop="viewQuizDetails(quiz.quizId)"
            >
              Details
            </button>
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
            <button class="action-btn delete-btn" @click="confirmDeleteAttempt(attempt)">Delete</button>
          </div>
        </div>
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const router = useRouter()
const activeTab = ref('created')
const isLoading = ref(true)
const createdQuizzes = ref<any[]>([])
const quizAttempts = ref<any[]>([])

// Confirmation modal state
const showConfirmation = ref(false)
const confirmationData = reactive({
  title: '',
  message: '',
  confirmText: 'Confirm',
  type: 'warning',
  action: '',
  data: null as any
})

// On component mount, fetch user's quizzes and attempts
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  try {
    // Reset any cached data
    createdQuizzes.value = []
    quizAttempts.value = []
    console.log('MyQuizzes component mounted, fetching fresh quiz data')
    
    // Fetch data from Supabase
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
  try {
    console.log('Fetching quizzes for user ID:', auth.state.user!.userId);
    
    // Get full quiz data in a single query with counts using Supabase's relationships
    const { data: quizzes, error } = await supabase
      .from('Quizzes')
      .select(`
        id,
        title,
        description,
        difficulty,
        created_at,
        is_public,
        Questions:Questions(count),
        QuizAttempts:QuizAttempts(count),
        QuizUpvotes:QuizUpvotes(count)
      `)
      .eq('owner_id', auth.state.user!.userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
    
    if (!quizzes || quizzes.length === 0) {
      console.log('No quizzes found for this user');
      createdQuizzes.value = [];
      return;
    }
    
    console.log('Fetched quizzes:', quizzes);
    
    // Get user upvotes in a separate query
    const { data: userUpvotes, error: upvoteError } = await supabase
      .from('QuizUpvotes')
      .select('quiz_id')
      .eq('user_id', auth.state.user!.userId);
    
    if (upvoteError) {
      console.error('Error fetching user upvotes:', upvoteError);
    }
    
    // Format the quiz data
    createdQuizzes.value = quizzes.map(quiz => {
      return {
        quizId: quiz.id,
        title: quiz.title || 'Untitled Quiz',
        description: quiz.description || 'No description available',
        difficulty: typeof quiz.difficulty === 'string' ? quiz.difficulty.toLowerCase() : 'medium',
        createdAt: quiz.created_at,
        isPublic: quiz.is_public,
        questionCount: quiz.Questions?.length || 0,
        attemptCount: quiz.QuizAttempts?.length || 0,
        upvoteCount: quiz.QuizUpvotes?.length || 0,
        hasUserUpvoted: userUpvotes ? userUpvotes.some((uv: any) => uv.quiz_id === quiz.id) : false
      };
    });
    
    console.log('Processed quizzes:', createdQuizzes.value);
  } catch (error) {
    console.error('Error fetching created quizzes:', error);
    createdQuizzes.value = [];
  }
}

// Fetch quiz attempts by the user
async function fetchQuizAttempts() {
  try {
    console.log('Fetching quiz attempts for user ID:', auth.state.user!.userId);
    
    const { data, error } = await supabase
      .from('QuizAttempts')
      .select(`
        id,
        quiz_id,
        score,
        total_questions,
        elapsed_time,
        completed_at,
        is_passed,
        Quizzes (
          title
        )
      `)
      .eq('user_id', auth.state.user!.userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No quiz attempts found for this user');
      quizAttempts.value = [];
      return;
    }
    
    console.log('Fetched quiz attempts:', data);
    
    quizAttempts.value = data.map(attempt => ({
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      quizTitle: attempt.Quizzes?.title || 'Untitled Quiz',
      score: attempt.score || 0,
      totalQuestions: attempt.total_questions || 1,
      elapsedTime: attempt.elapsed_time || 0,
      completedAt: attempt.completed_at,
      isPassed: attempt.is_passed || false
    }));
    
    console.log('Processed quiz attempts:', quizAttempts.value);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    quizAttempts.value = [];
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

// Toggle quiz privacy status
async function toggleQuizPrivacy(quiz: any) {
  try {
    const { data, error } = await supabase
      .from('Quizzes')
      .update({ is_public: !quiz.isPublic })
      .eq('id', quiz.quizId)
      .eq('owner_id', auth.state.user!.userId)

    if (error) throw error

    quiz.isPublic = !quiz.isPublic
  } catch (error) {
    console.error('Error toggling quiz privacy:', error)
  }
}

// Toggle upvote status
async function toggleUpvote(quiz: any) {
  try {
    if (quiz.hasUserUpvoted) {
      const { error } = await supabase
        .from('QuizUpvotes')
        .delete()
        .eq('quiz_id', quiz.quizId)
        .eq('user_id', auth.state.user!.userId)

      if (error) throw error

      quiz.upvoteCount -= 1
    } else {
      const { error } = await supabase
        .from('QuizUpvotes')
        .insert({
          quiz_id: quiz.quizId,
          user_id: auth.state.user!.userId
        })

      if (error) throw error

      quiz.upvoteCount += 1
    }

    quiz.hasUserUpvoted = !quiz.hasUserUpvoted
  } catch (error) {
    console.error('Error toggling upvote:', error)
  }
}

// Confirm delete quiz
function confirmDeleteQuiz(quiz: any) {
  confirmationData.title = 'Delete Quiz';
  confirmationData.message = `Are you sure you want to delete the quiz "${quiz.title}"? This action cannot be undone.`;
  confirmationData.confirmText = 'Delete';
  confirmationData.type = 'danger';
  confirmationData.action = 'deleteQuiz';
  confirmationData.data = quiz;
  
  showConfirmation.value = true;
}

// Delete a quiz (soft delete)
async function deleteQuiz(quiz: any) {
  try {
    const { error } = await supabase
      .from('Quizzes')
      .update({ is_deleted: true })
      .eq('id', quiz.quizId)
      .eq('owner_id', auth.state.user!.userId)

    if (error) throw error

    // Remove the quiz from the list
    createdQuizzes.value = createdQuizzes.value.filter(q => q.quizId !== quiz.quizId)
  } catch (error) {
    console.error('Error deleting quiz:', error)
    alert('Failed to delete quiz. Please try again.')
  }
}

// Confirm delete attempt
function confirmDeleteAttempt(attempt: any) {
  confirmationData.title = 'Delete Attempt';
  confirmationData.message = `Are you sure you want to delete your attempt for the quiz "${attempt.quizTitle}"? This action cannot be undone.`;
  confirmationData.confirmText = 'Delete';
  confirmationData.type = 'danger';
  confirmationData.action = 'deleteAttempt';
  confirmationData.data = attempt;
  
  showConfirmation.value = true;
}

// Delete a quiz attempt
async function deleteAttempt(attempt: any) {
  try {
    const { error } = await supabase
      .from('QuizAttempts')
      .delete()
      .eq('id', attempt.attemptId)
      .eq('user_id', auth.state.user!.userId)

    if (error) throw error

    // Remove the attempt from the list
    quizAttempts.value = quizAttempts.value.filter(a => a.attemptId !== attempt.attemptId)
  } catch (error) {
    console.error('Error deleting attempt:', error)
    alert('Failed to delete attempt. Please try again.')
  }
}

// Handle confirmation modal actions
function confirmAction() {
  switch (confirmationData.action) {
    case 'deleteQuiz':
      deleteQuiz(confirmationData.data);
      break;
    case 'deleteAttempt':
      deleteAttempt(confirmationData.data);
      break;
  }
  
  showConfirmation.value = false;
}

// Cancel confirmation
function cancelConfirmation() {
  showConfirmation.value = false;
}
</script>

<style scoped>
.my-quizzes {
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

@media (min-width: 992px) {
  .quiz-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .quiz-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .quiz-list {
    grid-template-columns: 1fr;
  }
}

.quiz-card {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-top: 3px solid;
}

.quiz-card.easy {
  border-top-color: #2ed573;
}

.quiz-card.medium {
  border-top-color: #ffab00;
}

.quiz-card.hard {
  border-top-color: #ff4757;
}

.quiz-card:hover {
  transform: translateY(-5px);
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
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  max-width: 200px;
  word-break: break-word;
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.privacy-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.toggle-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--input-border);
  transition: 0.4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent);
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.quiz-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
}

.quiz-stats .created-date {
  grid-column: 1 / 3;
  margin-top: var(--spacing-xs);
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

.stat-item.created-date .stat-label {
  font-weight: bold;
}

.quiz-card-footer-container {
  display: flex;
  flex-direction: row;
  border-top: 1px solid var(--input-border);
  margin-top: auto;
}

.quiz-card-footer {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-xs);
  border: none;
  background-color: rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-weight: 500;
  color: var(--text-alt);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 0;
  font-size: 0.9rem;
  height: 38px; /* Increased from 32px to 38px (1.2 times larger) */
}

.quiz-card-footer:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.quiz-card-footer.upvote {
  border-radius: 0 0 0 var(--radius-md);
  border-right: 1px solid var(--input-border);
}

.quiz-card-footer.view-details {
  border-radius: 0 0 var(--radius-md) 0;
  border-left: 1px solid var(--input-border);
}

.quiz-card-footer.take-quiz {
  background: var(--accent);
  color: white;
}

.quiz-card-footer.take-quiz:hover {
  background: color-mix(in srgb, var(--accent) 90%, white);
}

.quiz-card.easy .quiz-card-footer.take-quiz {
  background: #2ed573;
  color: black;
}

.quiz-card.medium .quiz-card-footer.take-quiz {
  background: #ffab00;
  color: black;
}

.quiz-card.hard .quiz-card-footer.take-quiz {
  background: #ff4757;
  color: black;
}

.quiz-card.easy .quiz-card-footer.take-quiz:hover {
  background: color-mix(in srgb, #2ed573 90%, white);
}

.quiz-card.medium .quiz-card-footer.take-quiz:hover {
  background: color-mix(in srgb, #ffab00 90%, white);
}

.quiz-card.hard .quiz-card-footer.take-quiz:hover {
  background: color-mix(in srgb, #ff4757 90%, white);
}

/* Bottom border radius for the last footer button */
.quiz-card-footer:last-child {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

/* Upvote icon and count */
.upvote-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.upvote-count {
  font-weight: 600;
  margin: 0 2px;
}

/* Attempts specific styling */
.attempts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.attempt-card {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: var(--shadow-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.attempt-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
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
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tab-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.9rem;
  }
}

/* Action buttons container */
.action-buttons-container {
  display: flex;
  align-items: center;
}

.main-buttons-container {
  display: flex;
  flex: 1;
  gap: var(--spacing-sm);
}

/* Delete button */
.delete-btn {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
  border: 1px solid rgba(255, 71, 87, 0.3);
  padding: 4px 8px;
  font-size: 0.85rem;
}

.delete-btn:hover {
  background: rgba(255, 71, 87, 0.3);
}

/* Attempt card actions (with 3 buttons) */
.attempt-card-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.attempt-card-actions .action-btn {
  flex: 1;
  font-size: 0.85rem;
}
</style>
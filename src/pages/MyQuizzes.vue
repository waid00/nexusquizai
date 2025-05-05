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

<style>
@import '../assets/pages/my-quizzes.css';
@import '../assets/components/quiz-cards.css';
</style>
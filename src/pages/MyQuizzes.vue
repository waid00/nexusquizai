<!-- src/pages/MyQuizzes.vue -->
<template>
  <div class="my-quizzes">
    <h2 class="page-title">{{ t('myQuizzes.title') }}</h2>

    <div class="tab-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'created' }]" 
        @click="activeTab = 'created'"
      >
        {{ t('myQuizzes.createdQuizzes') }}
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'attempts' }]" 
        @click="activeTab = 'attempts'"
      >
        {{ t('myQuizzes.quizAttempts') }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- Created Quizzes Tab -->
    <div v-else-if="activeTab === 'created'" class="tab-content">
      <div v-if="displayedCreatedQuizzes.length === 0 && !canLoadMoreCreated" class="empty-state">
        <p>{{ t('myQuizzes.noCreatedQuizzes') }}</p>
        <router-link to="/generate" class="action-btn">{{ t('myQuizzes.createQuiz') }}</router-link>
      </div>

      <div v-else class="quiz-list">
        <div 
          v-for="quiz in displayedCreatedQuizzes" 
          :key="quiz.quizId" 
          class="quiz-card clickable"
          :class="quiz.difficulty"
          @click="viewQuizDetails(quiz.quizId)"
        >
          <div class="quiz-card-header">
            <h3 class="quiz-title">{{ quiz.title }}</h3>
            <span class="quiz-badge" :class="quiz.difficulty">{{ t(`quiz.${quiz.difficulty}`) }}</span>
          </div>
          <div class="quiz-card-body">
            <p class="quiz-description">{{ quiz.description }}</p>
            
            <div class="privacy-toggle" @click.stop>
              <span class="toggle-label">{{ quiz.isPublic ? t('myQuizzes.public') : t('myQuizzes.private') }}</span>
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
                <span class="stat-label">{{ t('quiz.questions') }}</span>
                <span class="stat-value">{{ quiz.questionCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('quiz.attempts') }}</span>
                <span class="stat-value">{{ quiz.attemptCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('common.created') }}</span>
                <span class="stat-value">{{ formatDate(quiz.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="quiz-card-footer-container" @click.stop>
            <button 
              class="quiz-card-footer upvote"
              :class="{ active: quiz.hasUserUpvoted }"
              @click="toggleUpvote(quiz)"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ quiz.upvoteCount }}</span>
            </button>
            
            <button 
              class="quiz-card-footer take-quiz"
              @click="takeQuiz(quiz.quizId)"
            >
              {{ t('myQuizzes.attempt') }}
            </button>
          </div>
        </div>
        <!-- Loading indicator for infinite scrolling -->
        <div v-if="isLoadingMore" class="loading-more-container">
          <div class="loading-spinner"></div>
          <p>{{ t('myQuizzes.loadingMore') }}</p>
        </div>
        <div ref="loadMoreTrigger" class="load-more-trigger"></div>
      </div>
    </div>

    <!-- Quiz Attempts Tab -->
    <div v-else-if="activeTab === 'attempts'" class="tab-content">
      <div v-if="displayedAttempts.length === 0 && !canLoadMoreAttempts" class="empty-state">
        <p>{{ t('myQuizzes.noAttempts') }}</p>
        <router-link to="/generate" class="action-btn">{{ t('myQuizzes.takeQuiz') }}</router-link>
      </div>

      <div v-else class="attempts-list">
        <div 
          v-for="attempt in displayedAttempts" 
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
              {{ attempt.isPassed ? t('quiz.pass') : t('quiz.fail') }}
            </div>
          </div>
          <div class="attempt-card-body">
            <div class="attempt-stats">
              <div class="stat-item">
                <span class="stat-label">{{ t('quiz.score') }}</span>
                <span class="stat-value">{{ Math.round((attempt.score / attempt.totalQuestions) * 100) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('quiz.questions') }}</span>
                <span class="stat-value">{{ attempt.score }} / {{ attempt.totalQuestions }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('myQuizzes.time') }}</span>
                <span class="stat-value">{{ formatTime(attempt.elapsedTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('myQuizzes.date') }}</span>
                <span class="stat-value">{{ formatDate(attempt.completedAt) }}</span>
              </div>
            </div>
          </div>
          <div class="attempt-card-actions">
            <button class="action-btn take-quiz" @click="retakeQuiz(attempt.quizId)">{{ t('quiz.retakeQuiz') }}</button>
            <button class="action-btn view-results" @click="viewAttemptDetails(attempt.attemptId)">{{ t('myQuizzes.viewResults') }}</button>
            <button class="action-btn delete-btn" @click="confirmDeleteAttempt(attempt)">{{ t('common.delete') }}</button>
          </div>
        </div>
        <!-- Loading indicator for infinite scrolling -->
        <div v-if="isLoadingMore" class="loading-more-container">
          <div class="loading-spinner"></div>
          <p>{{ t('myQuizzes.loadingMore') }}</p>
        </div>
        <div ref="loadMoreTrigger" class="load-more-trigger"></div>
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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { useLanguage } from '@/context/LanguageContext'

const router = useRouter()
const activeTab = ref('created')
const isLoading = ref(true)
const createdQuizzes = ref<any[]>([])
const quizAttempts = ref<any[]>([])

// Get translation function
const languageState = useLanguage()
const t = (key: string, params?: Record<string, any>): string => {
  if (!languageState) return key
  
  // Get the translation from the language state
  let translation = languageState.t(key)
  
  // If params are provided, replace placeholders like {param} with actual values
  if (params) {
    Object.keys(params).forEach(paramKey => {
      const placeholder = new RegExp(`{${paramKey}}`, 'g')
      translation = translation.replace(placeholder, params[paramKey])
    })
  }
  
  return translation
}

// Added for infinite scrolling
const displayedCreatedQuizzes = ref<any[]>([])
const displayedAttempts = ref<any[]>([])
const pageSize = 4 // Show only 4 items initially
const currentCreatedPage = ref(1)
const currentAttemptsPage = ref(1)
const canLoadMoreCreated = ref(false)
const canLoadMoreAttempts = ref(false)
const isLoadingMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

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
    displayedCreatedQuizzes.value = []
    displayedAttempts.value = []
    console.log('MyQuizzes component mounted, fetching fresh quiz data')
    
    // Fetch data from Supabase
    await Promise.all([
      fetchCreatedQuizzes(), 
      fetchQuizAttempts()
    ])
    
    // Setup intersection observer for infinite scrolling
    setupIntersectionObserver()
  } catch (error) {
    console.error('Error loading quiz data:', error)
  } finally {
    isLoading.value = false
  }
})

// Set up the intersection observer for infinite scrolling
function setupIntersectionObserver() {
  // Wait for the DOM to update fully
  setTimeout(() => {
    if (loadMoreTrigger.value) {
      console.log('Setting up intersection observer for MyQuizzes');
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        console.log('Intersection detected:', entry.isIntersecting);
        if (entry.isIntersecting && !isLoadingMore.value) {
          if (activeTab.value === 'created' && canLoadMoreCreated.value) {
            console.log('Loading more created quizzes');
            loadMoreCreatedQuizzes();
          } else if (activeTab.value === 'attempts' && canLoadMoreAttempts.value) {
            console.log('Loading more attempts');
            loadMoreAttempts();
          }
        }
      }, { 
        root: null, // Use the viewport
        rootMargin: '0px 0px 200px 0px', // Load earlier, before fully scrolling to element
        threshold: 0.1 // Trigger when at least 10% of the element is visible
      });
      
      observer.observe(loadMoreTrigger.value);
      console.log('Observer attached to element');
    } else {
      console.log('Load more trigger element not found');
    }
  }, 500);
}

// Clean up the observer when component is unmounted
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    console.log('Observer disconnected');
  }
})

// Load more created quizzes
function loadMoreCreatedQuizzes() {
  if (isLoadingMore.value || !canLoadMoreCreated.value) return;
  
  isLoadingMore.value = true;
  
  // Simulate a small delay to prevent rapid loading
  setTimeout(() => {
    try {
      currentCreatedPage.value++;
      const nextBatch = createdQuizzes.value.slice(
        (currentCreatedPage.value - 1) * pageSize, 
        currentCreatedPage.value * pageSize
      );
      displayedCreatedQuizzes.value = [...displayedCreatedQuizzes.value, ...nextBatch];
      updateCanLoadMoreCreated();
      
      // Re-initialize the observer after loading more content
      if (canLoadMoreCreated.value) {
        setupIntersectionObserver();
      }
    } finally {
      isLoadingMore.value = false;
    }
  }, 300);
}

// Load more attempts
function loadMoreAttempts() {
  if (isLoadingMore.value || !canLoadMoreAttempts.value) return;
  
  isLoadingMore.value = true;
  
  // Simulate a small delay to prevent rapid loading
  setTimeout(() => {
    try {
      currentAttemptsPage.value++;
      const nextBatch = quizAttempts.value.slice(
        (currentAttemptsPage.value - 1) * pageSize, 
        currentAttemptsPage.value * pageSize
      );
      displayedAttempts.value = [...displayedAttempts.value, ...nextBatch];
      updateCanLoadMoreAttempts();
      
      // Re-initialize the observer after loading more content
      if (canLoadMoreAttempts.value) {
        setupIntersectionObserver();
      }
    } finally {
      isLoadingMore.value = false;
    }
  }, 300);
}

// Check if there are more created quizzes to load
function updateCanLoadMoreCreated() {
  canLoadMoreCreated.value = createdQuizzes.value.length > displayedCreatedQuizzes.value.length;
}

// Check if there are more attempts to load
function updateCanLoadMoreAttempts() {
  canLoadMoreAttempts.value = quizAttempts.value.length > displayedAttempts.value.length;
}

// Watch for tab changes to reset and update the loadable content
watch(activeTab, () => {
  // Re-initialize the observer for the new tab content
  setupIntersectionObserver();
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
        owner_id,
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
      // Verify the quiz belongs to the current user
      if (quiz.owner_id !== auth.state.user!.userId) {
        console.log(`Quiz ${quiz.id} does not belong to current user, skipping`);
        return null;
      }
      
      return {
        quizId: quiz.id,
        title: quiz.title || 'Untitled Quiz',
        description: quiz.description || 'No description available',
        difficulty: typeof quiz.difficulty === 'string' ? quiz.difficulty.toLowerCase() : 'medium',
        createdAt: quiz.created_at,
        isPublic: quiz.is_public,
        ownerId: quiz.owner_id,
        questionCount: quiz.Questions?.[0]?.count || 0,
        attemptCount: quiz.QuizAttempts?.[0]?.count || 0,
        upvoteCount: quiz.QuizUpvotes?.[0]?.count || 0,
        hasUserUpvoted: userUpvotes ? userUpvotes.some((uv: any) => uv.quiz_id === quiz.id) : false,
        isUserOwner: quiz.owner_id === auth.state.user!.userId
      };
    }).filter(quiz => quiz !== null); // Filter out the null entries
    
    console.log('Processed quizzes:', createdQuizzes.value);
    
    // Initialize displayed quizzes with the first page
    displayedCreatedQuizzes.value = createdQuizzes.value.slice(0, pageSize);
    updateCanLoadMoreCreated();
  } catch (error) {
    console.error('Error fetching created quizzes:', error);
    createdQuizzes.value = [];
    displayedCreatedQuizzes.value = [];
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
    
    // Initialize displayed attempts with the first page
    displayedAttempts.value = quizAttempts.value.slice(0, pageSize);
    updateCanLoadMoreAttempts();
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    quizAttempts.value = [];
    displayedAttempts.value = [];
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
    displayedCreatedQuizzes.value = displayedCreatedQuizzes.value.filter(q => q.quizId !== quiz.quizId)
    updateCanLoadMoreCreated()
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
    displayedAttempts.value = displayedAttempts.value.filter(a => a.attemptId !== attempt.attemptId)
    updateCanLoadMoreAttempts()
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
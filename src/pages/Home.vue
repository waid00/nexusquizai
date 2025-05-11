<template>
  <div class="public-quizzes">
    <h2 class="page-title">{{ t('quiz.exploreQuizzes') }}</h2>
    
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="t('common.searchForQuizzes')" 
          class="search-input"
          @input="onSearchInput"
        />
        <button 
          v-if="searchQuery" 
          class="clear-search-btn" 
          @click="clearSearch"
          :aria-label="t('common.clearSearch')"
        >×</button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    
    <!-- No quizzes state -->
    <div v-else-if="publicQuizzes.length === 0" class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
        <line x1="16" y1="8" x2="2" y2="22"></line>
        <line x1="17.5" y1="15" x2="9" y2="15"></line>
      </svg>
      <p v-if="searchQuery">{{ t('quiz.noQuizzesMatching') }} "{{ searchQuery }}"</p>
      <p v-else>{{ t('quiz.noPublicQuizzes') }}</p>
      <router-link to="/generate" class="action-btn">{{ t('quiz.createQuiz') }}</router-link>
    </div>
    
    <!-- Quizzes list -->
    <div v-else>
      <div class="quizzes-grid">
        <div 
          v-for="quiz in displayedQuizzes" 
          :key="quiz.quizId" 
          class="quiz-card"
          :class="quiz.difficulty"
          @click="viewQuizDetails(quiz)"
        >
          <div class="quiz-card-header">
            <h3 class="quiz-title">
              <span v-html="highlightMatch(quiz.title)"></span>
            </h3>
            <span class="quiz-badge" :class="quiz.difficulty">{{ t(`quiz.${quiz.difficulty}`) }}</span>
          </div>
          <div class="quiz-card-body">
            <p class="quiz-description text-center">
              <span class="category-label">{{ t('quiz.category') }}: </span>
              <span v-html="highlightMatch(quiz.categoryName)"></span>
            </p>
            
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
                <span class="stat-label">{{ t('common.user') }}</span>
                <span class="author-name">{{ quiz.authorName }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ t('common.created') }}</span>
                <span class="stat-value">{{ formatDate(quiz.createdAt) }}</span>
              </div>
            </div>
          </div>
          <button 
            class="quiz-card-footer" 
            :class="{ active: quiz.hasUserUpvoted }"
            @click.stop="toggleUpvote(quiz)"
            :disabled="!isAuthenticated || quiz.isUserOwner"
          >
            <span class="upvote-icon">⬆</span>
            <span class="upvote-count">{{ quiz.upvoteCount }}</span>
          </button>
        </div>
      </div>
      
      <!-- Infinite scroll loading indicator -->
      <div 
        v-if="canLoadMore" 
        class="loading-more-container"
        ref="loadMoreTrigger"
      >
        <div v-if="isLoadingMore" class="loading-spinner"></div>
        <p v-else>{{ t('common.scrollForMore') }}</p>
      </div>
      <!-- Debug element to ensure we can see when scrolling reaches the bottom -->
      <div class="scroll-debug" v-if="!canLoadMore && displayedQuizzes.length > 0">
        {{ t('common.endOfQuizzes') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import debounce from 'lodash.debounce'
import { getPublicQuizzes, toggleQuizUpvote, checkUserUpvote } from '@/api/supabase'
import { useLanguage } from '@/context/LanguageContext'

const router = useRouter()
const isAuthenticated = computed(() => auth.state.isAuthenticated)
const searchQuery = ref('')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const publicQuizzes = ref<any[]>([])
const displayedQuizzes = ref<any[]>([])
const pageSize = 3 // Changed from 6 to 3 to show fewer quizzes initially
const currentPage = ref(1)
const canLoadMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Get the translation function
const languageState = useLanguage();
const t = (key: string): string => {
  if (!languageState) return key;
  return languageState.t(key);
};

// Format date for display
function formatDate(dateString: string) {
  if (!dateString) return t('common.unknown');
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return t('common.today');
  } else if (diffDays < 2) {
    return t('common.yesterday');
  } else if (diffDays < 7) {
    const daysAgoText = t('common.daysAgo');
    return daysAgoText.replace('{days}', diffDays.toString());
  } else {
    // Use the current language for date formatting
    const locale = languageState?.language.value === 'cs' ? 'cs-CZ' : 'en-US';
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

// Rest of your existing code...
const onSearchInput = debounce(() => {
  resetQuizDisplay()
  filterQuizzes()
}, 300)

function resetQuizDisplay() {
  currentPage.value = 1
  displayedQuizzes.value = []
}

function filterQuizzes() {
  if (!searchQuery.value.trim()) {
    // If no search query, show quizzes with infinite scroll
    displayedQuizzes.value = publicQuizzes.value.slice(0, currentPage.value * pageSize)
  } else {
    const query = searchQuery.value.toLowerCase()
    // Implementing smart search to match partial text anywhere in title or description
    const filteredQuizzes = publicQuizzes.value.filter(quiz => 
      quiz.title.toLowerCase().includes(query) || 
      quiz.description.toLowerCase().includes(query)
    )
    displayedQuizzes.value = filteredQuizzes
  }
  
  // Update if more can be loaded
  updateCanLoadMore()
}

function updateCanLoadMore() {
  if (searchQuery.value.trim()) {
    // When searching, we show all results at once
    canLoadMore.value = false
  } else {
    // Check if there are more quizzes to load
    canLoadMore.value = publicQuizzes.value.length > displayedQuizzes.value.length
  }
}

function highlightMatch(text: string): string {
  if (!searchQuery.value.trim() || !text) return text
  
  const query = searchQuery.value.toLowerCase()
  const index = text.toLowerCase().indexOf(query)
  
  if (index >= 0) {
    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)
    return `${before}<span class="highlight">${match}</span>${after}`
  }
  
  return text
}

function clearSearch() {
  searchQuery.value = ''
  resetQuizDisplay()
  filterQuizzes()
}

// On component mount, fetch public quizzes and set up intersection observer
onMounted(async () => {
  try {
    const quizzes = await getPublicQuizzes()
    publicQuizzes.value = quizzes
    displayedQuizzes.value = quizzes.slice(0, pageSize)
    updateCanLoadMore()
  } catch (error) {
    console.error('Error loading public quizzes:', error)
  } finally {
    isLoading.value = false
    setupIntersectionObserver()
  }
})

// Set up the intersection observer for infinite scrolling
function setupIntersectionObserver() {
  // Wait longer for the DOM to update fully
  setTimeout(() => {
    if (loadMoreTrigger.value) {
      console.log('Setting up intersection observer');
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        console.log('Intersection detected:', entry.isIntersecting);
        if (entry.isIntersecting && !isLoadingMore.value && canLoadMore.value) {
          console.log('Loading more quizzes');
          loadMoreQuizzes();
        }
      }, { 
        root: null, // Use the viewport
        rootMargin: '0px 0px 200px 0px', // Load earlier, before fully scrolling to the element
        threshold: 0.1 // Trigger when at least 10% of the element is visible
      });
      
      observer.observe(loadMoreTrigger.value);
      console.log('Observer attached to element');
    } else {
      console.log('Load more trigger element not found');
    }
  }, 500); // Increased timeout to ensure DOM is ready
}

// Clean up the observer when component is unmounted
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    console.log('Observer disconnected');
  }
})

// Watch for changes in search query
watch(searchQuery, () => {
  onSearchInput()
})

// Toggle upvote for a quiz
async function toggleUpvote(quiz: any) {
  if (!auth.state.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  if (quiz.isUserOwner) {
    return; // Users can't upvote their own quizzes
  }
  
  try {
    await toggleQuizUpvote(quiz.quizId, auth.state.user!.userId)
    quiz.hasUserUpvoted = !quiz.hasUserUpvoted
    quiz.upvoteCount += quiz.hasUserUpvoted ? 1 : -1
  } catch (error) {
    console.error('Error toggling upvote:', error)
  }
}

// Load more quizzes for infinite scrolling
function loadMoreQuizzes() {
  if (isLoadingMore.value || !canLoadMore.value) return;
  
  isLoadingMore.value = true;
  
  // Simulate a small delay to prevent rapid loading
  setTimeout(() => {
    try {
      currentPage.value++;
      const nextBatch = publicQuizzes.value.slice(
        (currentPage.value - 1) * pageSize, 
        currentPage.value * pageSize
      );
      displayedQuizzes.value = [...displayedQuizzes.value, ...nextBatch];
      updateCanLoadMore();
      
      // Re-initialize the observer after loading more content
      // This helps ensure the trigger element is properly observed
      if (canLoadMore.value) {
        setupIntersectionObserver();
      }
    } finally {
      isLoadingMore.value = false;
    }
  }, 300);
}

// View quiz details
function viewQuizDetails(quiz: any) {
  router.push(`/quiz/${quiz.quizId}/details`);
}
</script>

<style>
@import '../assets/pages/home.css';
@import '../assets/components/quiz-cards.css';

</style>

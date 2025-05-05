<template>
  <div class="public-quizzes">
    <h2 class="page-title">Explore Quizzes</h2>
    
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search for quizzes..." 
          class="search-input"
          @input="onSearchInput"
        />
        <button 
          v-if="searchQuery" 
          class="clear-search-btn" 
          @click="clearSearch"
          aria-label="Clear search"
        >×</button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading quizzes...</p>
    </div>
    
    <!-- No quizzes state -->
    <div v-else-if="publicQuizzes.length === 0" class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
        <line x1="16" y1="8" x2="2" y2="22"></line>
        <line x1="17.5" y1="15" x2="9" y2="15"></line>
      </svg>
      <p v-if="searchQuery">No quizzes found matching "{{ searchQuery }}"</p>
      <p v-else>No public quizzes available</p>
      <router-link to="/generate" class="action-btn">Create a Quiz</router-link>
    </div>
    
    <!-- Quizzes list -->
    <div v-else class="quizzes-grid">
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
          <span class="quiz-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</span>
        </div>
        <div class="quiz-card-body">
          <p class="quiz-description text-center">
            <span class="category-label">Category: </span>
            <span v-html="highlightMatch(quiz.categoryName)"></span>
          </p>
          
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
              <span class="stat-label">User </span>
              <span class="author-name">{{ quiz.authorName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Created</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import debounce from 'lodash.debounce'
import { getPublicQuizzes, toggleQuizUpvote, checkUserUpvote } from '@/api/supabase'

const router = useRouter()
const isAuthenticated = computed(() => auth.state.isAuthenticated)
const searchQuery = ref('')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const publicQuizzes = ref<any[]>([])
const displayedQuizzes = ref<any[]>([])
const pageSize = 6 // Limiting to 6 quizzes per page
const currentPage = ref(1)
const canLoadMore = ref(false)
const totalPages = computed(() => Math.ceil(publicQuizzes.value.length / pageSize))
const connectionStatus = ref('Connected to Supabase!')
const displayedPageNumbers = computed(() => {
  const maxVisiblePages = 5 // Number of page buttons to show
  const pages = []
  
  // Logic to show a reasonable number of page buttons
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

// Format date for display
function formatDate(dateString: string) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 1) {
    return 'Today'
  } else if (diffDays < 2) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}

// Smart search implementation
const onSearchInput = debounce(() => {
  filterQuizzes()
}, 300)

function filterQuizzes() {
  if (!searchQuery.value.trim()) {
    // If no search query, show all quizzes (paged)
    displayedQuizzes.value = publicQuizzes.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
  } else {
    const query = searchQuery.value.toLowerCase()
    // Implementing smart search to match partial text anywhere in title or description
    const filteredQuizzes = publicQuizzes.value.filter(quiz => 
      quiz.title.toLowerCase().includes(query) || 
      quiz.description.toLowerCase().includes(query)
    )
    displayedQuizzes.value = filteredQuizzes
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
  filterQuizzes()
}

// On component mount, fetch public quizzes
onMounted(async () => {
  try {
    const quizzes = await getPublicQuizzes()
    publicQuizzes.value = quizzes
    displayedQuizzes.value = quizzes.slice(0, pageSize)
    canLoadMore.value = quizzes.length > pageSize
  } catch (error) {
    console.error('Error loading public quizzes:', error)
  } finally {
    isLoading.value = false
  }
})

// Watch for changes in search query
watch(searchQuery, () => {
  onSearchInput()
})

// Change page for pagination
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  displayedQuizzes.value = publicQuizzes.value.slice((page - 1) * pageSize, page * pageSize)
}

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

// Navigate to take a quiz
function takeQuiz(quizId: number) {
  router.push(`/quiz/${quizId}`);
}

// Load more quizzes for pagination
function loadMoreQuizzes() {
  if (isLoadingMore.value || !canLoadMore.value) return;
  
  isLoadingMore.value = true;
  
  try {
    currentPage.value++;
    displayedQuizzes.value = publicQuizzes.value.slice(0, currentPage.value * pageSize);
    canLoadMore.value = publicQuizzes.value.length > currentPage.value * pageSize;
  } finally {
    isLoadingMore.value = false;
  }
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

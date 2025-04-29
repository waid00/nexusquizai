<template>
  <div class="public-quizzes">
    <h2 class="page-title">Explore Quizzes</h2>
    
    <!-- Supabase Connection Status -->
    <p class="connection-status">{{ connectionStatus }}</p>
    
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
      >
        <div class="quiz-card-header">
          <h3 class="quiz-title">
            <span v-html="highlightMatch(quiz.title)"></span>
          </h3>
          <span class="quiz-badge" :class="quiz.difficulty">{{ quiz.difficulty }}</span>
        </div>
        <div class="quiz-card-body">
          <p class="quiz-description">
            <span v-html="highlightMatch(quiz.description)"></span>
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
              <span class="stat-label">Upvotes</span>
              <span class="stat-value">{{ quiz.upvoteCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Created</span>
              <span class="stat-value">{{ formatDate(quiz.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div class="quiz-card-footer">
          <div class="quiz-author">
            <span class="by-text">By: </span>
            <span class="author-name">{{ quiz.authorName }}</span>
          </div>
          <div class="quiz-actions">
            <button class="upvote-btn" 
              :class="{ active: quiz.hasUserUpvoted }"
              @click="toggleUpvote(quiz)"
              title="Upvote this quiz"
              :disabled="!isAuthenticated || quiz.isUserOwner"
            >
              <span class="upvote-icon">⬆</span>
              <span class="upvote-count">{{ quiz.upvoteCount }}</span>
            </button>
            <button class="take-quiz-btn" @click="takeQuiz(quiz.quizId)">
              Take Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination controls -->
    <div v-if="publicQuizzes.length > pageSize" class="pagination-container">
      <div class="pagination">
        <button 
          class="page-btn prev" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          &laquo; Prev
        </button>
        
        <button 
          v-for="page in displayedPageNumbers" 
          :key="page"
          :class="['page-btn', { active: currentPage === page }]"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="page-btn next" 
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >
          Next &raquo;
        </button>
      </div>
    </div>
    
    <!-- Load more (alternative for mobile) -->
    <div v-if="false && canLoadMore" class="load-more-container">
      <button class="load-more-btn" @click="loadMoreQuizzes" :disabled="isLoadingMore">
        {{ isLoadingMore ? 'Loading...' : 'Load More' }}
      </button>
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
</script>

<style scoped>
.public-quizzes {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-title {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: 2.2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-main);
}

/* Supabase connection status */
.connection-status {
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-size: 1rem;
  color: var(--text-alt);
}

/* Search styles */
.search-container {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  font-size: 1rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-main);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2);
}

.clear-search-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-alt);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.clear-search-btn:hover {
  color: var(--text-main);
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(46, 204, 113, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
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
  text-align: center;
}

.empty-icon {
  color: var(--text-alt);
  margin-bottom: var(--spacing-md);
  opacity: 0.7;
}

.empty-state p {
  color: var(--text-alt);
  margin-bottom: var(--spacing-md);
  font-size: 1.1rem;
}

.action-btn {
  display: inline-block;
  padding: 0.8rem 1.8rem;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.25);
}

/* Quiz cards grid */
.quizzes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

@media (min-width: 992px) {
  .quizzes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .public-quizzes {
    padding: var(--spacing-md);
  }
  
  .quizzes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .page-title {
    font-size: 1.8rem;
  }
}

@media (max-width: 576px) {
  .quizzes-grid {
    grid-template-columns: 1fr;
  }
}

.quiz-card {
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: var(--shadow-sm);
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

.quiz-card-header {
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--input-border);
}

.quiz-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
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
  margin-left: var(--spacing-sm);
  flex-shrink: 0;
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

.quiz-card-body {
  padding: var(--spacing-md);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.quiz-description {
  color: var(--text-alt);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
}

.quiz-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
  margin-top: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: var(--radius-sm);
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

.quiz-card-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--input-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-author {
  font-size: 0.9rem;
  color: var(--text-alt);
}

.by-text {
  color: var(--text-alt);
}

.author-name {
  color: var(--text-main);
  font-weight: 500;
}

.quiz-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.upvote-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-alt);
  cursor: pointer;
  transition: all 0.3s ease;
}

.upvote-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.upvote-btn.active {
  background: rgba(46, 213, 115, 0.1);
  color: var(--accent);
  border-color: var(--accent);
}

.upvote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upvote-icon {
  font-size: 1rem;
}

.take-quiz-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.take-quiz-btn:hover {
  background: color-mix(in srgb, var(--accent) 85%, white);
  transform: translateY(-2px);
}

/* Pagination */
.pagination-container {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: center;
}

.pagination {
  display: flex;
  gap: var(--spacing-sm);
}

.page-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--input-border);
  background: var(--panel-bg);
  color: var(--text-main);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Load more */
.load-more-container {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: center;
}

.load-more-btn {
  padding: 0.8rem 2rem;
  border: 1px solid var(--input-border);
  background: var(--panel-bg);
  color: var(--text-main);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Search highlighting */
.highlight {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  padding: 0 2px;
  border-radius: 2px;
}
</style>

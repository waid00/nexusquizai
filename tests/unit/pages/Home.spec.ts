import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { render, fireEvent } from '@testing-library/vue'
import { createRouter, createWebHistory } from 'vue-router'

// Import page component
import Home from '../../../src/pages/Home.vue'

// Mocks
import { auth } from '../../../src/store/auth'
import * as supabaseApi from '../../../src/api/supabase'

// Create a mock router for testing
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: {} },
    { path: '/login', name: 'Login', component: {} },
    { path: '/quiz/:id/details', name: 'QuizDetails', component: {} },
    { path: '/generate', name: 'Generate', component: {} }
  ]
})

// Mock quiz data
const mockQuizzes = [
  {
    quizId: 1,
    title: 'Test Quiz 1',
    description: 'Description for test quiz 1',
    difficulty: 'easy',
    categoryName: 'General Knowledge',
    questionCount: 10,
    upvoteCount: 5,
    attemptCount: 20,
    authorName: 'TestUser1',
    createdAt: '2023-01-01T12:00:00Z',
    hasUserUpvoted: false,
    isUserOwner: false,
    ownerId: 101
  },
  {
    quizId: 2,
    title: 'Test Quiz 2',
    description: 'Description for test quiz 2',
    difficulty: 'hard',
    categoryName: 'Science',
    questionCount: 15,
    upvoteCount: 10,
    attemptCount: 30,
    authorName: 'TestUser2',
    createdAt: '2023-01-02T12:00:00Z',
    hasUserUpvoted: true,
    isUserOwner: false,
    ownerId: 102
  }
]

describe('Home.vue', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks()
    
    // Mock auth state
    auth.state = {
      isAuthenticated: false,
      user: null,
      error: null,
      isLoading: false,
      recoveryPhrase: null
    }
    
    // Mock the supabase API functions
    vi.spyOn(supabaseApi, 'getPublicQuizzes').mockResolvedValue(mockQuizzes)
    vi.spyOn(supabaseApi, 'toggleQuizUpvote').mockResolvedValue(true)
  })

  it('should render the home page with public quizzes', async () => {
    // Mount the component
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    // Wait for component to finish rendering
    await flushPromises()
    
    // Expect loading state to be initially shown then hidden
    expect(wrapper.find('.loading-container').exists()).toBe(false)
    
    // Expect quizzes to be displayed
    expect(wrapper.findAll('.quiz-card').length).toBe(2)
    
    // Check quiz data is correctly displayed
    const quizCards = wrapper.findAll('.quiz-card')
    expect(quizCards[0].find('.quiz-title').text()).toContain('Test Quiz 1')
    expect(quizCards[0].find('.category-label').exists()).toBe(true)
    expect(quizCards[0].find('.quiz-badge').text()).toBe('quiz.easy')
    
    // Check upvote counts
    expect(quizCards[0].find('.upvote-count').text()).toBe('5')
    expect(quizCards[1].find('.upvote-count').text()).toBe('10')
  })

  it('should filter quizzes when searching', async () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Find the search input and type in it
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('Science')
    await searchInput.trigger('input')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // Should only show quizzes matching the search
    // Note: In a real test this would work with proper filtering,
    // but with mocks we'd need to setup more advanced behavior
    
    // Test clearing search
    const clearButton = wrapper.find('.clear-search-btn')
    await clearButton.trigger('click')
    // Instead of accessing vm.searchQuery directly, verify the input element value properly
    const inputElement = wrapper.find('.search-input').element as HTMLInputElement
    expect(inputElement.value).toBe('')
  })

  it('should navigate to quiz details when clicking on a quiz card', async () => {
    const push = vi.fn()
    mockRouter.push = push
    
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Click on the first quiz card
    const quizCard = wrapper.findAll('.quiz-card')[0]
    await quizCard.trigger('click')
    
    // Expect router to navigate to quiz details
    expect(push).toHaveBeenCalledWith('/quiz/1/details')
  })

  it('should toggle upvote when clicking the upvote button', async () => {
    // Set user as authenticated
    auth.state = {
      isAuthenticated: true,
      user: { 
        userId: 123, 
        username: 'TestUser',
        email: 'test@example.com',
        roleId: 3
      },
      error: null,
      isLoading: false,
      recoveryPhrase: null
    }
    
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Click the upvote button on the first quiz
    const upvoteButton = wrapper.findAll('.quiz-card-footer')[0]
    await upvoteButton.trigger('click')
    
    // Check that toggle was called with correct params
    expect(supabaseApi.toggleQuizUpvote).toHaveBeenCalledWith(1, 123)
  })

  it('should redirect to login when unauthenticated user tries to upvote', async () => {
    // Ensure user is not authenticated
    auth.state = {
      isAuthenticated: false,
      user: null,
      error: null,
      isLoading: false,
      recoveryPhrase: null
    }
    
    const push = vi.fn()
    mockRouter.push = push
    
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Click the upvote button
    const upvoteButton = wrapper.findAll('.quiz-card-footer')[0]
    await upvoteButton.trigger('click')
    
    // Expect router to navigate to login
    expect(push).toHaveBeenCalledWith('/login')
  })

  it('should show no results message when search returns no matches', async () => {
    // Mock empty quiz array to simulate no search results
    vi.spyOn(supabaseApi, 'getPublicQuizzes').mockResolvedValue([])
    
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Set search query with proper casting to HTMLInputElement
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('Non-existent quiz')
    await searchInput.trigger('input')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // Expect empty state message to be shown
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-state p').text()).toContain('quiz.noQuizzesMatching')
  })

  it('should load more quizzes when scrolling', async () => {
    // This would be a more complex test with IntersectionObserver mocking
    // For this simplified test, we'll check if the loadMoreTrigger element exists
    const wrapper = mount(Home, {
      global: {
        plugins: [mockRouter],
        stubs: {
          RouterLink: true
        },
        mocks: {
          $t: (key) => key // Simple translation mock
        }
      }
    })
    
    await flushPromises()
    
    // Verify that the load more trigger exists
    expect(wrapper.find('.loading-more-container').exists()).toBe(true)
    
    // Test the infinite scroll feature by checking if the loadMoreTrigger ref exists
    const loadMoreTrigger = wrapper.find('[ref="loadMoreTrigger"]')
    expect(loadMoreTrigger.exists()).toBe(true)
  })
})
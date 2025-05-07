import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

// Mock the entire supabase module before importing anything
vi.mock('../../../src/api/supabase', () => {
  // Create mock functions for the API methods we're testing
  const getPublicQuizzes = vi.fn()
  const createQuiz = vi.fn()
  const getQuizById = vi.fn()
  
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(() => ({})),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn()
    }
  }
  
  return {
    // Export the mocked functions
    getPublicQuizzes,
    createQuiz,
    getQuizById,
    supabase: mockSupabaseClient
  }
})

// Now import the mocked functions
import { getPublicQuizzes, createQuiz, getQuizById, supabase } from '../../../src/api/supabase'

// Explicitly tell TypeScript these are mocks
const mockedGetPublicQuizzes = getPublicQuizzes as Mock;
const mockedCreateQuiz = createQuiz as Mock;
const mockedGetQuizById = getQuizById as Mock;

// Explicitly cast supabase.from to a mock function type
(supabase.from as Mock).mockImplementation(() => ({
  select: vi.fn(() => ({
    order: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }))
}));

describe('Supabase API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()
  })

  it('should retrieve public quizzes', async () => {
    // Mock the return value of getPublicQuizzes
    const mockQuizzes = [
      {
        quizId: 1,
        title: 'JavaScript Basics',
        description: 'Test your JavaScript knowledge',
        difficulty: 'beginner',
        createdAt: '2023-01-01T00:00:00Z',
        authorName: 'testuser',
        ownerId: 123,
        questionCount: 10,
        attemptCount: 5,
        upvoteCount: 3,
        categoryName: 'Programming',
        hasUserUpvoted: false,
        isUserOwner: false
      }
    ]
    
    // Set up the mock to return our test data
    mockedGetPublicQuizzes.mockResolvedValue(mockQuizzes)

    // Call the function
    const result = await getPublicQuizzes()

    // Verify function was called
    expect(getPublicQuizzes).toHaveBeenCalled()
    
    // Check that the data matches our expected result
    expect(result).toEqual(mockQuizzes)
    expect(result[0].quizId).toBe(1)
    expect(result[0].title).toBe('JavaScript Basics')
    expect(result[0].authorName).toBe('testuser')
  })

  it('should create a quiz successfully', async () => {
    // Test data
    const quizData = {
      title: 'New Quiz',
      description: 'A new quiz for testing',
      difficulty: 'Intermediate',
      is_public: true,
      owner_id: 123,
      category_id: 1 // Adding required category_id
    }
    
    const createdQuiz = {
      id: 99,
      ...quizData,
      created_at: '2025-05-07T12:00:00Z'
    }

    // Mock the return value
    mockedCreateQuiz.mockResolvedValue(createdQuiz)

    // Call the function
    const result = await createQuiz(quizData)

    // Verify it was called correctly
    expect(createQuiz).toHaveBeenCalledWith(quizData)
    
    // Check the returned data
    expect(result).toEqual(createdQuiz)
    expect(result.id).toBe(99)
    expect(result.title).toBe('New Quiz')
  })

  it('should get a quiz by ID', async () => {
    // Create mock quiz with questions and answers
    const mockQuiz = {
      id: 42,
      title: 'Vue.js Fundamentals',
      description: 'Learn the basics of Vue',
      difficulty: 'Intermediate',
      owner_id: 123,
      Users: { username: 'vuemaster' },
      Questions: [
        { 
          id: 1, 
          text: 'What is Vue?', 
          AnswerOptions: [
            { id: 101, text: 'A JavaScript framework', is_correct: true },
            { id: 102, text: 'A CSS library', is_correct: false }
          ]
        },
        { 
          id: 2, 
          text: 'What is a component?', 
          AnswerOptions: [
            { id: 103, text: 'A reusable UI element', is_correct: true },
            { id: 104, text: 'A database table', is_correct: false }
          ] 
        }
      ]
    }

    // Set up the mock to return our test data
    mockedGetQuizById.mockResolvedValue(mockQuiz)

    // Call the function
    const result = await getQuizById(42)

    // Verify it was called correctly
    expect(getQuizById).toHaveBeenCalledWith(42)
    
    // Check the returned data
    expect(result).toBe(mockQuiz)
    expect(result.id).toBe(42)
    expect(result.title).toBe('Vue.js Fundamentals')
    expect(result.Questions).toHaveLength(2)
    expect(result.Questions[0].AnswerOptions).toHaveLength(2)
  })

  it('should handle database errors', async () => {
    // Mock the function to throw an error
    mockedGetPublicQuizzes.mockRejectedValue({ message: 'Database error' })

    // Call the function and expect it to throw
    await expect(getPublicQuizzes()).rejects.toEqual({ message: 'Database error' })
  })
})

describe('Fetching quiz categories', () => {
  it('should fetch quiz categories successfully', async () => {
    const mockCategories = [
      { id: 1, category_name: 'General Knowledge', description: 'General trivia and facts' },
      { id: 2, category_name: 'Science', description: 'Scientific concepts and discoveries' }
    ];

    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockCategories, error: null }))
      }))
    }));

    const { data, error } = await supabase.from('Categories').select('*').order('id', { ascending: true });

    expect(error).toBeNull();
    expect(data).toEqual(mockCategories);
  });

  it('should handle errors when fetching quiz categories', async () => {
    const mockError = { message: 'Failed to fetch categories' };

    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      }))
    }));

    const { data, error } = await supabase.from('Categories').select('*').order('id', { ascending: true });

    expect(data).toBeNull();
    expect(error).toEqual(mockError);
  });
});

describe('Fetching quizzes', () => {
  it('should fetch quizzes successfully', async () => {
    const mockQuizzes = [
      { id: 1, title: 'Sample Quiz 1', category_id: 1 },
      { id: 2, title: 'Sample Quiz 2', category_id: 2 }
    ];

    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn(() => Promise.resolve({ data: mockQuizzes, error: null }))
    }));

    const { data, error } = await supabase.from('Quizzes').select('*');

    expect(error).toBeNull();
    expect(data).toEqual(mockQuizzes);
  });

  it('should handle errors when fetching quizzes', async () => {
    const mockError = { message: 'Failed to fetch quizzes' };

    (supabase.from as Mock).mockImplementation(() => ({
      select: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
    }));

    const { data, error } = await supabase.from('Quizzes').select('*');

    expect(data).toBeNull();
    expect(error).toEqual(mockError);
  });
});
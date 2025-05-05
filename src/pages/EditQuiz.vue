<!-- src/pages/EditQuiz.vue -->
<template>
  <div class="edit-quiz">
    <h2 class="page-title">Edit Quiz</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading quiz data...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="errorMessage" class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
      </div>
      <p>{{ errorMessage }}</p>
      <router-link :to="`/quiz/${quizId}/details`" class="btn">Back to Quiz</router-link>
    </div>

    <!-- Edit Quiz Form -->
    <div v-else class="edit-form-container">
      <!-- Quiz Basic Info -->
      <div class="form-section">
        <h3>Quiz Information</h3>
        <div class="form-row">
          <label for="quiz-title">Title</label>
          <input 
            id="quiz-title" 
            v-model="quizData.title" 
            type="text" 
            placeholder="Enter quiz title"
            :class="{
              'valid': titleValid,
              'invalid': titleInvalid
            }"
            required
          >
        </div>
        
        <div class="form-row">
          <label for="quiz-description">Description</label>
          <textarea 
            id="quiz-description" 
            v-model="quizData.description" 
            placeholder="Enter quiz description"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-row">
          <label for="quiz-difficulty">Difficulty</label>
          <select id="quiz-difficulty" v-model="quizData.difficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <div class="form-row">
          <label for="quiz-public">
            <input 
              id="quiz-public" 
              v-model="quizData.isPublic" 
              type="checkbox"
            >
            <span class="checkbox-label">Public Quiz</span>
          </label>
          <div class="help-text">Public quizzes can be taken by anyone.</div>
        </div>
      </div>
      
      <!-- Questions Section -->
      <div class="form-section">
        <div class="section-header">
          <h3>Quiz Questions</h3>
          <div class="action-buttons">
            <button class="add-btn-ai" @click="addQuestionWithAI" :disabled="isGenerating">
              <span v-if="isGenerating">Generating...</span>
              <span v-else><i class="ai-icon">✨</i> Add Question with AI</span>
            </button>
            <button class="add-btn" @click="addQuestion">Add Question</button>
          </div>
        </div>
        
        <div v-if="quizData.questions.length === 0" class="empty-questions">
          <p>No questions yet. Click "Add Question" to start building your quiz.</p>
        </div>
        
        <div v-else class="questions-list">
          <div 
            v-for="(question, index) in quizData.questions" 
            :key="question.id" 
            class="question-card"
            :class="{ 'expanded': expandedQuestions[question.id] }"
          >
            <div class="question-header">
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-type-badge" :class="question.questionType">
                {{ formatQuestionType(question.questionType) }}
              </div>
              <div class="question-controls">
                <button class="btn-icon" @click="moveQuestion(index, -1)" :disabled="index === 0">
                  <span>↑</span>
                </button>
                <button class="btn-icon" @click="moveQuestion(index, 1)" :disabled="index === quizData.questions.length - 1">
                  <span>↓</span>
                </button>
                <button class="btn-icon delete" @click="removeQuestion(index)">
                  <span>×</span>
                </button>
                <button class="btn-icon expand" @click="toggleQuestionExpand(question.id)">
                  <span>{{ expandedQuestions[question.id] ? '▼' : '▶' }}</span>
                </button>
              </div>
            </div>
            
            <div class="question-preview" @click="toggleQuestionExpand(question.id)">
              <div class="preview-text">{{ question.questionText || 'New question' }}</div>
            </div>
            
            <div v-if="expandedQuestions[question.id]" class="question-edit-panel">
              <div class="form-row">
                <label :for="`question-text-${question.id}`">Question Text</label>
                <textarea 
                  :id="`question-text-${question.id}`" 
                  v-model="question.questionText" 
                  placeholder="Enter your question"
                  rows="2"
                  :class="{
                    'valid': questionValidation[question.id]?.textValid,
                    'invalid': questionValidation[question.id]?.textInvalid
                  }"
                  required
                ></textarea>
              </div>
              
              <div class="form-row">
                <label :for="`question-type-${question.id}`">Question Type</label>
                <select 
                  :id="`question-type-${question.id}`" 
                  v-model="question.questionType"
                  @change="questionTypeChanged(question)"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="fill_blank">Fill in the Blank</option>
                </select>
              </div>
              
              <!-- Multiple Choice Options -->
              <div v-if="question.questionType === 'multiple_choice'" class="options-container">
                <div class="options-header">
                  <h4>Answer Options</h4>
                  <button 
                    v-if="question.options.length < 6" 
                    class="add-option-btn" 
                    @click="addOption(question)"
                  >
                    Add Option
                  </button>
                </div>
                
                <div 
                  v-for="(option, optIndex) in question.options" 
                  :key="option.id" 
                  class="option-row"
                >
                  <div class="option-input">
                    <input 
                      type="radio" 
                      :id="`option-${question.id}-${option.id}`" 
                      :name="`question-${question.id}-correct`" 
                      :checked="option.isCorrect" 
                      @change="setCorrectOption(question, optIndex)"
                    >
                    <input 
                      type="text" 
                      v-model="option.text" 
                      placeholder="Enter option text"
                      class="option-text-input"
                      :class="{
                        'valid': questionValidation[question.id]?.optionsValid?.[option.id],
                        'invalid': questionValidation[question.id]?.optionsInvalid?.[option.id]
                      }"
                      required
                    >
                  </div>
                  <button 
                    v-if="question.options.length > 2" 
                    class="remove-option-btn" 
                    @click="removeOption(question, optIndex)"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <!-- True/False Options -->
              <div v-else-if="question.questionType === 'true_false'" class="options-container">
                <h4>Answer</h4>
                <div class="true-false-options">
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      :name="`question-${question.id}-tf`" 
                      :checked="question.correctAnswer === 'true'" 
                      @change="question.correctAnswer = 'true'"
                    >
                    <span>True</span>
                  </label>
                  <label class="radio-label">
                    <input 
                      type="radio" 
                      :name="`question-${question.id}-tf`" 
                      :checked="question.correctAnswer === 'false'" 
                      @change="question.correctAnswer = 'false'"
                    >
                    <span>False</span>
                  </label>
                </div>
              </div>
              
              <!-- Fill in the Blank Answer -->
              <div v-else-if="question.questionType === 'fill_blank'" class="options-container">
                <div class="form-row">
                  <label :for="`fill-blank-answer-${question.id}`">Correct Answer</label>
                  <input 
                    :id="`fill-blank-answer-${question.id}`" 
                    v-model="question.correctAnswer" 
                    type="text" 
                    placeholder="Enter correct answer"
                    :class="{
                      'valid': questionValidation[question.id]?.blankAnswerValid,
                      'invalid': questionValidation[question.id]?.blankAnswerInvalid
                    }"
                    required
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="save-btn" @click="saveQuiz" :disabled="isSaving">
          <span v-if="isSaving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
        <router-link :to="`/quiz/${quizId}/details`" class="cancel-btn">Cancel</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { chat, type ChatCompletionRequestMessage } from '@/api/openai'
import '@/assets/pages/edit-quiz.css';

// Route and navigation
const route = useRoute()
const router = useRouter()
const quizId = parseInt(route.params.id as string)

// State
const isLoading = ref(true)
const isSaving = ref(false)
const isGenerating = ref(false)
const errorMessage = ref('')
const expandedQuestions = reactive<{[key: string]: boolean}>({})

// Validation states
const titleValid = ref(false)
const titleInvalid = ref(false)

// Question validation state tracking
const questionValidation = reactive<{[key: string]: {
  textValid: boolean;
  textInvalid: boolean;
  optionsValid: {[key: string]: boolean};
  optionsInvalid: {[key: string]: boolean};
  blankAnswerValid?: boolean;
  blankAnswerInvalid?: boolean;
}}>({}) // Will hold validation state for each question

// Quiz data with default empty structure
const quizData = reactive({
  title: '',
  description: '',
  difficulty: 'medium',
  isPublic: true,
  questions: [] as any[]
})

// Generate a unique string ID for new items
const generateId = () => `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`

// Load quiz data
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  if (isNaN(quizId)) {
    errorMessage.value = 'Invalid quiz ID'
    isLoading.value = false
    return
  }
  
  try {
    // Check if quiz exists and user is owner
    const { data: quizAccessData, error: accessError } = await supabase
      .from('Quizzes')
      .select('id, owner_id, is_deleted')
      .eq('id', quizId)
      .single()
    
    if (accessError || !quizAccessData) {
      throw new Error('Quiz not found')
    }
    
    // Check if quiz is deleted
    if (quizAccessData.is_deleted) {
      throw new Error('This quiz has been deleted')
    }
    
    // Check ownership
    if (quizAccessData.owner_id !== auth.state.user.userId) {
      throw new Error('You do not have permission to edit this quiz')
    }
    
    // Load quiz details
    await loadQuizDetails()
    
    // Load questions
    await loadQuestions()
    
  } catch (error: any) {
    console.error('Error loading quiz data:', error)
    errorMessage.value = error.message || 'Failed to load quiz data'
  } finally {
    isLoading.value = false
  }
})

// Load basic quiz information
async function loadQuizDetails() {
  const { data, error } = await supabase
    .from('Quizzes')
    .select('title, description, difficulty, is_public')
    .eq('id', quizId)
    .single()
  
  if (error || !data) {
    throw new Error('Quiz not found')
  }
  
  quizData.title = data.title || ''
  quizData.description = data.description || ''
  quizData.difficulty = data.difficulty || 'medium'
  quizData.isPublic = data.is_public || false
}

// Load questions and answer options
async function loadQuestions() {
  // Get all questions for this quiz
  const { data: questionData, error: questionsError } = await supabase
    .from('Questions')
    .select('id, question_text, question_type')
    .eq('quiz_id', quizId)
    .order('id', { ascending: true })
  
  if (questionsError) throw questionsError
  
  if (!questionData || questionData.length === 0) {
    quizData.questions = []
    return
  }
  
  const loadedQuestions = []
  
  // For each question, get its answer options
  for (const q of questionData) {
    const questionObj: any = {
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      options: [],
      correctAnswer: ''
    }
    
    // Always expand the first question by default
    if (loadedQuestions.length === 0) {
      expandedQuestions[q.id] = true
    }
    
    const { data: optionsData, error: optionsError } = await supabase
      .from('AnswerOptions')
      .select('id, answer_text, is_correct')
      .eq('question_id', q.id)
      .order('id', { ascending: true })
    
    if (optionsError) {
      console.error(`Error loading options for question ${q.id}:`, optionsError)
      continue
    }
    
    // Process different question types
    if (q.question_type === 'multiple_choice' && optionsData) {
      questionObj.options = optionsData.map(opt => ({
        id: opt.id,
        text: opt.answer_text,
        isCorrect: opt.is_correct
      }))
    } else if (q.question_type === 'true_false' && optionsData) {
      // For T/F, find the correct answer
      const trueOption = optionsData.find(opt => opt.is_correct)
      questionObj.correctAnswer = trueOption ? 
        (trueOption.answer_text.toLowerCase() === 'true' ? 'true' : 'false') : 
        'true'
    } else if (q.question_type === 'fill_blank' && optionsData && optionsData.length > 0) {
      // For fill in the blank, the first option is the correct answer
      questionObj.correctAnswer = optionsData[0].answer_text
    }
    
    loadedQuestions.push(questionObj)
  }
  
  quizData.questions = loadedQuestions
}

// Format question type for display
function formatQuestionType(type: string) {
  if (type === 'multiple_choice') return 'Multiple Choice'
  if (type === 'true_false') return 'True/False'
  if (type === 'fill_blank') return 'Fill in the Blank'
  return type
}

// Toggle question expansion
function toggleQuestionExpand(questionId: string | number) {
  expandedQuestions[questionId] = !expandedQuestions[questionId]
}

// Add a new question
function addQuestion() {
  const newQuestion = {
    id: generateId(),
    questionText: '',
    questionType: 'multiple_choice',
    options: [
      { id: generateId(), text: '', isCorrect: true },
      { id: generateId(), text: '', isCorrect: false }
    ],
    correctAnswer: ''
  }
  
  quizData.questions.push(newQuestion)
  
  // Automatically expand the new question
  expandedQuestions[newQuestion.id] = true
  
  // Scroll to the bottom to show the new question
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    })
  }, 100)
}

// Add a new question with AI
async function addQuestionWithAI() {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    alert('You must be logged in to use AI generation')
    return
  }
  
  isGenerating.value = true
  
  try {
    // Get content from current quiz to use as context
    const quizContext = `
    Quiz Title: ${quizData.title}
    Quiz Description: ${quizData.description}
    Quiz Difficulty: ${quizData.difficulty}
    Number of Existing Questions: ${quizData.questions.length}
    
    ${quizData.questions.map((q, i) => `
    Question ${i+1}: ${q.questionText}
    `).join('\n')}
    `
    
    // Enhanced system prompt for generating a single question
    const systemPrompt = 'You generate a single quiz question in JSON format based on the context provided. ' +
      'Make sure the question is related to the existing quiz content and matches the quiz theme and difficulty level. ' +
      'Your response should be ONLY valid JSON with no additional text.'
    
    // User prompt requesting a single question based on the quiz context
    const userPrompt = `Generate a single ${quizData.difficulty} level multiple-choice question related to this quiz: 
    
    ${quizContext}
    
    Return only a single JSON object with the following structure:
    {
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answerIndex": 0, // Index of the correct answer (0-based)
      "explanation": "Explanation of why this answer is correct"
    }`
    
    // Make the API call
    const messages: ChatCompletionRequestMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
    
    // Send the request to the OpenAI API
    const response = await chat(messages)
    console.log('AI Response:', response)
    
    // Extract and parse JSON from the response
    let jsonText = response.trim()
    
    // Remove any code fence markers (```json or ```)
    jsonText = jsonText.replace(/^```(?:json)?\s*/g, '')
    jsonText = jsonText.replace(/\s*```$/g, '')
    jsonText = jsonText.trim()
    
    // Parse the JSON
    const generatedQuestion = JSON.parse(jsonText)
    
    // Create a new question object
    const newQuestion = {
      id: generateId(),
      questionText: generatedQuestion.question || 'Generated question',
      questionType: 'multiple_choice',
      options: generatedQuestion.options ? 
        generatedQuestion.options.map((text: string) => ({
          id: generateId(),
          text,
          isCorrect: false
        })) : 
        [
          { id: generateId(), text: 'Option 1', isCorrect: true },
          { id: generateId(), text: 'Option 2', isCorrect: false }
        ],
      correctAnswer: ''
    }
    
    // Set the correct answer
    if (generatedQuestion.answerIndex !== undefined && 
        generatedQuestion.answerIndex >= 0 && 
        generatedQuestion.answerIndex < newQuestion.options.length) {
      newQuestion.options.forEach((opt: any, idx: number) => {
        opt.isCorrect = idx === generatedQuestion.answerIndex
      })
    } else {
      // Default to first option if answerIndex is invalid
      newQuestion.options[0].isCorrect = true
    }
    
    // Add the question to the quiz
    quizData.questions.push(newQuestion)
    
    // Expand the new question
    expandedQuestions[newQuestion.id] = true
    
    // Scroll to show the new question
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
    
  } catch (error) {
    console.error('Error generating question with AI:', error)
    alert('Failed to generate question with AI. Please try again.')
  } finally {
    isGenerating.value = false
  }
}

// Remove a question
function removeQuestion(index: number) {
  if (confirm('Are you sure you want to remove this question?')) {
    quizData.questions.splice(index, 1)
  }
}

// Move a question up or down
function moveQuestion(index: number, direction: number) {
  const newIndex = index + direction
  
  // Check if the new index is valid
  if (newIndex < 0 || newIndex >= quizData.questions.length) {
    return
  }
  
  // Swap the questions
  const temp = quizData.questions[index]
  quizData.questions[index] = quizData.questions[newIndex]
  quizData.questions[newIndex] = temp
}

// Handle question type change
function questionTypeChanged(question: any) {
  if (question.questionType === 'multiple_choice') {
    // Ensure there are at least 2 options for multiple choice
    if (!question.options || question.options.length < 2) {
      question.options = [
        { id: generateId(), text: '', isCorrect: true },
        { id: generateId(), text: '', isCorrect: false }
      ]
    }
  } else if (question.questionType === 'true_false') {
    // Set default to 'true' for true/false
    question.correctAnswer = 'true'
  } else if (question.questionType === 'fill_blank') {
    // Clear the correct answer for fill in the blank
    question.correctAnswer = ''
  }
}

// Add a new option to multiple choice question
function addOption(question: any) {
  if (question.options.length >= 6) return // Maximum 6 options
  
  question.options.push({
    id: generateId(),
    text: '',
    isCorrect: false
  })
}

// Remove an option from multiple choice question
function removeOption(question: any, index: number) {
  if (question.options.length <= 2) return // Minimum 2 options
  
  // If removing the correct option, make the first option correct
  if (question.options[index].isCorrect) {
    question.options[0].isCorrect = true
  }
  
  question.options.splice(index, 1)
}

// Set the correct option for multiple choice
function setCorrectOption(question: any, correctIndex: number) {
  question.options.forEach((opt: any, idx: number) => {
    opt.isCorrect = idx === correctIndex
  })
}

// Validate title
function validateTitle() {
  const title = quizData.title.trim()
  if (title.length === 0) {
    titleValid.value = false
    titleInvalid.value = false
    return false
  } else if (title.length < 3) {
    titleValid.value = false
    titleInvalid.value = true
    return false
  } else if (title.length > 100) {
    titleValid.value = false
    titleInvalid.value = true
    return false
  } else {
    titleValid.value = true
    titleInvalid.value = false
    return true
  }
}

// Validate question text
function validateQuestionText(question: { id: string | number, questionText: string }) {
  const questionId = question.id
  const text = question.questionText.trim()
  
  if (!questionValidation[questionId]) {
    questionValidation[questionId] = reactive({
      textValid: false,
      textInvalid: false,
      optionsValid: {},
      optionsInvalid: {}
    })
  }
  
  if (text.length === 0) {
    questionValidation[questionId].textValid = false
    questionValidation[questionId].textInvalid = false
    return false
  } else if (text.length < 5) {
    questionValidation[questionId].textValid = false
    questionValidation[questionId].textInvalid = true
    return false
  } else if (text.length > 500) {
    questionValidation[questionId].textValid = false
    questionValidation[questionId].textInvalid = true
    return false
  } else {
    questionValidation[questionId].textValid = true
    questionValidation[questionId].textInvalid = false
    return true
  }
}

// Validate option text
function validateOptionText(question: { id: string | number }, option: { id: string | number, text: string }) {
  const questionId = question.id
  const optionId = option.id
  const text = option.text.trim()
  
  if (!questionValidation[questionId]) {
    questionValidation[questionId] = reactive({
      textValid: false,
      textInvalid: false,
      optionsValid: {},
      optionsInvalid: {}
    })
  }
  
  if (text.length === 0) {
    questionValidation[questionId].optionsValid[optionId] = false
    questionValidation[questionId].optionsInvalid[optionId] = false
    return false
  } else if (text.length > 200) {
    questionValidation[questionId].optionsValid[optionId] = false
    questionValidation[questionId].optionsInvalid[optionId] = true
    return false
  } else {
    questionValidation[questionId].optionsValid[optionId] = true
    questionValidation[questionId].optionsInvalid[optionId] = false
    return true
  }
}

// Validate fill in blank answer
function validateBlankAnswer(question: { id: string | number, correctAnswer: string }) {
  const questionId = question.id
  const text = question.correctAnswer.trim()
  
  if (!questionValidation[questionId]) {
    questionValidation[questionId] = reactive({
      textValid: false,
      textInvalid: false,
      blankAnswerValid: false,
      blankAnswerInvalid: false,
      optionsValid: {},  // Add missing property
      optionsInvalid: {} // Add missing property
    })
  }
  
  if (text.length === 0) {
    questionValidation[questionId].blankAnswerValid = false
    questionValidation[questionId].blankAnswerInvalid = false
    return false
  } else if (text.length > 100) {
    questionValidation[questionId].blankAnswerValid = false
    questionValidation[questionId].blankAnswerInvalid = true
    return false
  } else {
    questionValidation[questionId].blankAnswerValid = true
    questionValidation[questionId].blankAnswerInvalid = false
    return true
  }
}

// Set up watchers for real-time validation
watch(() => quizData.title, (newValue) => {
  validateTitle()
})

// Set up validation for questions and options when questions change
watch(() => quizData.questions, (newQuestions) => {
  // Validate each question
  newQuestions.forEach(question => {
    validateQuestionText(question)
    
    if (question.questionType === 'multiple_choice') {
      question.options.forEach((option: { id: string | number, text: string, isCorrect: boolean }) => {
        validateOptionText(question, option)
      })
    } else if (question.questionType === 'fill_blank') {
      validateBlankAnswer(question)
    }
  })
}, { deep: true })

// Save quiz changes
async function saveQuiz() {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  // Validate quiz data
  if (!quizData.title.trim()) {
    alert('Please enter a quiz title')
    return
  }
  
  if (quizData.title.trim().length < 3) {
    alert('Quiz title must be at least 3 characters long')
    return
  }
  
  if (quizData.title.trim().length > 100) {
    alert('Quiz title must be less than 100 characters long')
    return
  }
  
  if (quizData.questions.length === 0) {
    alert('Please add at least one question')
    return
  }
  
  if (quizData.questions.length > 50) {
    alert('A quiz cannot have more than 50 questions')
    return
  }
  
  // Validate all questions and options
  let isValid = true
  
  for (const question of quizData.questions) {
    if (!question.questionText.trim()) {
      alert('All questions must have text')
      isValid = false
      break
    }
    
    if (question.questionText.trim().length < 5) {
      alert('Question text must be at least 5 characters long')
      isValid = false
      break
    }
    
    if (question.questionText.trim().length > 500) {
      alert('Question text must be less than 500 characters long')
      isValid = false
      break
    }
    
    if (question.questionType === 'multiple_choice') {
      // Validate multiple choice options
      const optionTexts = new Set()
      
      for (const option of question.options) {
        if (!option.text.trim()) {
          alert('All options must have text')
          isValid = false
          break
        }
        
        if (option.text.trim().length < 1) {
          alert('Option text must not be empty')
          isValid = false
          break
        }
        
        if (option.text.trim().length > 200) {
          alert('Option text must be less than 200 characters long')
          isValid = false
          break
        }
        
        // Check for duplicate options
        if (optionTexts.has(option.text.trim().toLowerCase())) {
          alert('Multiple choice questions cannot have duplicate options')
          isValid = false
          break
        }
        
        optionTexts.add(option.text.trim().toLowerCase())
      }
      
      // Ensure there's a correct option selected
      if (!question.options.some((opt: any) => opt.isCorrect)) {
        alert('Each multiple choice question must have a correct answer selected')
        isValid = false
        break
      }
    } else if (question.questionType === 'fill_blank') {
      // Validate fill in the blank answer
      if (!question.correctAnswer.trim()) {
        alert('Fill in the blank questions must have a correct answer')
        isValid = false
        break
      }
      
      if (question.correctAnswer.trim().length > 100) {
        alert('Fill in the blank answers must be less than 100 characters long')
        isValid = false
        break
      }
    }
  }
  
  if (!isValid) return
  
  isSaving.value = true
  
  try {
    // 1. Update quiz basic info
    const { error: quizUpdateError } = await supabase
      .from('Quizzes')
      .update({
        title: quizData.title,
        description: quizData.description,
        difficulty: quizData.difficulty,
        is_public: quizData.isPublic
      })
      .eq('id', quizId)
      .eq('owner_id', auth.state.user.userId)
    
    if (quizUpdateError) throw quizUpdateError
    
    // 2. Process questions
    for (const question of quizData.questions) {
      let questionId = question.id
      
      // Check if this is a new question (has a temporary ID)
      const isNewQuestion = typeof questionId === 'string' && questionId.startsWith('temp_')
      
      if (isNewQuestion) {
        // 2a. Insert new question
        const { data: newQuestion, error: newQuestionError } = await supabase
          .from('Questions')
          .insert({
            quiz_id: quizId,
            question_text: question.questionText,
            question_type: question.questionType,
            difficulty: quizData.difficulty // Use the quiz difficulty as default
          })
          .select('id')
          .single()
        
        if (newQuestionError) throw newQuestionError
        
        questionId = newQuestion.id
      } else {
        // 2b. Update existing question
        const { error: updateQuestionError } = await supabase
          .from('Questions')
          .update({
            question_text: question.questionText,
            question_type: question.questionType
          })
          .eq('id', questionId)
          .eq('quiz_id', quizId)
        
        if (updateQuestionError) throw updateQuestionError
        
        // Remove old options if they exist
        const { error: deleteOptionsError } = await supabase
          .from('AnswerOptions')
          .delete()
          .eq('question_id', questionId)
        
        if (deleteOptionsError) throw deleteOptionsError
      }
      
      // 3. Add options based on question type
      if (question.questionType === 'multiple_choice') {
        // Multiple choice options
        for (const option of question.options) {
          const { error: optionError } = await supabase
            .from('AnswerOptions')
            .insert({
              question_id: questionId,
              answer_text: option.text,
              is_correct: option.isCorrect
            })
          
          if (optionError) throw optionError
        }
      } else if (question.questionType === 'true_false') {
        // True/False options
        await supabase
          .from('AnswerOptions')
          .insert([
            {
              question_id: questionId,
              answer_text: 'True',
              is_correct: question.correctAnswer === 'true'
            },
            {
              question_id: questionId,
              answer_text: 'False',
              is_correct: question.correctAnswer === 'false'
            }
          ])
      } else if (question.questionType === 'fill_blank') {
        // Fill in the blank (single correct answer)
        const { error: blankError } = await supabase
          .from('AnswerOptions')
          .insert({
            question_id: questionId,
            answer_text: question.correctAnswer,
            is_correct: true
          })
        
        if (blankError) throw blankError
      }
    }
    
    // 4. Remove questions that were deleted
    const existingQuestionIds = quizData.questions
      .filter(q => typeof q.id === 'number')
      .map(q => q.id)
    
    // Only run this query if there are existing questions to preserve
    if (existingQuestionIds.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from('Questions')
        .delete()
        .eq('quiz_id', quizId)
        .not('id', 'in', `(${existingQuestionIds.join(',')})`)
      
      if (deleteQuestionsError) throw deleteQuestionsError
    }
    
    // Success! Redirect back to quiz details
    router.push(`/quiz/${quizId}/details`)
    
  } catch (error: any) {
    console.error('Error saving quiz:', error)
    alert('There was an error saving your quiz. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>
<!-- src/pages/TakeQuiz.vue -->
<template>
  <div class="take-quiz">
    <h2 class="page-title">{{ quizName }}</h2>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading quiz...</p>
    </div>
    
    <!-- Quiz Taking Mode -->
    <div v-else-if="quizMode === 'take'" class="section quiz-taking-section">
      <div class="quiz-info">
        <p>Questions: {{ questions.length }} | Difficulty: {{ difficulty }}</p>
        <div class="quiz-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{width: `${(currentQuestionIndex + 1) / questions.length * 100}%`}"
            ></div>
          </div>
          <div class="progress-text">
            Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
          </div>
        </div>
      </div>

      <div v-if="currentQuestion" class="question-card">
        <div class="question-header">
          <strong class="question-number">Q{{ currentQuestionIndex + 1 }}:</strong>
          <span class="question-text">{{ currentQuestion.questionText }}</span>
        </div>
        <ul class="options-list interactive">
          <li 
            v-for="(opt, j) in answerOptions" 
            :key="j" 
            :class="['option-item', { 'selected': userAnswers[currentQuestionIndex] === opt.optionId }]"
            @click="selectAnswer(currentQuestionIndex, opt.optionId)"
          >
            <span class="option-text">{{ opt.answerText }}</span>
          </li>
        </ul>
      </div>

      <div class="quiz-navigation">
        <button 
          class="nav-btn" 
          @click="prevQuestion" 
          :disabled="currentQuestionIndex === 0"
        >
          <span class="nav-icon">←</span> Previous
        </button>
        
        <div class="question-dots">
          <span 
            v-for="(_, i) in questions" 
            :key="i" 
            :class="['question-dot', {
              'current': i === currentQuestionIndex,
              'answered': userAnswers[i] !== undefined
            }]"
            @click="currentQuestionIndex = i"
          ></span>
        </div>
        
        <button 
          v-if="currentQuestionIndex < questions.length - 1"
          class="nav-btn" 
          @click="nextQuestion" 
        >
          Next <span class="nav-icon">→</span>
        </button>
        <button 
          v-else
          class="submit-btn" 
          @click="submitQuiz"
          :disabled="!allQuestionsAnswered"
        >
          Submit Quiz
        </button>
      </div>

      <div class="quiz-actions">
        <button class="cancel-btn" @click="cancelQuiz">Cancel Quiz</button>
      </div>
    </div>

    <!-- Quiz Results Mode -->
    <div v-else-if="quizMode === 'results'" class="section quiz-results-section">
      <div class="results-summary">
        <h3>Quiz Results</h3>
        <div class="score-display">
          <div class="score-percentage">
            {{ Math.round((score / questions.length) * 100) }}%
          </div>
          <div class="score-fraction">
            {{ score }} / {{ questions.length }} correct
          </div>
          <div class="pass-fail-indicator" :class="{'pass': score / questions.length >= 0.6}">
            {{ score / questions.length >= 0.6 ? 'PASSED' : 'FAILED' }}
          </div>
        </div>
      </div>

      <ul class="question-list results">
        <li v-for="(q, i) in questions" :key="i" class="question-item">
          <div class="question-header">
            <strong class="question-number">Q{{ i + 1 }}:</strong>
            <span class="question-text">{{ q.questionText }}</span>
            <span 
              class="result-indicator" 
              :class="getAnswerCorrectness(i) ? 'correct' : 'incorrect'"
            >
              {{ getAnswerCorrectness(i) ? '✓' : '✗' }}
            </span>
          </div>
          <ul class="options-list results">
            <li 
              v-for="opt in getOptionsForQuestionSync(i)" 
              :key="opt.optionId" 
              :class="[
                'option-item', 
                {
                  'user-selected': userAnswers[i] === opt.optionId,
                  'correct-answer': opt.isCorrect
                }
              ]"
            >
              <span class="option-text">{{ opt.answerText }}</span>
            </li>
          </ul>
          <div class="answer-explanation">
            <p v-if="!getAnswerCorrectness(i)">
              Correct answer: {{ getCorrectAnswerText(i) }}
            </p>
          </div>
        </li>
      </ul>

      <div class="quiz-actions">
        <template v-if="auth.state.isAuthenticated">
          <router-link to="/my-quizzes" class="return-btn">Back to My Quizzes</router-link>
        </template>
        <template v-else>
          <router-link to="/" class="return-btn">Back to Home</router-link>
        </template>
        <button class="retake-btn" @click="retakeQuiz">Retake Quiz</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'

const route = useRoute()
const router = useRouter()
const quizId = parseInt(route.params.id as string)

// Quiz state
const quizName = ref('')
const difficulty = ref('')
const questions = ref<any[]>([])
const answerOptions = ref<any[]>([])
const isLoading = ref(true)
const quizMode = ref<'take' | 'results'>('take')

// Store question options and correct answers
const questionOptions = reactive<{[key: number]: any[]}>({})
const correctAnswers = reactive<{[key: number]: boolean}>({})

// Quiz taking states
const currentQuestionIndex = ref(0)
const userAnswers = ref<{[key: number]: number}>({})
const quizStartTime = ref<Date | null>(null)
const score = ref(0)

// Computed property to get the current question based on index
const currentQuestion = computed(() => {
  if (questions.value.length > 0 && currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value];
  }
  return null;
})

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return questions.value.length > 0 && 
    questions.value.every((_, i) => userAnswers.value[i] !== undefined);
})

// Load the quiz data when component mounts
onMounted(async () => {
  if (isNaN(quizId)) {
    router.push('/')
    return
  }
  
  try {
    // First check if the quiz exists and is public or user is the owner
    const { data: quizAccessData, error: accessError } = await supabase
      .from('Quizzes')
      .select('id, owner_id, is_public, is_deleted')
      .eq('id', quizId)
      .single()
    
    if (accessError || !quizAccessData) {
      throw new Error('Quiz not found')
    }
    
    // Check if quiz is deleted
    if (quizAccessData.is_deleted) {
      throw new Error('This quiz has been deleted')
    }
    
    // Check access permissions
    const isOwner = auth.state.isAuthenticated && 
                    auth.state.user && 
                    quizAccessData.owner_id === auth.state.user.userId
    
    const isPublic = quizAccessData.is_public
    
    // If quiz is not public and user is not the owner, redirect
    if (!isPublic && !isOwner) {
      router.push('/')
      return
    }
    
    await loadQuiz(quizId)
    quizStartTime.value = new Date()
  } catch (error) {
    console.error('Error loading quiz:', error)
    router.push('/')
  } finally {
    isLoading.value = false
  }
})

// Watch for changes in the current question index to load options
watch(currentQuestionIndex, (newIndex) => {
  if (questions.value.length > 0) {
    loadOptionsForQuestion(questions.value[newIndex].questionId)
  }
})

// Load quiz data from Supabase
async function loadQuiz(id: number) {
  try {
    // Get quiz details
    const { data: quizData, error: quizError } = await supabase
      .from('Quizzes')
      .select('title, difficulty')
      .eq('id', id)
      .single()
    
    if (quizError || !quizData) {
      throw new Error('Quiz not found')
    }
    
    quizName.value = quizData.title
    difficulty.value = quizData.difficulty
    
    // Get questions for this quiz
    const { data: questionsData, error: questionsError } = await supabase
      .from('Questions')
      .select('id, question_text, question_type')
      .eq('quiz_id', id)
      .order('id', { ascending: true })
    
    if (questionsError) {
      throw questionsError
    }
    
    if (questionsData && questionsData.length > 0) {
      questions.value = questionsData.map(row => ({
        questionId: row.id,
        questionText: row.question_text,
        questionType: row.question_type
      }))
      
      // Load options for the first question
      if (questions.value.length > 0) {
        await loadOptionsForQuestion(questions.value[0].questionId)
      }
    }
  } catch (error) {
    console.error('Error fetching quiz:', error)
    throw error
  }
}

// Load answer options for a specific question
async function loadOptionsForQuestion(questionId: number) {
  try {
    const { data: optionsData, error: optionsError } = await supabase
      .from('AnswerOptions')
      .select('id, answer_text, is_correct')
      .eq('question_id', questionId)
      .order('id', { ascending: true })
    
    if (optionsError) {
      throw optionsError
    }
    
    if (optionsData && optionsData.length > 0) {
      answerOptions.value = optionsData.map(row => ({
        optionId: row.id,
        answerText: row.answer_text,
        isCorrect: row.is_correct
      }))
      
      // Store options for result display
      const currentIndex = questions.value.findIndex(q => q.questionId === questionId);
      if (currentIndex >= 0) {
        questionOptions[currentIndex] = answerOptions.value;
      }
      
    } else {
      answerOptions.value = []
    }
  } catch (error) {
    console.error('Error fetching answer options:', error)
  }
}

// Get options for a specific question (used in results display)
async function loadOptionsForQuestionIndex(questionIndex: number) {
  // If options already loaded, return them
  if (questionOptions[questionIndex] && questionOptions[questionIndex].length > 0) {
    return questionOptions[questionIndex];
  }
  
  const questionId = questions.value[questionIndex].questionId;
  
  try {
    const { data, error } = await supabase
      .from('AnswerOptions')
      .select('id, answer_text, is_correct')
      .eq('question_id', questionId)
      .order('id', { ascending: true })
    
    if (error) {
      console.error('Error fetching options:', error)
      return []
    }
    
    const options = data.map(row => ({
      optionId: row.id,
      answerText: row.answer_text,
      isCorrect: row.is_correct
    }))
    
    // Store options for later use
    questionOptions[questionIndex] = options;
    
    // Check if answer is correct and store result
    checkAnswerCorrectness(questionIndex);
    
    return options;
  } catch (error) {
    console.error('Error in loadOptionsForQuestionIndex:', error)
    return []
  }
}

// Get options synchronously (for template use)
function getOptionsForQuestionSync(questionIndex: number) {
  return questionOptions[questionIndex] || [];
}

// Check if an answer is correct and store the result
function checkAnswerCorrectness(questionIndex: number) {
  const options = questionOptions[questionIndex] || [];
  const selectedOptionId = userAnswers.value[questionIndex];
  const selectedOption = options.find(opt => opt.optionId === selectedOptionId);
  correctAnswers[questionIndex] = selectedOption?.isCorrect || false;
  return correctAnswers[questionIndex];
}

// Get the correct answer text for a question
function getCorrectAnswerText(questionIndex: number) {
  const options = questionOptions[questionIndex] || []
  const correctOption = options.find(opt => opt.isCorrect)
  return correctOption ? correctOption.answerText : ''
}

// Get stored answer correctness (synchronous)
function getAnswerCorrectness(questionIndex: number) {
  return correctAnswers[questionIndex] || false;
}

// Navigation
function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

// Select an answer for the current question
function selectAnswer(questionIndex: number, optionId: number) {
  userAnswers.value = { ...userAnswers.value, [questionIndex]: optionId };
  // Check correctness immediately
  checkAnswerCorrectness(questionIndex);
}

// Submit the quiz
async function submitQuiz() {
  if (!allQuestionsAnswered.value) return;
  
  try {
    // Load all question options if not already loaded
    const optionPromises = [];
    for (let i = 0; i < questions.value.length; i++) {
      if (!questionOptions[i] || questionOptions[i].length === 0) {
        optionPromises.push(loadOptionsForQuestionIndex(i));
      } else {
        checkAnswerCorrectness(i);
      }
    }
    
    await Promise.all(optionPromises);
    
    // Calculate score
    let correctCount = 0;
    
    for (let i = 0; i < questions.value.length; i++) {
      if (correctAnswers[i]) {
        correctCount++;
      }
    }
    
    score.value = correctCount;
    
    // Calculate elapsed time
    const endTime = new Date();
    const elapsedTimeInSeconds = quizStartTime.value ? 
      Math.floor((endTime.getTime() - quizStartTime.value.getTime()) / 1000) : 0;
    
    // Save quiz attempt
    if (auth.state.isAuthenticated && auth.state.user) {
      try {
        await saveQuizAttempt(
          quizId,
          score.value,
          questions.value.length,
          elapsedTimeInSeconds
        );
      } catch (error) {
        console.error('Failed to save quiz attempt:', error);
      }
    }
    
    quizMode.value = 'results';
  } catch (error) {
    console.error('Error submitting quiz:', error);
  }
}

// Save quiz attempt to Supabase
async function saveQuizAttempt(quizId: number, score: number, totalQuestions: number, elapsedTime: number) {
  try {
    // Insert the quiz attempt
    const isPassed = score / totalQuestions >= 0.6;
    
    const { data: attemptData, error: attemptError } = await supabase
      .from('QuizAttempts')
      .insert({
        quiz_id: quizId,
        user_id: auth.state.user!.userId,
        score: score,
        total_questions: totalQuestions,
        started_at: new Date(Date.now() - (elapsedTime * 1000)).toISOString(),
        completed_at: new Date().toISOString(),
        elapsed_time: elapsedTime,
        is_passed: isPassed
      })
      .select()
      .single();
    
    if (attemptError) {
      throw attemptError;
    }
    
    // Save the user's answers
    const answerPromises = [];
    
    for (let i = 0; i < questions.value.length; i++) {
      const questionId = questions.value[i].questionId;
      const selectedOptionId = userAnswers.value[i];
      
      if (selectedOptionId !== undefined) {
        // Get the option to check if it's correct
        const { data: optionData, error: optionError } = await supabase
          .from('AnswerOptions')
          .select('is_correct')
          .eq('id', selectedOptionId)
          .single();
        
        if (optionError) {
          console.error('Error checking option correctness:', optionError);
          continue;
        }
        
        // Insert the attempt answer
        const answerPromise = supabase
          .from('AttemptAnswers')
          .insert({
            attempt_id: attemptData.id,
            question_id: questionId,
            selected_option_id: selectedOptionId,
            is_correct: optionData.is_correct
          });
        
        answerPromises.push(answerPromise);
      }
    }
    
    // Wait for all answer inserts to complete
    await Promise.all(answerPromises);
    
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
}

// Cancel the quiz and return to appropriate page
function cancelQuiz() {
  if (auth.state.isAuthenticated) {
    router.push('/my-quizzes');
  } else {
    router.push('/');
  }
}

// Retake the quiz
function retakeQuiz() {
  userAnswers.value = {};
  quizStartTime.value = new Date();
  quizMode.value = 'take';
  currentQuestionIndex.value = 0;
}
</script>

<style>
@import '../assets/pages/take-quiz.css';
</style>
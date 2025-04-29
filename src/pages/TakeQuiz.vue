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
        <router-link to="/my-quizzes" class="return-btn">Back to My Quizzes</router-link>
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
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login')
    return
  }
  
  if (isNaN(quizId)) {
    router.push('/my-quizzes')
    return
  }
  
  try {
    await loadQuiz(quizId)
    quizStartTime.value = new Date()
  } catch (error) {
    console.error('Error loading quiz:', error)
    router.push('/my-quizzes')
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

// Cancel the quiz and return to My Quizzes
function cancelQuiz() {
  router.push('/my-quizzes');
}

// Retake the quiz
function retakeQuiz() {
  userAnswers.value = {};
  quizStartTime.value = new Date();
  quizMode.value = 'take';
  currentQuestionIndex.value = 0;
}
</script>

<style scoped>
.take-quiz {
  max-width: 800px;
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

/* Quiz taking styles */
.section {
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--panel-bg);
  box-shadow: var(--shadow-sm);
}

.quiz-taking-section {
  animation: fadeIn 0.3s ease-in-out;
}

.quiz-info {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--panel-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--input-border);
}

.quiz-info p {
  margin: 0;
  color: var(--text-alt);
  font-size: 0.9rem;
}

.quiz-progress {
  margin-top: var(--spacing-sm);
}

.progress-bar {
  height: 8px;
  background: var(--input-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-alt);
}

.question-card {
  margin-bottom: var(--spacing-md);
}

.question-header {
  margin-bottom: var(--spacing-sm);
}

.question-number {
  color: var(--accent);
  margin-right: var(--spacing-xs);
}

.question-text {
  line-height: 1.5;
}

.options-list {
  list-style: none;
  padding-left: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.options-list.interactive .option-item {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.options-list.interactive .option-item:hover {
  background: var(--panel-bg);
  border-color: var(--accent-light);
}

.options-list.interactive .option-item.selected {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  border-color: var(--accent);
}

.quiz-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
  gap: var(--spacing-md);
}

.nav-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.nav-btn:hover:not(:disabled) {
  background: var(--panel-bg);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  display: inline-block;
  line-height: 1;
}

.question-dots {
  display: flex;
  gap: var(--spacing-xs);
}

.question-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--input-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.question-dot.current {
  background: var(--accent);
}

.question-dot.answered {
  background: var(--accent-light);
}

.cancel-btn, .return-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  text-decoration: none;
}

.cancel-btn:hover, .return-btn:hover {
  background: var(--panel-bg);
}

.submit-btn, .retake-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  background: var(--accent);
  color: white;
  border: none;
}

.submit-btn:hover:not(:disabled), .retake-btn:hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quiz-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-md);
}

/* Results styles */
.quiz-results-section {
  animation: fadeIn 0.3s ease-in-out;
}

.results-summary {
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.results-summary h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  font-size: 1.5rem;
  color: var(--text-main);
}

.score-display {
  background: var(--input-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: inline-block;
  min-width: 200px;
  margin-top: var(--spacing-sm);
}

.score-percentage {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
}

.score-fraction {
  margin: 0.25rem 0;
  color: var(--text-main);
}

.pass-fail-indicator {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  margin-top: 0.5rem;
  background: rgba(255, 70, 70, 0.2);
  color: rgb(255, 70, 70);
}

.pass-fail-indicator.pass {
  background: rgba(70, 200, 120, 0.2);
  color: rgb(70, 200, 120);
}

.question-list {
  list-style: none;
  padding: 0;
  margin: var(--spacing-lg) 0;
}

.question-list .question-item {
  position: relative;
  background: var(--input-bg);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-md);
  border-left: 3px solid rgb(255, 70, 70);
}

.question-list .question-item:has(.result-indicator.correct) {
  border-color: rgb(70, 200, 120);
}

.result-indicator {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.result-indicator.correct {
  background: rgba(70, 200, 120, 0.2);
  color: rgb(70, 200, 120);
}

.result-indicator.incorrect {
  background: rgba(255, 70, 70, 0.2);
  color: rgb(255, 70, 70);
}

.options-list.results .option-item {
  position: relative;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.options-list.results .option-item.user-selected {
  background: rgba(255, 70, 70, 0.1);
  border-color: rgba(255, 70, 70, 0.3);
}

.options-list.results .option-item.correct-answer {
  background: rgba(70, 200, 120, 0.1);
  border-color: rgba(70, 200, 120, 0.3);
}

.options-list.results .option-item.user-selected.correct-answer {
  background: rgba(70, 200, 120, 0.2);
  border-color: rgba(70, 200, 120, 0.5);
}

.answer-explanation {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(95, 121, 149, 0.1);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .take-quiz {
    padding: var(--spacing-md);
  }
  
  .quiz-navigation {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .question-dots {
    order: -1;
    margin-bottom: var(--spacing-sm);
  }
}
</style>
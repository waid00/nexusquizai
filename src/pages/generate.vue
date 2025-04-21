```vue
<!-- src/pages/Generate.vue -->
<template>
  <div class="generate">
    <h2 class="page-title">{{ quizMode === 'create' ? 'Generate a Quiz' : quizMode === 'take' ? 'Take Quiz' : 'Quiz Results' }}</h2>

    <!-- Quiz Creation Mode -->
    <div v-if="quizMode === 'create'">
      <!-- 1) Mode toggle -->
      <div class="section toggle-section">
        <ModeToggle v-model="isFileMode" />
      </div>

      <!-- 2) Text‑area (always shown if no file) -->
      <div v-if="!isFileMode" class="section content-section">
        <textarea
          v-model="text"
          placeholder="Paste your text here…"
          class="content-input"
        ></textarea>
      </div>

      <!-- 3) File picker -->
      <div v-if="isFileMode" class="section content-section">
        <div class="file-input">
          <input
            type="file"
            id="file-input"
            @change="onFile"
            accept=".txt,.docx"
          />
          <label for="file-input" class="file-btn">
            {{ fileName || 'Choose File' }}
          </label>
          <button
            v-if="fileName"
            class="clear-btn"
            @click="clearFile"
            aria-label="Remove file"
          >×</button>
        </div>
      </div>

      <!-- 4) Quiz parameters -->
      <div class="section parameters-section">
        <h3 class="section-title">Quiz Parameters</h3>
        <div class="controls">
          <div class="control-group">
            <label for="quiz-type">Type</label>
            <select id="quiz-type" v-model="type" class="select-input">
              <option value="mcq">Multiple‑choice</option>
              <option value="tf">True/False</option>
              <option value="fill">Fill‑in‑the‑blank</option>
            </select>
          </div>
          <div class="control-group">
            <label for="question-count">Count</label>
            <input
              id="question-count"
              type="number"
              v-model.number="count"
              min="1"
              max="20"
              class="number-input"
            />
          </div>
          <div class="control-group">
            <label for="quiz-difficulty">Difficulty</label>
            <select id="quiz-difficulty" v-model="difficulty" class="select-input">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 5) Generate button -->
      <div class="button-container">
        <button
          class="generate-btn"
          @click="generate"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Generating…' : 'Generate Quiz' }}
        </button>
      </div>

      <!-- 6) Results & Export -->
      <div v-if="questions.length" class="section results-section">
        <div class="results-header">
          <h3 class="section-title">Your Quiz</h3>
          <div class="action-buttons">
            <button class="export-btn" @click="exportCSV">Export CSV</button>
            <button class="take-quiz-btn" @click="startQuiz">Take Quiz</button>
          </div>
        </div>
        
        <div class="quiz-name-input">
          <label for="quiz-name">Quiz Name:</label>
          <input 
            id="quiz-name" 
            v-model="quizName" 
            type="text" 
            placeholder="Enter a name for your quiz"
            class="form-input"
          />
        </div>
        
        <ul class="question-list">
          <li v-for="(q, i) in questions" :key="i" class="question-item">
            <div class="question-header">
              <strong class="question-number">Q{{ i + 1 }}:</strong>
              <span class="question-text">{{ q.question }}</span>
            </div>
            <ul v-if="q.options" class="options-list">
              <li v-for="(opt, j) in q.options" :key="j" class="option-item">
                <span class="option-text">{{ opt }}</span>
                <span v-if="j === q.answerIndex" class="correct-indicator">✓</span>
              </li>
            </ul>
            <button class="remove-btn" @click="remove(i)">Remove</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Quiz Taking Mode -->
    <div v-else-if="quizMode === 'take'" class="section quiz-taking-section">
      <div class="quiz-info">
        <h3>{{ quizName || 'Untitled Quiz' }}</h3>
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
          <span class="question-text">{{ currentQuestion.question }}</span>
        </div>
        <ul v-if="currentQuestion.options" class="options-list interactive">
          <li 
            v-for="(opt, j) in currentQuestion.options" 
            :key="j" 
            :class="['option-item', { 'selected': userAnswers[currentQuestionIndex] === j }]"
            @click="selectAnswer(currentQuestionIndex, j)"
          >
            <span class="option-text">{{ opt }}</span>
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
            <span class="question-text">{{ q.question }}</span>
            <span 
              class="result-indicator" 
              :class="userAnswers[i] === q.answerIndex ? 'correct' : 'incorrect'"
            >
              {{ userAnswers[i] === q.answerIndex ? '✓' : '✗' }}
            </span>
          </div>
          <ul v-if="q.options" class="options-list results">
            <li 
              v-for="(opt, j) in q.options" 
              :key="j" 
              :class="[
                'option-item', 
                {
                  'user-selected': userAnswers[i] === j,
                  'correct-answer': j === q.answerIndex
                }
              ]"
            >
              <span class="option-text">{{ opt }}</span>
            </li>
          </ul>
          <div class="answer-explanation">
            <p v-if="userAnswers[i] !== q.answerIndex">Correct answer: {{ q.options[q.answerIndex] }}</p>
            <p v-if="q.explanation">{{ q.explanation }}</p>
          </div>
        </li>
      </ul>

      <div class="quiz-actions">
        <button class="new-quiz-btn" @click="resetQuiz">New Quiz</button>
        <button class="retake-btn" @click="retakeQuiz">Retake Quiz</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/assets/generate.css'
import { ref, watch, computed } from 'vue'
import mammoth from 'mammoth'
import { chat, type ChatCompletionRequestMessage } from '@/api/openai'
import ModeToggle from '@/components/ModeToggle.vue'
import { auth } from '@/store/auth'

const isFileMode  = ref(false)
const text        = ref('')
const extracted   = ref('')
const fileName    = ref('')
const type        = ref<'mcq'|'tf'|'fill'>('mcq')
const count       = ref(5)
const difficulty  = ref<'easy'|'medium'|'hard'>('medium')
const isLoading   = ref(false)
const questions   = ref<any[]>([])

// Quiz taking states
const quizMode = ref<'create' | 'take' | 'results'>('create')
const userAnswers = ref<number[]>([])
const quizName = ref('')
const quizStartTime = ref<Date | null>(null)
const score = ref(0)
const currentQuestionIndex = ref(0)

// Computed property to check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return userAnswers.value.length === questions.value.length && 
         userAnswers.value.every(ans => ans !== undefined)
})

// Computed property for current question
const currentQuestion = computed(() => {
  if (questions.value.length > 0 && currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value]
  }
  return null
})

// Navigation functions for one-by-one question display
function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

// Clear file inputs when toggling off file mode
watch(isFileMode, (mode) => {
  if (!mode) {
    extracted.value = ''
    fileName.value  = ''
    const fi = document.getElementById('file-input') as HTMLInputElement
    if (fi) fi.value = ''
  }
})

// Handle file upload
async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  fileName.value = f.name
  text.value     = ''
  if (f.name.toLowerCase().endsWith('.docx')) {
    const buf = await f.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
    extracted.value = value.trim()
  } else {
    extracted.value = (await f.text()).trim()
  }
}

// Clear the selected file
function clearFile() {
  extracted.value = ''
  fileName.value  = ''
  const fi = document.getElementById('file-input') as HTMLInputElement
  if (fi) fi.value = ''
}

// Generate quiz, extract valid JSON array slice before parsing
async function generate() {
  const src = extracted.value.trim() || text.value.trim()
  if (!src) {
    alert('Please paste text or upload a file before generating.')
    return
  }

  isLoading.value = true
  const systemPrompt = 'You output ONLY a JSON array of quiz objects. Each object must have a question, options array, answerIndex (zero-based index of correct answer in options array), and explanation field explaining why this answer is correct. No extra text.'
  const userPrompt   = `Generate ${count.value} ${type.value} questions (difficulty: ${difficulty.value}) from this text. Respond with a valid JSON array only:

"""
${src}
"""`

  try {
    const msgs: ChatCompletionRequestMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ]
    let raw = await chat(msgs)

    // Strip code fences, then grab JSON array substring
    raw = raw.trim()
      .replace(/^```(?:json)?\s*/, '')
      .replace(/\s*```$/, '')
      .trim()
    const start = raw.indexOf('[')
    const end   = raw.lastIndexOf(']')
    if (start === -1 || end === -1) {
      throw new Error('No JSON array found in response')
    }
    const jsonText = raw.slice(start, end + 1)
    questions.value = JSON.parse(jsonText)
  } catch (err: any) {
    alert('JSON parse error: ' + err.message)
  } finally {
    isLoading.value = false
  }
}

function remove(i: number) {
  questions.value.splice(i, 1)
}

function exportCSV() {
  const rows = questions.value.map((q,i) => {
    const opts = q.options?.join('|') || ''
    return `"${i+1}","${q.question}","${opts}","${q.options?.[q.answerIndex]}"`
  })
  const csv = ['No,Question,Options,Answer', ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'quiz.csv'; a.click()
  URL.revokeObjectURL(url)
}

function startQuiz() {
  if (!quizName.value.trim()) {
    quizName.value = "Untitled Quiz"
  }
  quizMode.value = 'take'
  quizStartTime.value = new Date()
  userAnswers.value = Array(questions.value.length).fill(undefined)
}

function selectAnswer(questionIndex: number, optionIndex: number) {
  userAnswers.value[questionIndex] = optionIndex
}

function cancelQuiz() {
  quizMode.value = 'create'
  userAnswers.value = []
  quizStartTime.value = null
}

async function submitQuiz() {
  // Calculate score
  score.value = userAnswers.value.reduce((acc, ans, i) => {
    return acc + (ans === questions.value[i].answerIndex ? 1 : 0)
  }, 0)
  
  // Calculate elapsed time
  const endTime = new Date()
  const elapsedTimeInSeconds = quizStartTime.value ? 
    Math.floor((endTime.getTime() - quizStartTime.value.getTime()) / 1000) : 0
  
  // Save to database if user is authenticated
  if (auth.state.isAuthenticated && auth.state.user) {
    try {
      await saveQuizAttempt(
        quizName.value, 
        score.value, 
        questions.value.length, 
        elapsedTimeInSeconds
      )
    } catch (error) {
      console.error('Failed to save quiz attempt:', error)
    }
  }
  
  quizMode.value = 'results'
}

async function saveQuizAttempt(title: string, score: number, totalQuestions: number, elapsedTime: number) {
  const { getDB, saveDB } = await import('@/db/index')
  const db = await getDB()
  
  try {
    // 1. First check if the quiz already exists
    let quizId: number
    const quizResult = db.exec(`
      SELECT quiz_id 
      FROM Quizzes 
      WHERE title = ? AND owner_id = ?
    `, [title, auth.state.user!.userId])
    
    if (quizResult.length === 0 || quizResult[0].values.length === 0) {
      // Create a new quiz
      // Convert difficulty to proper case to match DB constraint
      const difficultyProperCase = difficulty.value.charAt(0).toUpperCase() + difficulty.value.slice(1).toLowerCase()
      
      db.run(`
        INSERT INTO Quizzes (
          owner_id, 
          category_id, 
          title, 
          description, 
          difficulty, 
          is_public, 
          created_at, 
          published_at
        ) VALUES (?, 1, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `, [
        auth.state.user!.userId, 
        title, 
        `Generated quiz with ${totalQuestions} questions`, 
        difficultyProperCase
      ])
      
      // Get the ID of the newly inserted quiz
      const newQuizResult = db.exec("SELECT last_insert_rowid()")
      quizId = newQuizResult[0].values[0][0] as number
      
      // Insert questions and answer options
      for (let i = 0; i < questions.value.length; i++) {
        const question = questions.value[i]
        
        // Insert question - use proper case for difficulty
        db.run(`
          INSERT INTO Questions (
            quiz_id, 
            question_text, 
            question_type, 
            difficulty, 
            created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `, [
          quizId, 
          question.question, 
          type.value === 'mcq' ? 'multiple_choice' : 
            type.value === 'tf' ? 'true_false' : 'fill_blank', 
          difficultyProperCase
        ])
        
        // Get the question ID
        const questionResult = db.exec("SELECT last_insert_rowid()")
        const questionId = questionResult[0].values[0][0] as number
        
        // Insert answer options
        if (question.options && Array.isArray(question.options)) {
          for (let j = 0; j < question.options.length; j++) {
            db.run(`
              INSERT INTO AnswerOptions (
                question_id, 
                answer_text, 
                is_correct, 
                created_at
              ) VALUES (?, ?, ?, datetime('now'))
            `, [
              questionId,
              question.options[j],
              j === question.answerIndex ? 1 : 0
            ])
          }
        }
      }
    } else {
      quizId = quizResult[0].values[0][0] as number
    }
    
    // 2. Create the quiz attempt
    const isPassed = score / totalQuestions >= 0.6 ? 1 : 0
    db.run(`
      INSERT INTO QuizAttempts (
        quiz_id, 
        user_id, 
        score, 
        total_questions, 
        started_at, 
        completed_at, 
        elapsed_time, 
        is_passed
      ) VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' seconds'), datetime('now'), ?, ?)
    `, [
      quizId,
      auth.state.user!.userId,
      score,
      totalQuestions,
      elapsedTime,
      elapsedTime,
      isPassed
    ])
    
    // Get the attempt ID
    const attemptResult = db.exec("SELECT last_insert_rowid()")
    const attemptId = attemptResult[0].values[0][0] as number
    
    // 3. Save the user's answers
    for (let i = 0; i < questions.value.length; i++) {
      // Get the question ID
      const questionQuery = db.exec(`
        SELECT question_id 
        FROM Questions 
        WHERE quiz_id = ? AND question_text = ?
      `, [quizId, questions.value[i].question])
      
      if (questionQuery.length > 0 && questionQuery[0].values.length > 0) {
        const questionId = questionQuery[0].values[0][0] as number
        
        // Get the selected option ID
        const userAnswer = userAnswers.value[i]
        if (userAnswer !== undefined) {
          const optionQuery = db.exec(`
            SELECT option_id 
            FROM AnswerOptions 
            WHERE question_id = ? AND answer_text = ?
          `, [questionId, questions.value[i].options[userAnswer]])
          
          if (optionQuery.length > 0 && optionQuery[0].values.length > 0) {
            const optionId = optionQuery[0].values[0][0] as number
            const isCorrect = userAnswer === questions.value[i].answerIndex ? 1 : 0
            
            // Insert the attempt answer
            db.run(`
              INSERT INTO AttemptAnswers (
                attempt_id, 
                question_id, 
                selected_option_id, 
                is_correct
              ) VALUES (?, ?, ?, ?)
            `, [attemptId, questionId, optionId, isCorrect])
          }
        }
      }
    }
    
    // Save changes to the database
    await saveDB()
    console.log('Quiz attempt saved successfully')
    
  } catch (error) {
    console.error('Error saving quiz attempt:', error)
    throw error
  }
}

function resetQuiz() {
  quizMode.value = 'create'
  userAnswers.value = []
  quizStartTime.value = null
  score.value = 0
}

function retakeQuiz() {
  quizMode.value = 'take'
  userAnswers.value = Array(questions.value.length).fill(undefined)
  quizStartTime.value = new Date()
}
</script>

<style scoped>
.file-btn {
  padding: 0.6rem 1.2rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  cursor: pointer;
  transition: background var(--transition-duration) var(--transition-timing),
              color var(--transition-duration) var(--transition-timing);
}
.file-btn:hover {
  background: var(--accent);
  color: #fff;
}
.clear-btn {
  margin-left: var(--spacing-sm);
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-alt);
  cursor: pointer;
  transition: color var(--transition-duration) var(--transition-timing);
}
.clear-btn:hover {
  color: var(--text-main);
}

/* Quiz name input */
.quiz-name-input {
  margin: var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quiz-name-input label {
  font-weight: 500;
  color: var(--text-main);
}

.quiz-name-input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-main);
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.take-quiz-btn {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.take-quiz-btn:hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

/* Interactive quiz taking styles */
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

.quiz-info h3 {
  margin: 0 0 0.25rem;
  color: var(--accent);
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

.nav-btn:hover {
  background: var(--panel-bg);
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
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

.cancel-btn, .new-quiz-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
}

.cancel-btn:hover, .new-quiz-btn:hover {
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

.submit-btn:hover, .retake-btn:hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Quiz results display */
.quiz-results-section {
  animation: fadeIn 0.3s ease-in-out;
}

.results-summary {
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.score-display {
  background: var(--panel-bg);
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

.question-list.results .question-item {
  position: relative;
  border-left: 3px solid;
  border-color: rgb(255, 70, 70);
  padding-left: calc(var(--spacing-md) - 3px);
}

.question-list.results .question-item:has(.result-indicator.correct) {
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
</style>
```

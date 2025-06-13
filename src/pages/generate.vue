```vue
<!-- src/pages/Generate.vue -->
<template>
  <div class="generate">
    <h2 class="page-title">{{ quizMode === 'create' ? t('quiz.generateQuiz') : quizMode === 'take' ? t('quiz.takeQuiz') : t('quiz.quizResults') }}</h2>

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
          :placeholder="t('quiz.pasteTextHere')"
          class="content-input"
          :class="{
            'valid': contentValid,
            'invalid': contentInvalid
          }"
          minlength="100"
          maxlength="10000"
          @input="validateContent"
          @blur="showContentValidationMessage = true"
        ></textarea>
        <div class="input-info">
          <p class="input-hint">{{ t('quiz.contentLengthRequirement') }}</p>
          <div class="validation-feedback" v-if="showContentValidationMessage && text.trim().length < 100 && text.trim().length > 0">
            <div class="warning-message"><i class="warning-icon">⚠️</i> {{ t('quiz.contentLengthWarning') }}</div>
          </div>
          <span class="char-counter" :class="{ 'limit-near': text.length > 9000, 'count-warning': text.trim().length < 100 && text.trim().length > 0 }">
            {{ text.length }}/10000
          </span>
        </div>
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
            {{ fileName || t('quiz.chooseFile') }}
          </label>
          <button
            v-if="fileName"
            class="clear-btn"
            @click="clearFile"
            :aria-label="t('common.remove')"
          >×</button>
        </div>
      </div>

      <!-- 4) Required Prompt Section (Moved from below) -->
      <div class="section prompt-section">
        <h3 class="section-title">{{ t('quiz.quizPrompt') }} <span class="required-marker">*</span></h3>
        
        <div class="prompt-container">
          <div class="prompt-controls">
            <div class="prompt-toggle">
              <input type="checkbox" id="auto-generate-prompt" v-model="autoGeneratePrompt" />
              <label for="auto-generate-prompt">{{ t('quiz.autoGeneratePrompt') }}</label>
            </div>
            <button @click="resetPrompt" class="reset-btn">{{ t('common.reset') }}</button>
          </div>
          
          <textarea
            v-model="customPrompt"
            :placeholder="autoGeneratePrompt ? t('quiz.aiWillGeneratePrompt') : t('quiz.enterSpecificInstructions')"
            class="prompt-input"
            :class="{
              'valid': customPromptValid,
              'invalid': customPromptInvalid
            }"
            :disabled="false"
            :required="!autoGeneratePrompt"
            minlength="10"
            maxlength="1000"
            @input="validateCustomPrompt"
            @blur="showPromptValidationMessage = true"
          ></textarea>
          
          <div class="input-info">
            <p class="input-hint">{{ t('quiz.promptLengthRequirement') }}</p>
            <div class="validation-feedback" v-if="showPromptValidationMessage && customPrompt.trim().length < 10 && customPrompt.trim().length > 0">
              <div class="warning-message"><i class="warning-icon">⚠️</i> {{ t('quiz.promptLengthWarning') }}</div>
            </div>
            <span class="char-counter" :class="{ 'limit-near': customPrompt.length > 900, 'count-warning': customPrompt.trim().length < 10 && customPrompt.trim().length > 0 }">
              {{ customPrompt.length }}/1000
            </span>
          </div>
          
          <p class="prompt-info">{{ t('quiz.promptGuidance') }}</p>
        </div>
      </div>
      
      <!-- 5) Quiz parameters (Moved down) -->
      <div class="section parameters-section">
        <h3 class="section-title">{{ t('quiz.quizParameters') }}</h3>
        <div class="controls">
          <div class="control-group">
            <label for="quiz-type">{{ t('quiz.type') }}</label>
            <select id="quiz-type" v-model="type" class="select-input">
              <option value="mcq">{{ t('quiz.multipleChoice') }}</option>
              <option value="tf">{{ t('quiz.trueFalse') }}</option>
            </select>
          </div>
          <div class="control-group">
            <label for="question-count">{{ t('quiz.count') }}</label>
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
            <label for="quiz-difficulty">{{ t('quiz.difficulty') }}</label>
            <select id="quiz-difficulty" v-model="difficulty" class="select-input">
              <option value="easy">{{ t('quiz.easy') }}</option>
              <option value="medium">{{ t('quiz.medium') }}</option>
              <option value="hard">{{ t('quiz.hard') }}</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 6) Generate button -->
      <div class="button-container">
        <button
          class="generate-btn"
          @click="generate"
          :disabled="isLoading || (!autoGeneratePrompt && !customPrompt.trim())"
        >
          <span v-if="!isLoading">{{ t('quiz.generateQuiz') }}</span>
          <span v-else class="loading-text">
            {{ generationStep || t('quiz.generatingQuiz') }} 
            <span v-if="generationProgress > 0" class="progress-indicator">{{ Math.round(generationProgress * 100) }}%</span>
          </span>
        </button>
      </div>

      <!-- 7) Results & Export -->

      <!-- Generated Quiz Category Section (appears after generation) -->
      <div v-if="questions.length > 0" class="section category-section">
        <h3 class="section-title">{{ t('quiz.quizCategory') }}</h3>
        <div class="category-selection">
          <p class="category-info">{{ t('quiz.suggestedCategory') }}</p>
          <select v-model="suggestedCategory" class="select-input">
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.category_name }}
            </option>
          </select>
        </div>
      </div>
      <div v-if="questions.length" class="section results-section">
        <div class="results-header">
          <h3 class="section-title">{{ t('quiz.yourQuiz') }}</h3>
          <div class="action-buttons">
            <button class="edit-quiz-btn" @click="editEntireQuiz">{{ t('quiz.editQuiz') }}</button>
            <button class="export-btn" @click="exportCSV">{{ t('quiz.exportCSV') }}</button>
            <button class="save-quiz-btn" @click="saveAndViewQuiz">{{ t('quiz.saveQuiz') }}</button>
            <button class="take-quiz-btn" @click="startQuiz">{{ t('quiz.takeQuiz') }}</button>
          </div>
        </div>
        
        <div class="quiz-name-input">
          <label for="quiz-name">{{ t('quiz.quizName') }}:</label>
          <input 
            id="quiz-name" 
            v-model="quizName" 
            type="text" 
            :placeholder="t('quiz.enterQuizName')"
            class="form-input"
            :class="{
              'valid': quizNameValid,
              'invalid': quizNameInvalid
            }"
            maxlength="50"
          />
          <span class="char-counter" :class="{ 'limit-near': quizName.length > 40 }">
            {{ quizName.length }}/50
          </span>
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
          </li>
        </ul>
      </div>
    </div>

    <!-- Quiz Taking Mode -->
    <div v-else-if="quizMode === 'take'" class="section quiz-taking-section">
      <div class="quiz-info">
        <h3>{{ quizName || t('quiz.untitledQuiz') }}</h3>
        <p>{{ t('quiz.questions') }}: {{ questions.length }} | {{ t('quiz.difficulty') }}: {{ t(`quiz.${difficulty}`) }}</p>
        <div class="quiz-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{width: `${(currentQuestionIndex + 1) / questions.length * 100}%`}"
            ></div>
          </div>
          <div class="progress-text">
            {{ t('quiz.questionProgress', { current: currentQuestionIndex + 1, total: questions.length }) }}
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
          <span class="nav-icon">←</span> {{ t('common.previous') }}
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
          {{ t('common.next') }} <span class="nav-icon">→</span>
        </button>
        <button 
          v-else
          class="submit-btn" 
          @click="submitQuiz"
          :disabled="!allQuestionsAnswered"
        >
          {{ t('common.submit') }}
        </button>
      </div>

      <div class="quiz-actions">
        <button class="cancel-btn" @click="cancelQuiz">{{ t('common.cancel') }}</button>
      </div>
    </div>

    <!-- Quiz Results Mode -->
    <div v-else-if="quizMode === 'results'" class="section quiz-results-section">
      <div class="results-summary">
        <h3>{{ t('quiz.results') }}</h3>
        <div class="score-display">
          <div class="score-percentage">
            {{ Math.round((score / questions.length) * 100) }}%
          </div>
          <div class="score-fraction">
            {{ score }} / {{ questions.length }} {{ t('quiz.correctAnswer') }}
          </div>
          <div class="pass-fail-indicator" :class="{'pass': score / questions.length >= 0.6}">
            {{ score / questions.length >= 0.6 ? t('quiz.pass') : t('quiz.fail') }}
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
            <p v-if="userAnswers[i] !== q.answerIndex">{{ t('quiz.correctAnswer') }}: {{ q.options[q.answerIndex] }}</p>
            <p v-if="q.explanation">{{ q.explanation }}</p>
          </div>
        </li>
      </ul>

      <div class="quiz-actions">
        <button class="new-quiz-btn" @click="resetQuiz">{{ t('quiz.createQuiz') }}</button>
        <button class="retake-btn" @click="retakeQuiz">{{ t('quiz.retakeQuiz') }}</button>
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
import '@/assets/pages/generate.css'
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import mammoth from 'mammoth'
import { chat, type ChatCompletionRequestMessage } from '@/api/openai'
import ModeToggle from '@/components/ModeToggle.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { auth } from '@/store/auth'
import { supabase } from '@/api/supabase'
import { 
  createQuiz, 
  createQuestion, 
  createAnswerOptions,
  createQuizAttempt,
  createAttemptAnswers,
  getCategories,
  updateQuiz,
  createSourceDoc
} from '@/api/supabase'
import { useLanguage } from '@/context/LanguageContext'

const router = useRouter()

// Get the translation function
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

const isFileMode  = ref(false)
const text        = ref('')
const extracted   = ref('')
const fileName    = ref('')
const type        = ref<'mcq'|'tf'>('mcq')
const count       = ref(5)
const difficulty  = ref<'easy'|'medium'|'hard'>('medium')
const isLoading   = ref(false)
const questions   = ref<any[]>([])
const categories  = ref<any[]>([])
const suggestedCategory = ref<number>(1) // Default to General Knowledge

// Quiz taking states
const quizMode = ref<'create' | 'take' | 'results'>('create')
const userAnswers = ref<number[]>([])
const quizName = ref('')
const quizStartTime = ref<Date | null>(null)
const score = ref(0)
const currentQuestionIndex = ref(0)
const currentQuizId = ref<number | null>(null)

// Confirmation modal states
const showConfirmation = ref(false)
const confirmationData = ref({
  title: '',
  message: '',
  confirmText: '',
  type: 'warning' // Initialize with a valid type value
})
const confirmActionCallback = ref<() => void>(() => {})

// Custom prompt states
const autoGeneratePrompt = ref(false)
const customPrompt = ref('')

// Add validation state for custom prompt
const customPromptValid = ref(false)
const customPromptInvalid = ref(false)

// Validation message state for prompt
const showPromptValidationMessage = ref(false)

// Form validation state
const quizNameValid = ref(false)
const quizNameInvalid = ref(false)

// Content validation state
const contentValid = ref(false)
const contentInvalid = ref(false)

// Validation message state for content
const showContentValidationMessage = ref(false)

// Default prompt templates for reset functionality
const defaultPromptTemplates = {
  mcq: "Generate professional multiple-choice questions that test knowledge and comprehension. Include 4 answer options per question with one correct answer. Explain why the correct answer is right.",
  tf: "Create true/false questions that assess factual knowledge. Each question should clearly state a proposition that is definitively true or false."
}

// Reset prompt to default based on current quiz type
function resetPrompt() {
  customPrompt.value = defaultPromptTemplates[type.value] || ''
  autoGeneratePrompt.value = false
}

// Validate quiz name
function validateQuizName() {
  const name = quizName.value.trim()
  if (name.length === 0) {
    quizNameValid.value = false
    quizNameInvalid.value = false
    return false
  } else if (name.length < 3) {
    quizNameValid.value = false
    quizNameInvalid.value = true
    return false
  } else if (name.length > 50) {
    quizNameValid.value = false
    quizNameInvalid.value = true
    return false
  } else {
    quizNameValid.value = true
    quizNameInvalid.value = false
    return true
  }
}

// Validate content
function validateContent() {
  const content = text.value.trim()
  if (content.length === 0) {
    contentValid.value = false
    contentInvalid.value = false
    return false
  } else if (content.length < 100) {
    contentValid.value = false
    contentInvalid.value = true
    return false
  } else if (content.length > 10000) {
    contentValid.value = false
    contentInvalid.value = true
    return false
  } else {
    contentValid.value = true
    contentInvalid.value = false
    return true
  }
}

// Function to detect language from content
async function detectLanguage(content: string): Promise<string> {
  try {
    // Truncate the content if it's too long for detection
    const sampleText = content.length > 1000 ? content.substring(0, 1000) : content;
    
    // Create a system message for language detection
    const systemMsg = {
      role: 'system' as const,
      content: 'You are a language detection expert. Identify the language of the provided text and return ONLY the ISO language code (e.g., "en" for English, "es" for Spanish, "fr" for French, etc.).'
    };
    
    // Create a user message with content to analyze
    const userMsg = {
      role: 'user' as const,
      content: `Detect the language of the following text and reply with only the ISO language code:\n\n${sampleText}`
    };
    
    // Send to OpenAI API
    const detectedLang = await chat([systemMsg, userMsg]);
    
    // Clean up and return just the language code
    return detectedLang.trim().toLowerCase().substring(0, 2);
  } catch (error) {
    console.error("Error detecting language:", error);
    return "en"; // Default to English if detection fails
  }
}

// Validate custom prompt
function validateCustomPrompt() {
  if (autoGeneratePrompt.value) {
    // When auto-generating, we don't need to validate
    customPromptValid.value = false
    customPromptInvalid.value = false
    return true
  }
  
  const prompt = customPrompt.value.trim()
  if (prompt.length === 0) {
    customPromptValid.value = false
    customPromptInvalid.value = false
    return false
  } else if (prompt.length < 10) {
    customPromptValid.value = false
    customPromptInvalid.value = true
    return false
  } else {
    customPromptValid.value = true
    customPromptInvalid.value = false
    return true
  }
}

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

// Load available categories when component mounts
onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('Categories')
      .select('id, category_name, description')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error loading categories:', error);
    } else if (data) {
      categories.value = data;
      console.log('Loaded categories:', categories.value);
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
});

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

// Watch for when the text content or file content changes
watch([text, extracted, autoGeneratePrompt], async ([newText, newExtracted, shouldGenerate]) => {
  // Only auto-generate if the option is enabled and we have content
  if (shouldGenerate && (newText.trim() || newExtracted.trim())) {
    const content = newExtracted.trim() || newText.trim();
    
    if (content) {
      // Show a temporary message while generating
      customPrompt.value = "Analyzing content to create the best prompt...";
      
      try {
        // Generate a prompt using the content
        const generatedPrompt = await generatePromptFromContent(content);
        if (generatedPrompt) {
          customPrompt.value = generatedPrompt;
        }
      } catch (error) {
        console.error("Error auto-generating prompt:", error);
        customPrompt.value = "Failed to generate prompt. Please try again or enter your own.";
      }
    }
  }
});

// Set up watchers for real-time validation
watch(() => quizName.value, (newValue) => {
  validateQuizName()
})

// Set up watchers for validation of custom prompt
watch([customPrompt, autoGeneratePrompt], ([newPrompt, isAutoGenerate]) => {
  validateCustomPrompt()
})

// Set up watchers for validation of content
watch(() => text.value, (newValue) => {
  validateContent()
})

// Function to generate a prompt from the content
async function generatePromptFromContent(content: string): Promise<string> {
  try {
    // If content is too long, trim it
    const trimmedContent = content.length > 2000 
      ? content.substring(0, 2000) + "..."
      : content;
    
    // Detect the language of the content
    const detectedLanguage = await detectLanguage(trimmedContent);
    
    // Create a system message to instruct the AI
    const systemMsg: ChatCompletionRequestMessage = {
      role: 'system' as const,
      content: `Analyze the provided text and create a detailed prompt that will help generate excellent quiz questions. 
      Focus on identifying the key concepts, themes, and knowledge areas in the text.
      Your prompt should be 2-4 sentences and provide specific guidance on what aspects to focus on.
      Generate the prompt in the same language as the provided content. IMPORTANT: Generate the prompt in ${detectedLanguage}.
      DO NOT create the actual quiz questions - just create a prompt that would help generate good questions.`
    };
    
    // Create a user message with the content to analyze
    const userMsg: ChatCompletionRequestMessage = {
      role: 'user' as const,
      content: `Create a prompt for generating quiz questions from this content: 
      
      "${trimmedContent}"`
    };
    
    // Send the request to the OpenAI API
    const response = await chat([systemMsg, userMsg]);
    
    // Return the generated prompt, or a default if empty
    return response.trim() || `Generate thoughtful quiz questions about ${type.value === 'mcq' ? 'multiple-choice' : 'true/false'} questions about the key concepts in this content.`;
  } catch (error) {
    console.error("Error generating prompt:", error);
    return defaultPromptTemplates[type.value];
  }
}

/**
 * Detects if content has characteristics of educational/technical material with detailed explanations
 * @param content The text content to analyze
 * @returns Boolean indicating if this appears to be educational material
 */
function detectEducationalMaterial(content: string): boolean {
  if (!content || content.length < 100) return false;
  
  // 1. Check for definition-style patterns (term: explanation)
  const definitionPatternCount = (content.match(/^([^:]+):\s*$/gm) || []).length;
  
  // 2. Check for section headers with numbering patterns (common in educational materials)
  const sectionHeaderCount = (content.match(/^(\d+\.\d+(\.\d+)*)\s+[A-Z][a-z]/gm) || []).length;
  
  // 3. Check for technical terminology density
  const technicalTerms = [
    'definition', 'algorithm', 'function', 'property', 'theorem', 'analysis',
    'system', 'process', 'method', 'concept', 'model', 'paradigm', 'architecture',
    'framework', 'interface', 'protocol', 'syntax', 'semantics', 'entity',
    'attribute', 'parameter', 'variable', 'constant', 'implementation', 'specification',
    'component', 'module', 'structure', 'instance', 'reference', 'declaration'
  ];
  
  let termCount = 0;
  for (const term of technicalTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    termCount += matches.length;
  }
  
  const wordCount = content.split(/\s+/).length;
  const technicalTermDensity = wordCount > 0 ? termCount / wordCount : 0;
  
  // 4. Check for multi-paragraph explanations (common in educational content)
  // Look for paragraph breaks followed by continued explanations
  const explanationPatterns = (content.match(/\.\s*\n\n.{100,}/g) || []).length;
  
  // 5. Check for bullet point lists (common in educational materials)
  const bulletPointLists = (content.match(/^(\s*[-•*]\s+.+\n){3,}/gm) || []).length;
  
  // 6. Check for reference citations (common in academic materials)
  const citationCount = (content.match(/\[\d+\]|\(\w+\s*,\s*\d{4}\)/g) || []).length;
  
  // 7. Check for educational keyword density
  const educationalKeywords = [
    'learn', 'understand', 'explain', 'describe', 'define', 'analyze',
    'evaluate', 'compare', 'contrast', 'demonstrate', 'identify', 'examine',
    'explore', 'student', 'knowledge', 'skill', 'competency', 'curriculum',
    'education', 'academic', 'study', 'research', 'theory', 'principle'
  ];
  
  let educationalKeywordCount = 0;
  for (const keyword of educationalKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(regex) || [];
    educationalKeywordCount += matches.length;
  }
  
  const educationalKeywordDensity = wordCount > 0 ? educationalKeywordCount / wordCount : 0;
  
  // Calculate a score based on these factors
  let score = 0;
  
  if (definitionPatternCount >= 3) score += 2;
  if (sectionHeaderCount >= 2) score += 1;
  if (technicalTermDensity > 0.02) score += 2;
  if (explanationPatterns >= 2) score += 2;
  if (bulletPointLists >= 1) score += 1;
  if (citationCount >= 2) score += 1;
  if (educationalKeywordDensity > 0.015) score += 1;
  
  // Check for paragraph length - educational content often has longer paragraphs with detailed explanations
  const paragraphs = content.split(/\n\s*\n/);
  const longParagraphCount = paragraphs.filter(p => p.length > 200).length;
  if (longParagraphCount >= 2) score += 1;
  
  // Log the detection results for debugging
  console.log('Educational material detection results:', {
    definitionPatternCount,
    sectionHeaderCount,
    technicalTermDensity,
    explanationPatterns,
    bulletPointLists,
    citationCount,
    educationalKeywordDensity,
    longParagraphCount,
    score
  });
  
  // Return true if the score exceeds the threshold
  return score >= 4;
}

// Handle file upload
async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  fileName.value = f.name
  text.value = ''
  
  isLoading.value = true
  
  try {
    // Check if user is authenticated before attempting to save
    const isUserAuthenticated = auth.state.isAuthenticated && auth.state.user && auth.state.user.userId;
    let fileContent = '';
    
    if (f.name.toLowerCase().endsWith('.docx')) {
      const buf = await f.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
      fileContent = value.trim();
      extracted.value = fileContent;
      
      // Auto-process the document to extract quiz questions if content is available
      if (extracted.value) {
        const extractedQuestions = processDocumentContent(extracted.value)
        
        if (extractedQuestions && extractedQuestions.length > 0) {
          questions.value = extractedQuestions
          console.log('Extracted questions automatically:', questions.value)
          
          // Set a default quiz name based on the filename
          quizName.value = f.name.replace(/\.docx$/i, '').replace(/[_-]/g, ' ')
          
          // Auto-save if user is logged in
          if (isUserAuthenticated) {
            try {
              // Save the source document first
              const sourceDoc = await createSourceDoc({
                user_id: auth.state.user!.userId,
                content: fileContent,
                title: fileName.value,
                file_type: 'docx'
              });
              console.log("Source document saved with ID:", sourceDoc.id);
              
              // Then save the quiz
              const savedQuizId = await saveQuizToDatabase(quizName.value, questions.value.length, sourceDoc.id)
              console.log("Quiz auto-saved with ID:", savedQuizId)
              currentQuizId.value = savedQuizId
            } catch (error) {
              console.error('Error auto-saving extracted quiz:', error)
            }
          }
        }
      }
    } else {
      fileContent = await f.text();
      extracted.value = fileContent.trim();
      
      // Save the source document if user is authenticated
      if (isUserAuthenticated) {
        try {
          const sourceDoc = await createSourceDoc({
            user_id: auth.state.user!.userId,
            content: fileContent,
            title: fileName.value,
            file_type: f.name.split('.').pop() || 'txt'
          });
          console.log("Source document saved with ID:", sourceDoc.id);
        } catch (error) {
          console.error('Error saving source document:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error processing file:', error)
    alert('Error processing the file. Please try a different file or paste content directly.')
  } finally {
    isLoading.value = false
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

  // Validate input content length
  if (src.length < 100) {
    alert('Please provide more content to generate meaningful questions. At least 100 characters are required.')
    return
  }

  // Make sure we have a prompt when not auto-generating
  if (!autoGeneratePrompt.value && !customPrompt.value.trim()) {
    alert('Please enter a prompt or enable auto-generate prompt')
    return
  }

  // Validate question count is within reasonable limits
  if (count.value < 1) {
    alert('Please set the question count to at least 1')
    count.value = 1
    return
  }

  if (count.value > 20) {
    alert('Please limit the question count to 20 or fewer for best results')
    count.value = 20
    return
  }

  isLoading.value = true
  generationStep.value = 'Analyzing content...'
  generationProgress.value = 0.05
  
  try {
    // Detect the language of the content
    console.log("Detecting language...")
    generationStep.value = 'Detecting language...'
    generationProgress.value = 0.15
    
    const detectedLanguage = await detectLanguage(src)
    console.log("Detected language:", detectedLanguage)
    
    // Create a map of language codes to language names for better prompting
    const languageNames: Record<string, string> = {
      "en": "English",
      "es": "Spanish",
      "fr": "French",
      "de": "German",
      "it": "Italian",
      "pt": "Portuguese",
      "ru": "Russian",
      "zh": "Chinese",
      "ja": "Japanese",
      "ko": "Korean",
      "ar": "Arabic",
      "hi": "Hindi",
      "cs": "Czech",
      "sk": "Slovak",
      "pl": "Polish",
      "hu": "Hungarian",
      // Add more languages as needed
    }
    
    const languageName = languageNames[detectedLanguage] || "the same language as the provided content"
    
    generationStep.value = 'Preparing quiz generation...'
    generationProgress.value = 0.25
    
    // First get available categories for the AI to classify the content
    let categoryOptions = 'General Knowledge' // Default fallback
    if (categories.value.length > 0) {
      categoryOptions = categories.value.map(cat => `${cat.id}. ${cat.category_name}`).join(', ')
    }
    
    // Detect if content appears to be educational/technical material with detailed explanations
    generationStep.value = 'Analyzing content type...'
    generationProgress.value = 0.3
    
    const isEducationalMaterial = detectEducationalMaterial(src)
    console.log("Content appears to be educational material:", isEducationalMaterial)
    
    // Choose appropriate system prompt based on content type and question type
    generationStep.value = 'Crafting optimal prompt...'
    generationProgress.value = 0.35
    
    let systemPrompt = ''
    
    if (isEducationalMaterial) {
      // Use enhanced prompts for educational/technical material
      if (type.value === 'tf') {
        systemPrompt = `You are a specialized quiz generator for educational content in ${languageName}. Analyze the following technical/academic material.

Output ONLY a JSON object with two fields: "questions" and "category".
The "questions" field contains an array of true/false quiz objects. Each object must have:
1. A "question" field ending with "True or False?"
2. An "options" array ALWAYS containing exactly ["True", "False"] (translated to ${languageName} if needed)
3. An "answerIndex" field (0 for True, 1 for False)
4. An "explanation" field that preserves the detailed explanations from the source material

The "category" field should contain the ID of the most appropriate category from: ${categoryOptions}.

When creating questions:
- Extract key facts and concepts directly from the material
- Preserve the technical accuracy and depth of the original explanations
- For definition questions, maintain the structure of multi-part definitions
- Aim for the complexity level matching the source material
- Ensure all text is in ${languageName}`
      } else {
        systemPrompt = `You are a specialized quiz generator for educational content in ${languageName}. Analyze the following technical/academic material.

Output ONLY a JSON object with two fields: "questions" and "category".
The "questions" field contains an array of quiz objects. Each object must have:
1. A clear "question" that tests understanding of important concepts
2. An "options" array with 4 plausible choices (labeled A, B, C, D if appropriate)
3. An "answerIndex" field (zero-based index of correct answer)
4. An "explanation" field that preserves the detailed explanations from the source material

The "category" field should contain the ID of the most appropriate category from: ${categoryOptions}.

When creating questions:
- Extract key facts, definitions, and relationships directly from the material
- For multiple-choice questions, include distractors that represent common misconceptions
- Preserve the technical accuracy and depth of the original explanations
- For definition questions, maintain the structure of multi-part definitions
- Match the complexity level of the source material
- Ensure all text is in ${languageName}`
      }
    } else {
      // Use standard prompts for general content
      if (type.value === 'tf') {
        systemPrompt = `You output ONLY a JSON object with two fields: "questions" and "category". 
The "questions" field contains an array of true/false quiz objects. Each object must have a question field ending with "True or False?", options array ALWAYS containing exactly ["True", "False"], answerIndex (0 for True, 1 for False), and explanation field explaining why this answer is correct.
The "category" field should contain the ID of the most appropriate category for this quiz content from the following options: ${categoryOptions}.
Generate all questions and explanations in ${languageName} to match the source content language.
For True/False questions, translate "True" and "False" into the appropriate words in ${languageName}.
No extra text.`
      } else {
        systemPrompt = `You output ONLY a JSON object with two fields: "questions" and "category".
The "questions" field contains an array of quiz objects. Each object must have a question, options array, answerIndex (zero-based index of correct answer in options array), and explanation field explaining why this answer is correct.
The "category" field should contain the ID of the most appropriate category for this quiz content from the following options: ${categoryOptions}.
Generate all questions, options, and explanations in ${languageName} to match the source content language.
No extra text.`
      }
    }
    
    // User prompt is now either auto-generated or comes from the customPrompt field
    let userPrompt = ''
    
    if (autoGeneratePrompt.value) {
      // Try to generate a prompt for the user automatically
      generationStep.value = 'Creating custom prompt from content...'
      generationProgress.value = 0.4
      
      try {
        const generatedPrompt = await generatePromptFromContent(src)
        if (generatedPrompt) {
          customPrompt.value = generatedPrompt
          userPrompt = generatedPrompt
        }
      } catch (error) {
        console.error("Error auto-generating prompt:", error)
        // Fall back to a simple prompt if generation fails
        userPrompt = `Generate ${count.value} ${type.value} questions (difficulty: ${difficulty.value}) from this content in ${languageName}.`
      }
    } else {
      // Use the custom prompt directly
      userPrompt = customPrompt.value.trim()
    }
    
    // Add formatting instructions for the expected output
    userPrompt += `\n\nGenerate ${count.value} questions about the following content. Return a JSON object with "questions" and "category" fields. Generate all content in ${languageName}.\nDifficulty level: ${difficulty.value}`
    
    // Append the source content
    userPrompt += `\n\n"""\n${src}\n"""`
    
    // Save source content if the user is authenticated
    generationStep.value = 'Saving source content...'
    generationProgress.value = 0.45
    
    let sourceDocId = null
    if (auth.state.isAuthenticated && auth.state.user) {
      try {
        // Determine if we're using a file or text input
        const isUsingFileContent = extracted.value.trim() === src
        const fileType = isUsingFileContent ? (fileName.value.split('.').pop() || 'txt') : 'text'
        const title = isUsingFileContent ? fileName.value : 'Text Input'
        
        // Save to SourceDocs table
        const sourceDoc = await createSourceDoc({
          user_id: auth.state.user.userId,
          content: src,
          title: title,
          file_type: fileType
        })
        
        console.log("Source document saved with ID:", sourceDoc.id)
        sourceDocId = sourceDoc.id
      } catch (error) {
        console.error('Error saving source document:', error)
        // Continue with generation even if saving fails
      }
    }
    
    const msgs: ChatCompletionRequestMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ]
    
    // Log the prompts being used (for debugging)
    console.log('Using system prompt:', systemPrompt)
    console.log('Using user prompt:', userPrompt)
    
    generationStep.value = `Generating ${count.value} ${difficulty.value} difficulty ${type.value === 'mcq' ? 'multiple-choice' : 'true/false'} questions...`
    generationProgress.value = 0.5
    
    let raw = await chat(msgs)
    
    console.log('Raw API response:', raw)
    
    generationStep.value = 'Processing AI response...'
    generationProgress.value = 0.8
    
    // Try to safely extract the JSON
    raw = raw.trim()
    
    // Remove any code fence markers (```json or ```) 
    raw = raw.replace(/^```(?:json)?\s*/g, '')
    raw = raw.replace(/\s*```$/g, '')
    raw = raw.trim()
    
    // Parse the JSON response (now expecting an object with questions array and category)
    try {
      const parsedResponse = JSON.parse(raw)
      console.log('Parsed response:', parsedResponse)
      
      generationStep.value = 'Preparing quiz content...'
      generationProgress.value = 0.9
      
      // Extract questions array and category
      if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
        questions.value = parsedResponse.questions
        console.log('Parsed questions:', questions.value)
        
        // Extract and validate category
        if (parsedResponse.category !== undefined) {
          // Find the category by ID in our categories array
          const categoryId = Number(parsedResponse.category)
          const foundCategory = categories.value.find(cat => cat.id === categoryId)
          
          if (foundCategory) {
            suggestedCategory.value = foundCategory.id
            console.log('Suggested category:', foundCategory.category_name, '(ID:', foundCategory.id, ')')
          } else {
            // If category ID is invalid, use default
            suggestedCategory.value = categories.value.length > 0 ? categories.value[0].id : 1
            console.log('Invalid category ID returned, using default:', suggestedCategory.value)
          }
        }
        
        generationStep.value = 'Finalizing quiz...'
        generationProgress.value = 0.95
        
        // Auto-save the quiz with a default name
        if (auth.state.isAuthenticated && auth.state.user) {
          quizName.value = "Untitled Quiz"
          const savedQuizId = await saveQuizToDatabase(quizName.value, questions.value.length, sourceDocId)
          console.log("Quiz auto-saved with ID:", savedQuizId)
          currentQuizId.value = savedQuizId
        }
      } else {
        throw new Error('No questions array found in the response')
      }
    } catch (error) {
      const jsonError = error as Error
      console.error('JSON parse error:', jsonError)
      throw new Error(`Failed to parse JSON: ${jsonError.message}`)
    }
    
    generationStep.value = 'Quiz generated successfully!'
    generationProgress.value = 1.0
  } catch (err) {
    const error = err as Error
    console.error('Generation error:', error)
    generationStep.value = `Error: ${error.message || 'Failed to generate questions'}`
    alert(`Error: ${error.message || 'Failed to generate questions'}`)
  } finally {
    // Small delay to show the final success message
    setTimeout(() => {
      isLoading.value = false
      generationStep.value = ''
      generationProgress.value = 0
    }, 1000)
  }
}

function editQuiz(index: number) {
  // Navigate to the quiz editor for the selected question
  router.push(`/quiz/${currentQuizId.value}/edit/${index}`);
}

// Navigate to the full quiz editor page
function editEntireQuiz() {
  // Ensure we have a quiz ID first
  if (!currentQuizId.value) {
    // If the quiz hasn't been saved yet, save it first
    saveQuizToDatabase(quizName.value || "Untitled Quiz", questions.value.length)
      .then(quizId => {
        currentQuizId.value = quizId
        router.push(`/quiz/${quizId}/edit`)
      })
      .catch(error => {
        console.error('Error saving quiz before editing:', error)
        alert('Failed to save quiz. Please try again.')
      })
  } else {
    // Navigate to the quiz editor
    router.push(`/quiz/${currentQuizId.value}/edit`)
  }
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

async function startQuiz() {
  if (!quizName.value.trim()) {
    quizName.value = "Untitled Quiz"
  }
  
  // Save the quiz to the database before taking it
  if (auth.state.isAuthenticated && auth.state.user) {
    try {
      // Save the quiz to the database
      await saveQuizToDatabase(quizName.value, questions.value.length)
      console.log("Quiz saved to database before starting it")
    } catch (error) {
      console.error("Error saving quiz before starting:", error)
    }
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

// Save quiz and view details
async function saveAndViewQuiz() {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    alert('You must be logged in to save quizzes')
    return
  }
  
  try {
    if (!currentQuizId.value) {
      // If not already saved, save it first
      const savedQuizId = await saveQuizToDatabase(quizName.value || "Untitled Quiz", questions.value.length)
      currentQuizId.value = savedQuizId
      console.log("Created new quiz with ID:", savedQuizId)
    } else if (quizName.value) {
      // Quiz already exists, update the name
      console.log("Updating quiz name to:", quizName.value, "for quiz ID:", currentQuizId.value)
      
      // Update the quiz using Supabase
      await updateQuiz(currentQuizId.value, {
        title: quizName.value,
        updated_at: new Date().toISOString()
      })
      
      console.log(`Updated quiz name to: ${quizName.value}`)
    }
    
    // Navigate to quiz details page
    router.push(`/quiz/${currentQuizId.value}/details`)
    
  } catch (error) {
    console.error('Error saving quiz:', error)
    alert('Failed to save the quiz. Please try again.')
  }
}

/**
 * Process document content to extract quiz questions
 * Looks for patterns typically found in educational documents:
 * - Multiple choice questions with lettered options (A, B, C, D)
 * - True/False questions
 * - Fill-in-the-blank questions with underscores
 */
function processDocumentContent(content: string) {
  if (!content) return [];
  
  // Initialize array to hold extracted questions
  const questions: any[] = [];
  
  // Split text into lines
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Process for question patterns
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Pattern 1: Check for numbered/lettered questions
    const questionPattern = /^([0-9]+[\.\)]|[A-Z][\.\)])\s+(.+)$/;
    const questionMatch = line.match(questionPattern);
    
    if (questionMatch) {
      const questionText = questionMatch[2].trim();
      
      // Look for a question mark to confirm it's likely a question
      if (questionText.includes('?')) {
        const questionObj: any = {
          question: questionText,
          options: [],
          explanation: "Auto-extracted from document."
        };
        
        let optionIndex = 0;
        let j = i + 1;
        const options: string[] = [];
        let correctAnswerIndex = -1;
        
        // Look ahead for option patterns
        while (j < lines.length && j < i + 6) {
          const optionLine = lines[j].trim();
          
          // Check for multiple choice options: A), B), C), etc.
          const optionPattern = /^([A-Z])[\.\)]\s+(.+)$/;
          const optionMatch = optionLine.match(optionPattern);
          
          if (optionMatch) {
            const optionText = optionMatch[2].trim();
            
            // Check for correct answer markers like *, (correct), etc.
            const isCorrect = optionLine.includes('*') || 
                             optionLine.toLowerCase().includes('(correct)') ||
                             optionLine.toLowerCase().includes('[correct]');
            
            // Clean the option text
            const cleanOption = optionText
              .replace(/\*|\(correct\)|\[correct\]/gi, '')
              .trim();
            
            options.push(cleanOption);
            
            if (isCorrect) {
              correctAnswerIndex = optionIndex;
            }
            
            optionIndex++;
            j++;
          } 
          // Check for True/False pattern
          else if (optionLine.toLowerCase().includes('true') && 
                   j + 1 < lines.length && 
                   lines[j + 1].trim().toLowerCase().includes('false')) {
            
            // True False question has been identified
            questionObj.options = ['True', 'False'];
            
            // Check which one is marked correct
            const trueIsCorrect = optionLine.includes('*') || 
                                 optionLine.toLowerCase().includes('(correct)');
            const falseIsCorrect = lines[j + 1].trim().includes('*') || 
                                  lines[j + 1].trim().toLowerCase().includes('(correct)');
            
            if (trueIsCorrect) {
              questionObj.answerIndex = 0;
            } else if (falseIsCorrect) {
              questionObj.answerIndex = 1;
            } else {
              // Default to first option if no correct answer is marked
              questionObj.answerIndex = 0;
            }
            
            questions.push(questionObj);
            i = j + 1; // Move main loop past these options
            break;
          } else {
            break;
          }
        }
        
        // If we found multiple choice options
        if (options.length > 0) {
          questionObj.options = options;
          
          // If no correct answer was marked, default to first option
          questionObj.answerIndex = correctAnswerIndex >= 0 ? correctAnswerIndex : 0;
          
          questions.push(questionObj);
          i = j - 1; // Move main loop past these options
        }
        // Check for fill-in-the-blank style questions
        else if (questionText.includes('___') || questionText.includes('....')) {
          questionObj.type = 'fill_blank';
          
          // Look for the answer on the next line
          if (j < lines.length) {
            const answerLine = lines[j].trim();
            if (answerLine.toLowerCase().startsWith('answer:') || 
                answerLine.toLowerCase().startsWith('a:')) {
              
              const answer = answerLine
                .replace(/^(answer:|a:)/i, '')
                .trim();
              
              questionObj.answerText = answer;
              
              questions.push(questionObj);
              i = j; // Move past the answer line
            }
          }
        }
      }
    }
    
    // Pattern 2: Check for explicitly labeled "Question" lines
    else if (line.toLowerCase().startsWith('question') || line.toLowerCase().includes('q:')) {
      const questionText = line
        .replace(/^question|q:/i, '')
        .trim();
      
      if (questionText) {
        const questionObj: any = {
          question: questionText,
          explanation: "Auto-extracted from document."
        };
        
        // Look for "Answer" in the next few lines
        let j = i + 1;
        
        while (j < lines.length && j < i + 5) {
          const nextLine = lines[j].trim();
          
          if (nextLine.toLowerCase().startsWith('a)') || 
              nextLine.toLowerCase().startsWith('a.')) {
            // Start of multiple choice options detected
            const options: string[] = [];
            let correctIndex = -1;
            let optionIndex = 0;
            
            // Process each option
            while (j < lines.length && options.length < 5) {
              const optionLine = lines[j].trim();
              const optionMatch = optionLine.match(/^([a-d])[\.\)]\s+(.+)$/i);
              
              if (optionMatch) {
                const optionText = optionMatch[2].trim();
                const isCorrect = optionLine.includes('*') || 
                                 optionLine.toLowerCase().includes('(correct)');
                
                options.push(optionText.replace(/\*|\(correct\)/gi, '').trim());
                
                if (isCorrect) {
                  correctIndex = optionIndex;
                }
                
                optionIndex++;
                j++;
              } else {
                break;
              }
            }
            
            if (options.length > 0) {
              questionObj.options = options;
              questionObj.answerIndex = correctIndex >= 0 ? correctIndex : 0;
              questions.push(questionObj);
              i = j - 1;
              break;
            }
          }
          else if (nextLine.toLowerCase().startsWith('answer') || 
                  nextLine.toLowerCase() === 'a:') {
            // Answer found (likely for fill-in-blank or short answer)
            const answer = nextLine
              .replace(/^(answer:|a:)/i, '')
              .trim();
            
            // If answer is True or False, treat as True/False question
            if (answer.toLowerCase() === 'true' || answer.toLowerCase() === 'false') {
              questionObj.options = ['True', 'False'];
              questionObj.answerIndex = answer.toLowerCase() === 'true' ? 0 : 1;
            } else {
              // Treat as fill-in-blank
              questionObj.type = 'fill_blank';
              questionObj.answerText = answer;
            }
            
            questions.push(questionObj);
            i = j;
            break;
          }
          
          j++;
        }
      }
    }
  }
  
  // Format the extracted questions to match the expected structure
  return questions.map(q => {
    // Ensure all questions have required fields
    if (!q.options) {
      q.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      q.answerIndex = 0;
    }
    
    if (q.type === 'fill_blank' && q.answerText) {
      // For fill-in-blank, create plausible wrong answers
      const correctAnswer = q.answerText;
      
      // Create options array with the correct answer and some variations
      q.options = [
        correctAnswer,
        correctAnswer.length > 3 ? correctAnswer.slice(0, -2) + (correctAnswer.endsWith('s') ? '' : 's') : 'Blank',
        correctAnswer.length > 4 ? correctAnswer.replace(/[aeiou]/i, '*') : 'Unknown',
        'None of the above'
      ];
      
      q.answerIndex = 0; // First option is correct
      delete q.answerText;
    }
    
    // Convert question to correct expected format
    return {
      question: q.question,
      options: q.options,
      answerIndex: q.answerIndex,
      explanation: q.explanation || "Auto-extracted from document content."
    };
  });
}

async function saveQuizAttempt(title: string, score: number, totalQuestions: number, elapsedTime: number) {
  try {
    console.log('Starting saveQuizAttempt with:', { title, userId: auth.state.user!.userId });
    
    if (!currentQuizId.value) {
      // Quiz doesn't exist yet, create it first
      currentQuizId.value = await saveQuizToDatabase(title, totalQuestions);
    }
    
    // Calculate pass/fail status
    const isPassed = score / totalQuestions >= 0.6;
    
    // Create the quiz attempt
    const startTime = new Date();
    startTime.setSeconds(startTime.getSeconds() - elapsedTime);
    
    const attemptData = {
      quiz_id: currentQuizId.value,
      user_id: auth.state.user!.userId,
      score: score,
      total_questions: totalQuestions,
      started_at: startTime.toISOString(),
      completed_at: new Date().toISOString(),
      elapsed_time: elapsedTime,
      is_passed: isPassed
    };
    
    const newAttempt = await createQuizAttempt(attemptData);
    const attemptId = newAttempt.id;
    
    console.log('Created attempt with ID:', attemptId);
    
    // Save the user's answers
    const answerPromises = [];
    
    for (let i = 0; i < questions.value.length; i++) {
      const questionId = questions.value[i].questionId; // This will be set when getting questions
      const userAnswer = userAnswers.value[i];
      
      if (userAnswer !== undefined && questionId) {
        const isCorrect = userAnswer === questions.value[i].answerIndex;
        
        // Get the option ID - we might need to refactor this depending on data structure
        const optionId = questions.value[i].optionIds ? 
          questions.value[i].optionIds[userAnswer] : null;
        
        if (optionId) {
          const attemptAnswer = {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option_id: optionId,
            is_correct: isCorrect
          };
          
          answerPromises.push(createAttemptAnswers([attemptAnswer]));
        }
      }
    }
    
    if (answerPromises.length > 0) {
      await Promise.all(answerPromises);
    }
    
    console.log('Quiz attempt saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
}

// Handle confirmation modal actions
function confirmAction() {
  if (confirmActionCallback.value) {
    confirmActionCallback.value();
  }
  showConfirmation.value = false;
}

// Handle cancellation of the confirmation dialog
function cancelConfirmation() {
  showConfirmation.value = false;
}

/**
 * Save a quiz to the database
 * @param title The title of the quiz
 * @param questionCount The number of questions in the quiz
 * @param sourceDocId Optional ID of the source document
 * @returns Promise that resolves to the new quiz ID
 */
async function saveQuizToDatabase(title: string, questionCount: number, sourceDocId: number | null = null): Promise<number> {
  try {
    if (!auth.state.isAuthenticated || !auth.state.user) {
      throw new Error('User must be logged in to save quizzes');
    }
    
    // Verify the user exists in the database
    try {
      const { data: userCheck, error: userCheckError } = await supabase
        .from('Users')
        .select('id, username')
        .eq('id', auth.state.user.userId)
        .single();
      
      if (userCheckError || !userCheck) {
        console.error('User ID verification failed:', userCheckError);
        throw new Error('User not found in database. Please log out and log in again.');
      }
    } catch (verifyError) {
      console.error('Error verifying user:', verifyError);
      throw new Error('Could not verify user in database');
    }
    
    // Ensure quiz title is valid
    const finalTitle = title.trim() || "Untitled Quiz";
    
    // Convert difficulty to proper case
    const difficultyProperCase = difficulty.value.charAt(0).toUpperCase() + difficulty.value.slice(1).toLowerCase();
    
    // Use the owner ID
    const ownerId = auth.state.user.userId;
    
    console.log('Creating quiz with data:', {
      title: finalTitle,
      owner_id: ownerId,
      category_id: suggestedCategory.value,
      difficulty: difficultyProperCase,
      source_doc_id: sourceDocId || null
    });
    
    // Create the quiz with additional debugging
    try {
      const quizData = {
        owner_id: ownerId,
        category_id: suggestedCategory.value,
        title: finalTitle,
        description: `Generated quiz with ${questionCount} questions`,
        difficulty: difficultyProperCase,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        is_deleted: false,
        source_doc_id: sourceDocId || null
      };
      
      const { data: newQuiz, error: quizError } = await supabase
        .from('Quizzes')
        .insert(quizData)
        .select()
        .single();
      
      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw new Error(`Failed to create quiz: ${quizError.message}`);
      }
      
      if (!newQuiz || !newQuiz.id) {
        throw new Error('Quiz created but no ID returned');
      }
      
      const quizId = newQuiz.id;
      console.log('Successfully created quiz with ID:', quizId);
      
      // Store questions and options
      for (let i = 0; i < questions.value.length; i++) {
        const question = questions.value[i];
        
        // Create question
        const questionData = {
          quiz_id: quizId,
          question_text: question.question,
          question_type: type.value === 'mcq' ? 'multiple_choice' : 'true_false',
          difficulty: difficultyProperCase,
          points: 1,
          created_at: new Date().toISOString(),
          is_active: true
        };
        
        const { data: newQuestion, error: questionError } = await supabase
          .from('Questions')
          .insert(questionData)
          .select()
          .single();
          
        if (questionError) {
          console.error(`Error creating question #${i+1}:`, questionError);
          continue;
        }
        
        const questionId = newQuestion.id;
        
        // Save question to object for future reference
        questions.value[i].questionId = questionId;
        
        // Create answer options
        const options = [];
        const optionIds = [];
        
        for (let j = 0; j < question.options.length; j++) {
          const optionText = question.options[j];
          const isCorrect = j === question.answerIndex;
          
          // Create option object
          options.push({
            question_id: questionId,
            answer_text: optionText,
            is_correct: isCorrect,
            created_at: new Date().toISOString()
          });
        }
        
        // Batch insert options
        if (options.length > 0) {
          const { data: newOptions, error: optionsError } = await supabase
            .from('AnswerOptions')
            .insert(options)
            .select();
          
          if (optionsError) {
            console.error(`Error creating options for question #${i+1}:`, optionsError);
          } else if (newOptions) {
            // Save option IDs for future reference
            questions.value[i].optionIds = newOptions.map(opt => opt.id);
          }
        }
      }
      
      return quizId;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Safely check if dbError has a response property with data
      const error = dbError as any; // Type assertion to allow property access
      if (error && error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

// Add new state for tracking generation progress
const generationStep = ref<string>('')
const generationProgress = ref<number>(0)
</script>
```
````

<template>
    <div class="generate">
      <h2 class="page-title">Generate a Quiz</h2>
  
      <!-- 1) Mode toggle -->
      <div class="section toggle-section">
        <ModeToggle v-model="isFileMode" />
      </div>
  
      <!-- 2) Text‑area (always shown if no file) -->
      <div v-if="!isFileMode || !fileName" class="section content-section">
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
          >
            ×
          </button>
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
            <select
              id="quiz-difficulty"
              v-model="difficulty"
              class="select-input"
            >
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
          <button class="export-btn" @click="exportCSV">
            Export CSV
          </button>
        </div>
        <ul class="question-list">
          <li
            v-for="(q, i) in questions"
            :key="i"
            class="question-item"
          >
            <div class="question-header">
              <strong class="question-number">Q{{ i + 1 }}:</strong>
              <span class="question-text">{{ q.question }}</span>
            </div>
            <ul v-if="q.options" class="options-list">
              <li
                v-for="(opt, j) in q.options"
                :key="j"
                class="option-item"
              >
                <span class="option-text">{{ opt }}</span>
                <span
                  v-if="j === q.answerIndex"
                  class="correct-indicator"
                >
                  ✓
                </span>
              </li>
            </ul>
            <button class="remove-btn" @click="remove(i)">
              Remove
            </button>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import '@/assets/generate.css'
  import { ref, watch } from 'vue'
  import mammoth from 'mammoth'
  import { chat, type ChatCompletionRequestMessage } from '@/api/openai'
  import ModeToggle from '@/components/ModeToggle.vue'
  
  const isFileMode  = ref(false)
  const text        = ref('')
  const extracted   = ref('')
  const fileName    = ref('')
  const type        = ref<'mcq'|'tf'|'fill'>('mcq')
  const count       = ref(5)
  const difficulty  = ref<'easy'|'medium'|'hard'>('medium')
  const isLoading   = ref(false)
  const questions   = ref<any[]>([])
  
  // When switching off file‐mode, clear file input
  watch(isFileMode, (mode) => {
    if (!mode) {
      extracted.value = ''
      fileName.value  = ''
      const fi = document.getElementById('file-input') as HTMLInputElement
      if (fi) fi.value = ''
    }
  })
  
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
  
  function clearFile() {
    extracted.value = ''
    fileName.value  = ''
    const fi = document.getElementById('file-input') as HTMLInputElement
    if (fi) fi.value = ''
  }
  
  async function generate() {
    const src = extracted.value.trim() || text.value.trim()
    if (!src) {
      alert('Please paste text or upload a file before generating.')
      return
    }
  
    isLoading.value = true
    const systemPrompt = `You output ONLY a JSON array of quiz objects.`
    const userPrompt   = `Generate ${count.value} ${type.value} questions (difficulty: ${difficulty.value}) from this text. Respond with a valid JSON array only:
  
  """
  ${src}
  """`
  
    try {
      const msgs: ChatCompletionRequestMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt }
      ]
      const raw = await chat(msgs)
      questions.value = JSON.parse(raw)
    } catch (e: any) {
      alert('Error: ' + e.message)
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
  </style>
  
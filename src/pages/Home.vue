<template>
    <section class="home">
      <h2>Abstract</h2>
      <p>
        Hlavním cílem této bakalářské práce je vytvoření kompletní aplikace, která
        s využitím umělé inteligence vygeneruje kvízové otázky na základě zadaného
        textu či vloženého souboru a následného hodnocení z hlediska kvality a relevance.
      </p>
      <h2>Úvod</h2>
      <p>
        Automatizovaná tvorba kvízových otázek je v současnosti velmi aktuální téma
        díky rostoucí potřebě efektivních vzdělávacích nástrojů. S rozšiřujícím se
        využitím online vzdělávacích platforem narůstá poptávka po způsobech, jak
        rychle a spolehlivě ověřovat porozumění studentů danému učivu.
      </p>
      
      <!-- Database tables section -->
      <h2>Database Tables</h2>
      <p>The app uses the following database tables:</p>
      <ul>
        <li v-for="table in tables" :key="table">{{ table }}</li>
      </ul>

      <!-- Users section -->
      <h2>Registered Users</h2>
      <p>The following users are registered in the system:</p>
      <div v-if="isLoading" class="loading">Loading users...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="users.length === 0" class="no-users">No users found in the database.</div>
      <div v-else class="users-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.user_id">
              <td>{{ user.user_id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role_name }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { getDB, saveDB } from '@/db/index.ts'
  
  // Content adapted from your thesis :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
  const tables = ref<string[]>([])
  const users = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref('')

  // Format date for better readability
  function formatDate(dateString: string) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  onMounted(async () => {
    // Get database tables
    const db = await getDB()
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    if (res.length) {
      tables.value = res[0].values.map(v => v[0] as string)
    }
    
    // Get users data
    isLoading.value = true
    try {
      const userQuery = `
        SELECT 
          u.user_id, 
          u.username, 
          u.email, 
          r.role_name, 
          u.created_at
        FROM 
          Users u
        LEFT JOIN 
          Roles r ON u.role_id = r.role_id
        WHERE 
          u.is_active = 1
        ORDER BY 
          u.user_id ASC
      `
      const usersResult = db.exec(userQuery)
      if (usersResult.length) {
        const columns = usersResult[0].columns
        users.value = usersResult[0].values.map(row => {
          const user: any = {}
          columns.forEach((col, index) => {
            user[col] = row[index]
          })
          return user
        })
      }
      
      // Ensure the database is saved to localStorage after the query
      // This helps when initial users are seeded
      saveDB()
      
    } catch (err: any) {
      console.error('Error fetching users:', err)
      error.value = 'Failed to load users: ' + (err.message || 'Unknown error')
    } finally {
      isLoading.value = false
    }
  })
  </script>
  
  <style scoped>
  .home {
    padding: 1rem;
    line-height: 1.6;
    color: var(--text-main);
  }
  .home h2 {
    margin-top: 1.5rem;
    color: var(--accent);
  }

  /* Users table styles */
  .users-list {
    margin-top: 1rem;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--input-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--input-border);
  }

  th {
    background: rgba(255, 255, 255, 0.08);
    font-weight: 600;
    color: var(--accent);
    white-space: nowrap;
  }

  tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.03);
  }

  tr:hover {
    background: rgba(61, 220, 132, 0.1);
  }

  .loading, .error, .no-users {
    margin: 2rem 0;
    padding: 1rem;
    border-radius: var(--radius-sm);
    text-align: center;
  }

  .loading {
    background: rgba(255, 255, 255, 0.05);
  }

  .error {
    background: rgba(255, 89, 89, 0.1);
    color: rgb(255, 89, 89);
  }

  .no-users {
    background: rgba(255, 200, 0, 0.1);
    color: rgb(255, 200, 0);
  }
  </style>

<!-- src/pages/Admin.vue -->
<template>
  <div class="admin-page">
    <h1 class="page-title">Admin Dashboard</h1>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading admin data...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
      </div>
      <p>{{ error }}</p>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="admin-dashboard">
      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ 'active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- Users Management Tab -->
        <div v-if="activeTab === 'users'" class="admin-section">
          <h2 class="section-title">Users Management</h2>
          
          <div class="search-bar">
            <input 
              type="text" 
              v-model="userSearchQuery" 
              placeholder="Search users by username or email..." 
              class="search-input"
            >
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td data-label="ID">{{ user.id }}</td>
                  <td data-label="Username">{{ user.username }}</td>
                  <td data-label="Email">{{ user.email }}</td>
                  <td data-label="Role">
                    <select 
                      v-model="user.roleId" 
                      @change="updateUserRole(user.id, user.roleId)"
                      class="role-select"
                    >
                      <option v-for="role in roles" :key="role.id" :value="role.id">
                        {{ role.roleName }}
                      </option>
                    </select>
                  </td>
                  <td data-label="Created">{{ formatDate(user.createdAt) }}</td>
                  <td data-label="Status">
                    <span class="status-badge" :class="user.isActive ? 'active' : 'inactive'">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td data-label="Actions" class="actions-cell">
                    <button 
                      @click="confirmToggleUserStatus(user)" 
                      class="action-btn"
                      :class="user.isActive ? 'deactivate-btn' : 'activate-btn'"
                    >
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quizzes Management Tab -->
        <div v-if="activeTab === 'quizzes'" class="admin-section">
          <h2 class="section-title">Quizzes Management</h2>
          
          <div class="search-bar">
            <input 
              type="text" 
              v-model="quizSearchQuery" 
              placeholder="Search quizzes by title..." 
              class="search-input"
            >
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Questions</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="quiz in filteredQuizzes" :key="quiz.id">
                  <td data-label="ID">{{ quiz.id }}</td>
                  <td data-label="Title">{{ quiz.title }}</td>
                  <td data-label="Owner">{{ quiz.ownerUsername }}</td>
                  <td data-label="Questions">{{ quiz.questionCount }}</td>
                  <td data-label="Created">{{ formatDate(quiz.createdAt) }}</td>
                  <td data-label="Status">
                    <span class="status-badge" :class="{ 'active': !quiz.isDeleted }">
                      {{ quiz.isDeleted ? 'Deleted' : 'Active' }}
                    </span>
                  </td>
                  <td data-label="Actions" class="actions-cell">
                    <button 
                      @click="confirmToggleQuizStatus(quiz)" 
                      class="action-btn"
                      :class="quiz.isDeleted ? 'activate-btn' : 'deactivate-btn'"
                    >
                      {{ quiz.isDeleted ? 'Restore' : 'Delete' }}
                    </button>
                    <button @click="viewQuiz(quiz.id)" class="action-btn view-btn">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Categories Management Tab -->
        <div v-if="activeTab === 'categories'" class="admin-section">
          <h2 class="section-title">Categories Management</h2>
          
          <div class="category-form">
            <div class="form-group">
              <input 
                type="text" 
                v-model="newCategory" 
                placeholder="New category name" 
                class="form-input"
              >
              <button 
                @click="addCategory" 
                class="action-btn"
                :disabled="!newCategory.trim()"
              >
                Add Category
              </button>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Quizzes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="category in categories" :key="category.id">
                  <td data-label="ID">{{ category.id }}</td>
                  <td data-label="Name">
                    <span v-if="!category.isEditing">{{ category.name }}</span>
                    <input 
                      v-else
                      type="text" 
                      v-model="category.editName" 
                      class="edit-input"
                    >
                  </td>
                  <td data-label="Quizzes">{{ category.quizCount }}</td>
                  <td data-label="Actions" class="actions-cell">
                    <template v-if="!category.isEditing">
                      <button @click="startEditCategory(category)" class="action-btn">
                        Edit
                      </button>
                      <button 
                        @click="confirmDeleteCategory(category)" 
                        class="action-btn deactivate-btn"
                        :disabled="category.quizCount > 0"
                      >
                        Delete
                      </button>
                    </template>
                    <template v-else>
                      <button @click="saveCategory(category)" class="action-btn">
                        Save
                      </button>
                      <button @click="cancelEditCategory(category)" class="action-btn">
                        Cancel
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Statistics Tab -->
        <div v-if="activeTab === 'stats'" class="admin-section">
          <h2 class="section-title">System Statistics</h2>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">Total Users</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalQuizzes }}</div>
              <div class="stat-label">Total Quizzes</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalAttempts }}</div>
              <div class="stat-label">Quiz Attempts</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ stats.activeUsers }}</div>
              <div class="stat-label">Active Users</div>
            </div>
          </div>

          <h3 class="subsection-title">Recent Activity</h3>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(activity, index) in recentActivity" :key="index">
                  <td data-label="Activity">{{ activity.type }}</td>
                  <td data-label="User">{{ activity.username }}</td>
                  <td data-label="Date">{{ formatDate(activity.date) }}</td>
                  <td data-label="Details">{{ activity.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modals -->
    <ConfirmationModal
      :show="showUserConfirmation"
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '@/store/auth';
import { supabase } from '@/api/supabase';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

// Router
const router = useRouter();

// State variables
const isLoading = ref(true);
const error = ref('');
const activeTab = ref('users');

// Admin tabs
const tabs = [
  { id: 'users', label: 'Users' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'categories', label: 'Categories' },
  { id: 'stats', label: 'Statistics' }
];

// Users management state
const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const userSearchQuery = ref('');

// Quizzes management state
const quizzes = ref<any[]>([]);
const quizSearchQuery = ref('');

// Categories management state
const categories = ref<any[]>([]);
const newCategory = ref('');

// Statistics state
const stats = reactive({
  totalUsers: 0,
  totalQuizzes: 0,
  totalAttempts: 0,
  activeUsers: 0
});
const recentActivity = ref<any[]>([]);

// Confirmation modal state
const showUserConfirmation = ref(false);
const confirmationData = reactive({
  title: '',
  message: '',
  confirmText: 'Confirm',
  type: 'warning',
  action: '',
  data: null as any
});

// Check if user is admin and load data
onMounted(async () => {
  if (!auth.state.isAuthenticated || !auth.state.user) {
    router.push('/login');
    return;
  }
  
  try {
    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('Roles')
      .select('role_name')
      .eq('id', auth.state.user.roleId)
      .single();
    
    if (roleError || !roleData) {
      throw new Error('Failed to verify role');
    }
    
    if (roleData.role_name !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }
    
    // Load all required data in parallel
    await Promise.all([
      loadUsers(),
      loadRoles(),
      loadQuizzes(),
      loadCategories(),
      loadStatistics()
    ]);
    
  } catch (err: any) {
    console.error('Admin dashboard error:', err);
    error.value = err.message || 'Failed to load admin dashboard';
  } finally {
    isLoading.value = false;
  }
});

// Filtered users based on search query
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value;
  
  const query = userSearchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) || 
    user.email.toLowerCase().includes(query)
  );
});

// Filtered quizzes based on search query
const filteredQuizzes = computed(() => {
  if (!quizSearchQuery.value) return quizzes.value;
  
  const query = quizSearchQuery.value.toLowerCase();
  return quizzes.value.filter(quiz => 
    quiz.title.toLowerCase().includes(query)
  );
});

// Load all users
async function loadUsers() {
  const { data, error } = await supabase
    .from('Users')
    .select(`
      id,
      username,
      email,
      role_id,
      created_at,
      is_active
    `)
    .order('id');
  
  if (error) {
    throw new Error(`Failed to load users: ${error.message}`);
  }
  
  users.value = data.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    roleId: user.role_id,
    createdAt: user.created_at,
    isActive: user.is_active
  }));
}

// Load all roles
async function loadRoles() {
  const { data, error } = await supabase
    .from('Roles')
    .select('id, role_name')
    .order('id');
  
  if (error) {
    throw new Error(`Failed to load roles: ${error.message}`);
  }
  
  roles.value = data.map((role: any) => ({
    id: role.id,
    roleName: role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)
  }));
}

// Load all quizzes
async function loadQuizzes() {
  // Join with Users to get owner username
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      id,
      title,
      owner_id,
      created_at,
      is_deleted,
      Users (username)
    `)
    .order('id', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to load quizzes: ${error.message}`);
  }
  
  // Load questions count for each quiz
  quizzes.value = await Promise.all(data.map(async (quiz: any) => {
    // Get question count
    const { count, error: countError } = await supabase
      .from('Questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);
    
    return {
      id: quiz.id,
      title: quiz.title || 'Untitled Quiz',
      ownerId: quiz.owner_id,
      ownerUsername: quiz.Users?.username || 'Unknown',
      createdAt: quiz.created_at,
      isDeleted: quiz.is_deleted,
      questionCount: count || 0
    };
  }));
}

// Load categories
async function loadCategories() {
  const { data, error } = await supabase
    .from('Categories')
    .select('id, category_name')
    .order('id');
  
  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  
  // Get quiz count for each category
  categories.value = await Promise.all(data.map(async (category: any) => {
    const { count, error: countError } = await supabase
      .from('Quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('is_deleted', false);
    
    return {
      id: category.id,
      name: category.category_name,
      quizCount: count || 0,
      isEditing: false,
      editName: category.category_name
    };
  }));
}

// Load system statistics
async function loadStatistics() {
  // Get total users count
  const { count: userCount, error: userError } = await supabase
    .from('Users')
    .select('id', { count: 'exact', head: true });
  
  if (!userError) {
    stats.totalUsers = userCount || 0;
  }
  
  // Get active users count
  const { count: activeCount, error: activeError } = await supabase
    .from('Users')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (!activeError) {
    stats.activeUsers = activeCount || 0;
  }
  
  // Get total quizzes count
  const { count: quizCount, error: quizError } = await supabase
    .from('Quizzes')
    .select('id', { count: 'exact', head: true });
  
  if (!quizError) {
    stats.totalQuizzes = quizCount || 0;
  }
  
  // Get total attempts count
  const { count: attemptCount, error: attemptError } = await supabase
    .from('QuizAttempts')
    .select('id', { count: 'exact', head: true });
  
  if (!attemptError) {
    stats.totalAttempts = attemptCount || 0;
  }
  
  // Get recent activity (last 10 quiz attempts)
  const { data: activityData, error: activityError } = await supabase
    .from('QuizAttempts')
    .select(`
      id,
      user_id,
      quiz_id,
      completed_at,
      score,
      total_questions,
      Users (username),
      Quizzes (title)
    `)
    .order('completed_at', { ascending: false })
    .limit(10);
  
  if (!activityError && activityData) {
    recentActivity.value = activityData.map((activity: any) => ({
      type: 'Quiz Attempt',
      username: activity.Users?.username || 'Unknown',
      date: activity.completed_at,
      details: `${activity.score}/${activity.total_questions} on "${activity.Quizzes?.title || 'Unknown Quiz'}"`
    }));
  }
}

// Update user role
async function updateUserRole(userId: number, roleId: number) {
  try {
    const { error } = await supabase
      .from('Users')
      .update({ role_id: roleId })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Error updating user role:', err);
    alert(`Failed to update role: ${err.message}`);
  }
}

// Confirm toggle user status
function confirmToggleUserStatus(user: any) {
  const newStatus = !user.isActive;
  const action = newStatus ? 'activate' : 'deactivate';
  
  confirmationData.title = newStatus ? 'Activate User' : 'Deactivate User';
  confirmationData.message = `Are you sure you want to ${action} the user "${user.username}"?`;
  confirmationData.confirmText = newStatus ? 'Activate' : 'Deactivate';
  confirmationData.type = newStatus ? 'info' : 'warning';
  confirmationData.action = 'toggleUserStatus';
  confirmationData.data = user;
  
  showUserConfirmation.value = true;
}

// Toggle user active status
async function toggleUserStatus(user: any) {
  try {
    const newStatus = !user.isActive;
    
    const { error } = await supabase
      .from('Users')
      .update({ is_active: newStatus })
      .eq('id', user.id);
    
    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }
    
    user.isActive = newStatus;
  } catch (err: any) {
    console.error('Error toggling user status:', err);
    alert(`Failed to update user status: ${err.message}`);
  }
}

// Confirm toggle quiz status
function confirmToggleQuizStatus(quiz: any) {
  const newStatus = !quiz.isDeleted;
  const action = newStatus ? 'delete' : 'restore';
  
  confirmationData.title = newStatus ? 'Delete Quiz' : 'Restore Quiz';
  confirmationData.message = `Are you sure you want to ${action} the quiz "${quiz.title}"?`;
  confirmationData.confirmText = newStatus ? 'Delete' : 'Restore';
  confirmationData.type = newStatus ? 'danger' : 'info';
  confirmationData.action = 'toggleQuizStatus';
  confirmationData.data = quiz;
  
  showUserConfirmation.value = true;
}

// Toggle quiz deleted status
async function toggleQuizStatus(quiz: any) {
  try {
    const newStatus = !quiz.isDeleted;
    
    const { error } = await supabase
      .from('Quizzes')
      .update({ is_deleted: newStatus })
      .eq('id', quiz.id);
    
    if (error) {
      throw new Error(`Failed to update quiz status: ${error.message}`);
    }
    
    quiz.isDeleted = newStatus;
  } catch (err: any) {
    console.error('Error toggling quiz status:', err);
    alert(`Failed to update quiz status: ${err.message}`);
  }
}

// View quiz details
function viewQuiz(quizId: number) {
  router.push(`/quiz/${quizId}/details`);
}

// Add new category
async function addCategory() {
  if (!newCategory.value.trim()) return;
  
  try {
    const { data, error } = await supabase
      .from('Categories')
      .insert({ category_name: newCategory.value.trim(), description: null })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to add category: ${error.message}`);
    }
    
    categories.value.push({
      id: data.id,
      name: data.category_name,
      quizCount: 0,
      isEditing: false,
      editName: data.category_name
    });
    
    newCategory.value = '';
  } catch (err: any) {
    console.error('Error adding category:', err);
    alert(`Failed to add category: ${err.message}`);
  }
}

// Start editing category
function startEditCategory(category: any) {
  category.isEditing = true;
  category.editName = category.name;
}

// Save edited category
async function saveCategory(category: any) {
  if (!category.editName.trim()) return;
  
  try {
    const { error } = await supabase
      .from('Categories')
      .update({ category_name: category.editName.trim() })
      .eq('id', category.id);
    
    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    
    category.name = category.editName;
    category.isEditing = false;
  } catch (err: any) {
    console.error('Error updating category:', err);
    alert(`Failed to update category: ${err.message}`);
  }
}

// Cancel category editing
function cancelEditCategory(category: any) {
  category.isEditing = false;
  category.editName = category.name;
}

// Confirm delete category
function confirmDeleteCategory(category: any) {
  if (category.quizCount > 0) {
    alert('Cannot delete category with associated quizzes');
    return;
  }
  
  confirmationData.title = 'Delete Category';
  confirmationData.message = `Are you sure you want to delete the category "${category.name}"?`;
  confirmationData.confirmText = 'Delete';
  confirmationData.type = 'danger';
  confirmationData.action = 'deleteCategory';
  confirmationData.data = category;
  
  showUserConfirmation.value = true;
}

// Delete category
async function deleteCategory(category: any) {
  try {
    // Check if category has quizzes
    if (category.quizCount > 0) {
      alert('Cannot delete category with associated quizzes');
      return;
    }
    
    const { error } = await supabase
      .from('Categories')
      .delete()
      .eq('id', category.id);
    
    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
    
    categories.value = categories.value.filter(c => c.id !== category.id);
  } catch (err: any) {
    console.error('Error deleting category:', err);
    alert(`Failed to delete category: ${err.message}`);
  }
}

// Handle confirmation modal actions
function confirmAction() {
  switch (confirmationData.action) {
    case 'toggleUserStatus':
      toggleUserStatus(confirmationData.data);
      break;
    case 'toggleQuizStatus':
      toggleQuizStatus(confirmationData.data);
      break;
    case 'deleteCategory':
      deleteCategory(confirmationData.data);
      break;
  }
  
  showUserConfirmation.value = false;
}

// Cancel confirmation
function cancelConfirmation() {
  showUserConfirmation.value = false;
}

// Format date for display
function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
.admin-page {
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
}

/* Loading and error states */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-md);
}

.error-icon {
  color: rgb(255, 89, 89);
  margin-bottom: var(--spacing-md);
}

.error-container p {
  color: var(--text-alt);
  max-width: 400px;
}

/* Admin tabs */
.admin-tabs {
  display: flex;
  border-bottom: 1px solid var(--input-border);
  margin-bottom: var(--spacing-lg);
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-alt);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  color: var(--accent);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--accent);
}

.admin-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  margin-bottom: var(--spacing-md);
  font-size: 1.5rem;
  font-weight: 500;
}

.subsection-title {
  margin: var(--spacing-lg) 0 var(--spacing-md);
  font-size: 1.2rem;
  font-weight: 500;
}

/* Search bar */
.search-bar {
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
  padding: 0.8rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 1rem;
}

/* Table styles */
.table-wrapper {
  overflow-x: auto;
  background: var(--panel-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: var(--spacing-sm);
  text-align: left;
  border-bottom: 1px solid var(--input-border);
}

.data-table th {
  font-weight: 500;
  color: var(--text-main);
  background: rgba(0, 0, 0, 0.2);
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.data-table td:first-child,
.data-table th:first-child {
  padding-left: var(--spacing-md);
}

.data-table td:last-child,
.data-table th:last-child {
  padding-right: var(--spacing-md);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.status-badge.inactive {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

/* Action buttons */
.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--input-bg);
  color: var(--text-main);
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--input-border);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.activate-btn {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.activate-btn:hover:not(:disabled) {
  background: rgba(46, 213, 115, 0.3);
}

.deactivate-btn {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.deactivate-btn:hover:not(:disabled) {
  background: rgba(255, 71, 87, 0.3);
}

.view-btn {
  background: rgba(52, 152, 219, 0.15);
  color: #3498db;
}

.view-btn:hover {
  background: rgba(52, 152, 219, 0.3);
}

/* Role select */
.role-select {
  padding: 0.2rem 0.4rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.9rem;
}

/* Edit input */
.edit-input {
  width: 100%;
  padding: 0.3rem 0.5rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.9rem;
}

/* Category form */
.category-form {
  margin-bottom: var(--spacing-md);
}

.form-group {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.form-input {
  flex: 1;
  padding: 0.8rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 1rem;
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: var(--panel-bg);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-alt);
  font-size: 0.9rem;
}

/* Animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Comprehensive Responsive Layouts */
/* Large Desktops (1200px and up) */
@media (min-width: 1200px) {
  .admin-page {
    padding: var(--spacing-xl) var(--spacing-lg);
  }
  
  .stats-grid {
    gap: var(--spacing-lg);
  }
  
  .tab-btn {
    padding: var(--spacing-md) var(--spacing-lg);
  }
}

/* Standard Desktops (992px to 1199px) */
@media (min-width: 992px) and (max-width: 1199px) {
  .admin-page {
    max-width: 95%;
  }
  
  .data-table th,
  .data-table td {
    padding: var(--spacing-sm) 0.5rem;
  }
}

/* Tablets (768px to 991px) */
@media (min-width: 768px) and (max-width: 991px) {
  .admin-page {
    padding: var(--spacing-md);
    max-width: 100%;
  }
  
  .page-title {
    font-size: 1.8rem;
    margin-bottom: var(--spacing-md);
  }
  
  .admin-tabs {
    flex-wrap: wrap;
    gap: 0.2rem;
  }
  
  .tab-btn {
    flex: 1;
    min-width: 120px;
    text-align: center;
    padding: 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }
  
  .stat-value {
    font-size: 1.7rem;
  }
  
  .form-group {
    flex-direction: column;
  }
  
  .form-input {
    width: 100%;
  }
  
  /* Data columns visibility for certain screen sizes */
  .data-table th:nth-child(1),
  .data-table td:nth-child(1) {
    display: none; /* Hide ID column on tablets */
  }
  
  .action-btn {
    padding: 0.4rem 0.6rem;
  }
}

/* Large Mobiles (576px to 767px) */
@media (min-width: 576px) and (max-width: 767px) {
  .admin-page {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: 1.6rem;
    margin-bottom: var(--spacing-sm);
  }
  
  .admin-tabs {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.2rem;
  }
  
  .tab-btn {
    flex: 1 0 40%;
    min-width: 100px;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .section-title {
    font-size: 1.3rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .form-group {
    flex-direction: column;
  }
  
  /* Responsive tables for smaller screens */
  .data-table {
    font-size: 0.85rem;
  }
  
  .data-table th:nth-child(1),
  .data-table td:nth-child(1),
  .data-table th:nth-child(5),
  .data-table td:nth-child(5) {
    display: none; /* Hide ID and Created columns */
  }
  
  .actions-cell {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .action-btn {
    width: 100%;
    text-align: center;
    font-size: 0.8rem;
  }
}

/* Small Mobiles (400px to 575px) */
@media (max-width: 575px) {
  .admin-page {
    padding: 0.5rem;
  }
  
  .page-title {
    font-size: 1.4rem;
    margin-bottom: var(--spacing-sm);
  }
  
  .admin-tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1 0 calc(50% - 2px);
    min-width: 0;
    padding: 0.5rem 0.3rem;
    font-size: 0.8rem;
    text-align: center;
  }
  
  .section-title {
    font-size: 1.2rem;
    text-align: center;
  }
  
  .subsection-title {
    font-size: 1.1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    text-align: left;
  }
  
  .stat-value {
    font-size: 1.3rem;
    margin-bottom: 0;
    margin-right: 0.5rem;
  }
  
  /* Responsive data table for mobile */
  .data-table {
    display: block;
    font-size: 0.8rem;
  }
  
  .data-table thead {
    display: none; /* Hide table headers on mobile */
  }
  
  .data-table tbody, 
  .data-table tr, 
  .data-table td {
    display: block;
    width: 100%;
  }
  
  .data-table tr {
    margin-bottom: 1rem;
    border: 1px solid var(--input-border);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
  }
  
  .data-table td {
    text-align: right;
    padding: 0.25rem 0.5rem;
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .data-table td:last-child {
    border-bottom: none;
  }
  
  .data-table td::before {
    content: attr(data-label);
    position: absolute;
    left: 0.5rem;
    font-weight: 500;
    text-align: left;
    color: var(--text-alt);
  }
  
  .actions-cell {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  
  .action-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .role-select {
    width: 100%;
    margin-top: 0.25rem;
  }
  
  .form-group {
    flex-direction: column;
  }
  
  .form-input {
    font-size: 0.9rem;
  }
}

/* Extra Small Mobiles (less than 400px) */
@media (max-width: 399px) {
  .tab-btn {
    font-size: 0.75rem;
    padding: 0.4rem 0.2rem;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .tab-btn {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
  
  .action-btn {
    padding: 0.5rem 0.7rem;
    min-height: 44px;
  }
  
  .form-input, 
  .search-input,
  .role-select {
    min-height: 44px;
  }
  
  .data-table td {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}
</style>
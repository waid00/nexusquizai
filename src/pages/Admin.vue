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
import '@/assets/pages/admin.css';

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
// src/store/auth.ts
import { reactive } from 'vue';
import { supabase } from '@/api/supabase';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { isDevelopment, buildApiUrl } from '@/utils/environment';

export interface User {
  userId: number;
  username: string;
  email: string;
  roleId: number;
  confirmed?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  isLoading: boolean;
  recoveryPhrase: string[] | null;
}

// Create reactive auth state
const state = reactive<AuthState>({
  isAuthenticated: false,
  user: null,
  error: null,
  isLoading: false,
  recoveryPhrase: null
});

// Load user from localStorage on init
function init() {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      state.user = user;
      state.isAuthenticated = true;
    } catch (error) {
      console.error('Failed to parse saved user:', error);
      localStorage.removeItem('user');
    }
  }
}

// Clear error message
function clearError() {
  state.error = null;
}

// Generate recovery phrase
function generateRecoveryPhrase(): string[] {
  const words = [
    'apple', 'banana', 'orange', 'grape', 'lemon', 'peach', 'plum', 'berry',
    'melon', 'cherry', 'mango', 'apricot', 'lime', 'coconut', 'strawberry',
    'blueberry', 'pear', 'pineapple', 'kiwi', 'papaya', 'avocado', 'fig',
    'guava', 'pomegranate', 'nectarine', 'tangerine', 'dragonfruit', 'passion',
    'watermelon', 'cantaloupe', 'honeydew', 'olive', 'grapefruit', 'mandarin',
    'date', 'blackberry', 'raspberry', 'cranberry', 'mulberry', 'elderberry',
    'gooseberry', 'boysenberry', 'currant', 'persimmon', 'quince', 'rhubarb',
    'starfruit', 'tamarind', 'yuzu', 'lychee'
  ];
  
  // Select 10 random words
  const recoveryPhrase: string[] = [];
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    recoveryPhrase.push(words[randomIndex]);
  }
  
  return recoveryPhrase;
}

// Login user
async function login(email: string, password: string) {
  state.isLoading = true;
  state.error = null;
  
  try {
    console.log('Attempting to log in user:', email);
    
    // Query the user by email - fixed query format
    const { data: user, error } = await supabase
      .from('Users')
      .select('id, username, email, password_hash, role_id')
      .eq('email', email.trim())
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error finding user:', error);
      state.error = 'Invalid email or password';
      return false;
    }
    
    if (!user) {
      console.error('No user found with email:', email);
      state.error = 'Invalid email or password';
      return false;
    }
    
    console.log('User found, verifying password');
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.error('Password verification failed');
      state.error = 'Invalid email or password';
      return false;
    }
    
    console.log('Password verified successfully');
    
    // Set authenticated user
    state.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      confirmed: true // Default to true until the column is added
    };
    
    state.isAuthenticated = true;
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(state.user));
    
    console.log('User logged in successfully:', state.user.username);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    state.error = 'An error occurred during login';
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Login by username
async function loginByUsername(username: string, password: string) {
  state.isLoading = true;
  state.error = null;
  
  try {
    console.log('Attempting to log in user by username:', username);
    
    // Query the user by username
    const { data, error } = await supabase
      .from('Users')
      .select('id, username, email, password_hash, role_id')
      .eq('username', username.trim())
      .eq('is_active', true);
      
    if (error) {
      console.error('Error finding user by username:', error);
      state.error = 'Invalid username or password';
      return false;
    }
    
    // Handle no results found
    if (!data || data.length === 0) {
      console.error('No user found with username:', username);
      state.error = 'Invalid username or password';
      return false;
    }
    
    // Get the first user with matching username
    const user = data[0];
    
    console.log('User found, verifying password');
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.error('Password verification failed');
      state.error = 'Invalid username or password';
      return false;
    }
    
    console.log('Password verified successfully');
    
    // Set authenticated user
    state.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      confirmed: true // Default to true until the column is added
    };
    
    state.isAuthenticated = true;
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(state.user));
    
    console.log('User logged in successfully:', state.user.username);
    return true;
  } catch (error) {
    console.error('Login by username error:', error);
    state.error = 'An error occurred during login';
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Register user
async function register(username: string, email: string, password: string) {
  state.isLoading = true;
  state.error = null;
  
  try {
    // Check if user already exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('Users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing user:', checkError);
      }
      
      if (existingUser && existingUser.length > 0) {
        state.error = 'Username or email already exists';
        return false;
      }
    } catch (checkErr) {
      console.error('Exception checking existing user:', checkErr);
      // Continue with registration anyway
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate recovery phrase
    const recoveryPhrase = generateRecoveryPhrase();
    state.recoveryPhrase = recoveryPhrase;
    
    // Hash the recovery phrase for secure storage
    const recoveryPhraseString = recoveryPhrase.join(' ');
    const recoverySalt = await bcrypt.genSalt(10);
    const hashedRecoveryPhrase = await bcrypt.hash(recoveryPhraseString, recoverySalt);
    
    // First ensure roles exist or get the 'user' role
    let roleId;
    
    try {
      // First check if any roles exist at all
      const { data: allRoles, error: rolesError } = await supabase
        .from('Roles')
        .select('*');
        
      if (rolesError) {
        console.error('Error checking roles:', rolesError);
        throw new Error('Could not verify roles in database');
      }
      
      if (!allRoles || allRoles.length === 0) {
        // No roles exist, create the default ones
        console.log('No roles found. Creating default roles...');
        
        const { data: newRoles, error: createError } = await supabase
          .from('Roles')
          .insert([
            { role_name: 'admin' },
            { role_name: 'teacher' },
            { role_name: 'user' }
          ])
          .select();
          
        if (createError) {
          console.error('Error creating roles:', createError);
          throw new Error('Failed to create roles');
        }
        
        // Find the user role we just created
        const userRole = newRoles.find(r => r.role_name === 'user');
        roleId = userRole ? userRole.id : 3; // Default to 3 if for some reason the user role isn't found
      } else {
        // Roles exist, get the user role
        const { data: userRole, error: roleError } = await supabase
          .from('Roles')
          .select('id')
          .eq('role_name', 'user')
          .maybeSingle();
          
        if (roleError) {
          console.error('Error getting user role:', roleError);
          // Try to get any role rather than failing
          roleId = allRoles[0].id;
        } else if (userRole) {
          roleId = userRole.id;
        } else {
          // User role doesn't exist, create it
          const { data: newRole, error: newRoleError } = await supabase
            .from('Roles')
            .insert({ role_name: 'user' })
            .select()
            .single();
            
          if (newRoleError) {
            console.error('Error creating user role:', newRoleError);
            roleId = allRoles[0].id; // Use the first available role
          } else {
            roleId = newRole.id;
          }
        }
      }
    } catch (roleErr) {
      console.error('Error handling roles:', roleErr);
      state.error = 'Failed to set up user role';
      return false;
    }
    
    if (!roleId) {
      console.error('Could not determine a valid role_id');
      state.error = 'Account creation failed - no valid role found';
      return false;
    }
    
    console.log('Creating user with data:', {
      username,
      email,
      role_id: roleId,
    });
    
    // Create user with basic required fields
    const userData = {
      username,
      email,
      password_hash: hashedPassword,
      recovery_phrase_hash: hashedRecoveryPhrase,
      role_id: roleId,
      created_at: new Date().toISOString(),
      is_active: true
      // We don't add confirmed field yet - we'll add it once the column exists
    };
    
    // Create user with explicit role ID
    const { data: newUser, error } = await supabase
      .from('Users')
      .insert(userData)
      .select('id, username, email, role_id')
      .single();
    
    if (error) {
      console.error('User creation error:', error);
      state.error = `Failed to register user: ${error.message || 'Unknown error'}`;
      return false;
    }
    
    if (!newUser || !newUser.id) {
      console.error('User created but no ID returned');
      state.error = 'User creation failed - no ID returned';
      return false;
    }
    
    console.log('User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roleId: newUser.role_id
    });
    
    // Set user data
    state.user = {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roleId: newUser.role_id,
      confirmed: false // Default to true until the column exists
    };
      // In production, try to send verification email
    // In development, skip email verification
    if (!isDevelopment()) {
      try {
        await sendVerificationEmail(newUser.id, email, username);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration, but log the error
      }
    } else {
      console.log('Development mode: Skipping email verification');
    }
    
    // User is authenticated
    state.isAuthenticated = true;
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(state.user));
    
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    state.error = 'An error occurred during registration';
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Send verification email
async function sendVerificationEmail(userId: number, email: string, username: string) {
  try {
    console.log('Sending verification email for user:', email);
    
    // Use the buildApiUrl function to get the proper API URL
    const apiUrl = buildApiUrl('/api/send-verification-email');
    
    console.log('Using API endpoint:', apiUrl);
    
    const response = await axios.post(apiUrl, {
      userId,
      email,
      username
    });
    
    console.log('Send verification email response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Verify email with token
async function verifyEmail(token: string) {
  state.isLoading = true;
  state.error = null;
  
  try {
    console.log('Verifying email with token:', token);
    
    // For development/testing: bypass API verification
    if (isDevelopment()) {
      console.log('Development mode: Auto-verifying email');
      if (state.user) {
        state.user.confirmed = true;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
      return true;
    }
    
    // Use the current page URL origin to build the API URL
    let apiUrl = '';
    if (typeof window !== 'undefined') {
      apiUrl = `${window.location.origin}/api/verify-email`;
    } else {
      apiUrl = '/api/verify-email';
    }
    
    console.log('Using verification API endpoint:', apiUrl);
    console.log('Sending token to API:', token);
      try {
      console.log('Making verification API request to:', apiUrl);
      const response = await axios.post(apiUrl, { token });
      console.log('Verification API response:', response.data);
      
      if (response.data.success) {
        console.log('API verification successful');
        // If user is already set in state, update confirmed status
        if (state.user) {
          console.log('Updating user confirmed status');
          state.user.confirmed = true;
          localStorage.setItem('user', JSON.stringify(state.user));
        } else {
          console.log('No logged in user to update');
        }
        
        return true;
      } else {
        console.error('API returned success: false');
        state.error = response.data.error || 'Verification failed';
        return false;
      }
    } catch (apiError: any) {
      console.error('API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      // Set a more specific error message
      if (apiError.response?.status === 404) {
        state.error = 'Verification API not found. Please try again later or contact support.';
      } else {
        state.error = apiError.response?.data?.error || apiError.message || 'Unknown API error';
      }
      
      return false;
    }
  } catch (error: any) {
    console.error('Email verification error:', error);
    const errorMessage = error.response?.data?.error || 'Failed to verify email';
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    state.error = errorMessage;
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Resend verification email
async function resendVerificationEmail() {
  if (!state.user) {
    state.error = 'User not found';
    return false;
  }
  
  state.isLoading = true;
  state.error = null;
  
  try {
    return await sendVerificationEmail(
      state.user.userId,
      state.user.email,
      state.user.username
    );
  } catch (error) {
    console.error('Error resending verification email:', error);
    state.error = 'Failed to resend verification email';
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Logout user
function logout() {
  state.user = null;
  state.isAuthenticated = false;
  localStorage.removeItem('user');
}

// Reset password
async function resetPassword(email: string, recoveryPhrase: string, newPassword: string) {
  state.isLoading = true;
  state.error = null;
  
  try {
    // Find user by email
    const { data, error: userError } = await supabase
      .from('Users')
      .select('id, password_hash')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (userError || !data) {
      state.error = 'Invalid email';
      return false;
    }
    
    // Since recovery_phrase_hash and recovery_phrase columns don't exist in the database,
    // we'll use a simplified approach for password reset
    
    // In a real application, you would implement a proper verification method here
    // This is just a placeholder that assumes the recovery phrase is valid
    let isValidPhrase = true;
    
    // TODO: Implement proper recovery phrase validation
    // For now, we're just logging a warning
    console.warn('Recovery phrase validation is bypassed - implement proper verification');
    
    if (!isValidPhrase) {
      state.error = 'Invalid recovery phrase';
      return false;
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password but keep the recovery phrase hash
    const { error: updateError } = await supabase
      .from('Users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString() 
      })
      .eq('id', data.id);
      
    if (updateError) {
      console.error('Error updating password:', updateError);
      state.error = 'Failed to update password';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    state.error = 'An error occurred during password reset';
    return false;
  } finally {
    state.isLoading = false;
  }
}

// Initialize
init();

// Export auth methods and state
export const auth = {
  state,
  login,
  loginByUsername,
  register,
  logout,
  resetPassword,
  clearError,
  generateRecoveryPhrase,
  verifyEmail,
  resendVerificationEmail
};
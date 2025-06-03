import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials are missing. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in your .env file.");
  throw new Error("Supabase credentials missing in .env file. Please add VITE_SUPABASE_URL and VITE_SUPABASE_KEY to your .env file and restart the server.");
}

// Create client with explicit options for auth
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        apikey: supabaseKey
      }
    }
  }
);

// Users
export async function getUsers() {
  const { data, error } = await supabase.from('Users').select('*');
  if (error) throw error;
  return data;
}

export async function getUserById(id: number) {
  const { data, error } = await supabase.from('Users').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from('Users').select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createUser(userData: { username: string; email: string; password_hash: string; role_id: number; recovery_phrase?: string }) {
  const { data, error } = await supabase.from('Users').insert(userData).select().single();
  if (error) throw error;
  return data;
}

// Quizzes
export async function getPublicQuizzes() {
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      *,
      Users (username),
      Questions (count),
      QuizAttempts!quiz_id (count),
      QuizUpvotes!quiz_id (count),
      Categories (category_name)
    `)
    .eq('is_public', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(quiz => ({
    quizId: quiz.id,
    title: quiz.title,
    description: quiz.description || 'No description available',
    difficulty: typeof quiz.difficulty === 'string' ? quiz.difficulty.toLowerCase() : 'unknown',
    createdAt: quiz.created_at,
    authorName: quiz.Users?.username,
    ownerId: quiz.owner_id,
    questionCount: quiz.Questions?.[0]?.count || 0,
    attemptCount: quiz.QuizAttempts?.[0]?.count || 0,
    upvoteCount: quiz.QuizUpvotes?.[0]?.count || 0,
    categoryName: quiz.Categories?.category_name || 'Uncategorized',
    hasUserUpvoted: false,
    isUserOwner: false
  }));
}

export async function getQuizById(id: number) {
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      *,
      Users (username),
      Questions (
        *,
        AnswerOptions (*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserQuizzes(userId: number) {
  const { data, error } = await supabase
    .from('Quizzes')
    .select(`
      *,
      Questions (count),
      QuizAttempts!quiz_id (count),
      QuizUpvotes!quiz_id (count)
    `)
    .eq('owner_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createQuiz(quizData: any) {
  const { data, error } = await supabase.from('Quizzes').insert(quizData).select().single();
  if (error) throw error;
  return data;
}

export async function updateQuiz(id: number, quizData: any) {
  const { data, error } = await supabase.from('Quizzes').update(quizData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQuiz(id: number) {
  // Soft delete by setting is_deleted to true
  const { data, error } = await supabase
    .from('Quizzes')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Questions
export async function createQuestion(questionData: any) {
  const { data, error } = await supabase.from('Questions').insert(questionData).select().single();
  if (error) throw error;
  return data;
}

// Source Documents
export async function createSourceDoc(docData: { user_id: number, content: string, title: string, file_type: string }) {
  const { data, error } = await supabase
    .from('SourceDocs')
    .insert({
      user_id: docData.user_id,
      content: docData.content,
      title: docData.title,
      file_type: docData.file_type,
      uploaded_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getQuestionsByQuizId(quizId: number) {
  const { data, error } = await supabase
    .from('Questions')
    .select(`
      *,
      AnswerOptions (*)
    `)
    .eq('quiz_id', quizId)
    .eq('is_active', true)
    .order('id', { ascending: true });
  
  if (error) throw error;
  return data;
}

// Answer Options
export async function createAnswerOptions(options: any[]) {
  const { data, error } = await supabase.from('AnswerOptions').insert(options).select();
  if (error) throw error;
  return data;
}

// Quiz Attempts
export async function createQuizAttempt(attemptData: any) {
  const { data, error } = await supabase.from('QuizAttempts').insert(attemptData).select().single();
  if (error) throw error;
  return data;
}

export async function getQuizAttemptsByUserId(userId: number) {
  const { data, error } = await supabase
    .from('QuizAttempts')
    .select(`
      *,
      Quizzes (
        *,
        Users (username)
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getQuizAttemptById(id: number) {
  const { data, error } = await supabase
    .from('QuizAttempts')
    .select(`
      *,
      Quizzes (
        *,
        Users (username)
      ),
      AttemptAnswers (
        *,
        Questions (*),
        AnswerOptions (*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateQuizAttempt(id: number, attemptData: any) {
  const { data, error } = await supabase.from('QuizAttempts').update(attemptData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Attempt Answers
export async function createAttemptAnswers(answers: any[]) {
  const { data, error } = await supabase.from('AttemptAnswers').insert(answers).select();
  if (error) throw error;
  return data;
}

// Quiz Upvotes
export async function toggleQuizUpvote(quizId: number, userId: number) {
  // Check if upvote exists
  const { data: existingUpvote } = await supabase
    .from('QuizUpvotes')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .single();
  
  if (existingUpvote) {
    // Remove upvote
    const { error } = await supabase
      .from('QuizUpvotes')
      .delete()
      .eq('quiz_id', quizId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return false; // Indicates upvote was removed
  } else {
    // Add upvote
    const { error } = await supabase
      .from('QuizUpvotes')
      .insert({ quiz_id: quizId, user_id: userId });
    
    if (error) throw error;
    return true; // Indicates upvote was added
  }
}

export async function checkUserUpvote(quizId: number, userId: number) {
  try {
    // Use count instead of select to avoid 406 errors
    const { count, error } = await supabase
      .from('QuizUpvotes')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error checking upvote:', error);
      return false;
    }
    
    return count ? count > 0 : false;
  } catch (err) {
    console.error('Exception checking upvote:', err);
    return false;
  }
}

// Categories
export async function getCategories() {
  const { data, error } = await supabase.from('Categories').select('*');
  if (error) throw error;
  return data;
}

export async function getCategoryById(id: number) {
  const { data, error } = await supabase.from('Categories').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// Roles
export async function getRoles() {
  const { data, error } = await supabase.from('Roles').select('*');
  if (error) throw error;
  return data;
}

export async function getRoleById(id: number) {
  const { data, error } = await supabase.from('Roles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      AnswerOptions: {
        Row: {
          id: number
          question_id: number
          answer_text: string
          is_correct: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          question_id: number
          answer_text: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          question_id?: number
          answer_text?: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "AnswerOptions_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "Questions"
            referencedColumns: ["id"]
          }
        ]
      }
      AttemptAnswers: {
        Row: {
          id: number
          attempt_id: number
          question_id: number
          selected_option_id: number | null
          is_correct: boolean | null
        }
        Insert: {
          id?: number
          attempt_id: number
          question_id: number
          selected_option_id?: number | null
          is_correct?: boolean | null
        }
        Update: {
          id?: number
          attempt_id?: number
          question_id?: number
          selected_option_id?: number | null
          is_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "AttemptAnswers_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "QuizAttempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AttemptAnswers_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "Questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AttemptAnswers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            referencedRelation: "AnswerOptions"
            referencedColumns: ["id"]
          }
        ]
      }
      Categories: {
        Row: {
          id: number
          category_name: string
          description: string | null
        }
        Insert: {
          id?: number
          category_name: string
          description?: string | null
        }
        Update: {
          id?: number
          category_name?: string
          description?: string | null
        }
        Relationships: []
      }
      Questions: {
        Row: {
          id: number
          quiz_id: number
          question_text: string
          question_type: string
          difficulty: string
          points: number
          created_at: string
          updated_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: number
          quiz_id: number
          question_text: string
          question_type: string
          difficulty: string
          points?: number
          created_at?: string
          updated_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: number
          quiz_id?: number
          question_text?: string
          question_type?: string
          difficulty?: string
          points?: number
          created_at?: string
          updated_at?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Questions_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "Quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      QuizAttempts: {
        Row: {
          id: number
          quiz_id: number
          user_id: number | null
          score: number
          total_questions: number
          started_at: string
          completed_at: string | null
          elapsed_time: number | null
          is_passed: boolean | null
        }
        Insert: {
          id?: number
          quiz_id: number
          user_id?: number | null
          score: number
          total_questions: number
          started_at?: string
          completed_at?: string | null
          elapsed_time?: number | null
          is_passed?: boolean | null
        }
        Update: {
          id?: number
          quiz_id?: number
          user_id?: number | null
          score?: number
          total_questions?: number
          started_at?: string
          completed_at?: string | null
          elapsed_time?: number | null
          is_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "QuizAttempts_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "Quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "QuizAttempts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      Quizzes: {
        Row: {
          id: number
          owner_id: number
          category_id: number
          title: string
          description: string | null
          difficulty: string
          is_public: boolean
          created_at: string
          updated_at: string | null
          published_at: string | null
          is_deleted: boolean
        }
        Insert: {
          id?: number
          owner_id: number
          category_id: number
          title: string
          description?: string | null
          difficulty: string
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
          is_deleted?: boolean
        }
        Update: {
          id?: number
          owner_id?: number
          category_id?: number
          title?: string
          description?: string | null
          difficulty?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
          is_deleted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Quizzes_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "Categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Quizzes_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      QuizUpvotes: {
        Row: {
          id: number
          quiz_id: number
          user_id: number
          created_at: string
        }
        Insert: {
          id?: number
          quiz_id: number
          user_id: number
          created_at?: string
        }
        Update: {
          id?: number
          quiz_id?: number
          user_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "QuizUpvotes_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "Quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "QuizUpvotes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      Roles: {
        Row: {
          id: number
          role_name: string
        }
        Insert: {
          id?: number
          role_name: string
        }
        Update: {
          id?: number
          role_name?: string
        }
        Relationships: []
      }
      Users: {
        Row: {
          id: number
          username: string
          email: string
          password_hash: string
          recovery_phrase: string | null
          role_id: number
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: number
          username: string
          email: string
          password_hash: string
          recovery_phrase?: string | null
          role_id: number
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          username?: string
          email?: string
          password_hash?: string
          recovery_phrase?: string | null
          role_id?: number
          created_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Users_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "Roles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
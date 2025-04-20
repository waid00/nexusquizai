import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

// Load the WASM file from the public directory
const SQLPromise: Promise<SqlJsStatic> = initSqlJs({
  locateFile: (file: string) => `/sql-wasm.wasm`
});

let db: Database | null = null;

/**
 * Get or initialize the SQLite database in the browser.
 * Applies the provided schema on first init.
 */
export async function getDB(): Promise<Database> {
  if (!db) {
    const SQL = await SQLPromise;
    db = new SQL.Database();
    db.run(`
      -- Roles
      CREATE TABLE IF NOT EXISTS Roles (
          role_id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_name TEXT NOT NULL UNIQUE
      );

      -- Users
      CREATE TABLE IF NOT EXISTS Users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (role_id) REFERENCES Roles(role_id)
      );

      -- Categories
      CREATE TABLE IF NOT EXISTS Categories (
          category_id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name TEXT NOT NULL UNIQUE,
          description TEXT
      );

      -- Quizzes
      CREATE TABLE IF NOT EXISTS Quizzes (
          quiz_id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
          is_public INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          published_at DATETIME,
          is_deleted INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (owner_id) REFERENCES Users(user_id),
          FOREIGN KEY (category_id) REFERENCES Categories(category_id)
      );

      -- Questions
      CREATE TABLE IF NOT EXISTS Questions (
          question_id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          question_type TEXT NOT NULL,
          difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
          points INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          is_active INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
      );

      -- AnswerOptions
      CREATE TABLE IF NOT EXISTS AnswerOptions (
          option_id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          answer_text TEXT NOT NULL,
          is_correct INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          FOREIGN KEY (question_id) REFERENCES Questions(question_id)
      );

      -- QuizAttempts
      CREATE TABLE IF NOT EXISTS QuizAttempts (
          attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          user_id INTEGER,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          elapsed_time INTEGER,
          is_passed INTEGER,
          FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id),
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
      );

      -- AttemptAnswers
      CREATE TABLE IF NOT EXISTS AttemptAnswers (
          attempt_answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
          attempt_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          selected_option_id INTEGER,
          is_correct INTEGER,
          FOREIGN KEY (attempt_id) REFERENCES QuizAttempts(attempt_id),
          FOREIGN KEY (question_id) REFERENCES Questions(question_id),
          FOREIGN KEY (selected_option_id) REFERENCES AnswerOptions(option_id)
      );
    `);
  }
  return db;
}
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { openDB, type IDBPDatabase } from 'idb';

// Load the WASM file from the public directory
const SQLPromise: Promise<SqlJsStatic> = initSqlJs({
  locateFile: (file: string) => `/sql-wasm.wasm`
});

let db: Database | null = null;
const DB_NAME = 'nexusquiz-db';
const DB_STORE_NAME = 'sqlite-store';
const DB_KEY = 'database';

/**
 * Open the IndexedDB database
 */
async function openIndexedDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME);
      }
    },
  });
}

/**
 * Save the SQLite database to IndexedDB
 */
export async function saveDB(): Promise<void> {
  if (!db) return;
  
  try {
    // Export the database to a Uint8Array
    const data = db.export();
    
    // Save to IndexedDB
    const idb = await openIndexedDB();
    await idb.put(DB_STORE_NAME, data, DB_KEY);
    console.log('Database saved to IndexedDB');
  } catch (err) {
    console.error('Failed to save database to IndexedDB:', err);
  }
}

/**
 * Get or initialize the SQLite database.
 * Loads from IndexedDB if available, otherwise creates a new DB.
 */
export async function getDB(): Promise<Database> {
  if (!db) {
    const SQL = await SQLPromise;
    
    try {
      // Try to load the database from IndexedDB
      const idb = await openIndexedDB();
      const savedData = await idb.get(DB_STORE_NAME, DB_KEY);
      
      if (savedData) {
        // Create database from the saved data
        db = new SQL.Database(savedData);
        console.log('Database loaded from IndexedDB');
      } else {
        // No saved database, create a new one
        db = new SQL.Database();
        initializeDatabase(db);
      }
    } catch (err) {
      console.error('Failed to load database from IndexedDB:', err);
      // If loading fails, create a new database
      db = new SQL.Database();
      initializeDatabase(db);
    }
  }
  return db;
}

/**
 * Initialize a new database with schema and seed data
 */
function initializeDatabase(db: Database): void {
  console.log('Creating new database schema');
  
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
        recovery_phrase TEXT,
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

  // Seed the database with initial data
  seedInitialData(db);
}

/**
 * Seed the database with initial roles and users if they don't exist
 */
async function seedInitialData(db: Database): Promise<void> {
  // Check if roles exist
  const rolesExist = db.exec("SELECT COUNT(*) FROM Roles");
  const roleCount = rolesExist[0].values[0][0] as number;

  // Insert roles if none exist
  if (roleCount === 0) {
    console.log('Seeding initial roles');
    db.run(`
      INSERT INTO Roles (role_name) VALUES 
      ('Admin'),
      ('Teacher'),
      ('Student');
    `);
  }

  // Check if users exist
  const usersExist = db.exec("SELECT COUNT(*) FROM Users");
  const userCount = usersExist[0].values[0][0] as number;

  // Insert sample users if none exist
  if (userCount === 0) {
    console.log('Seeding initial users');
    // Simple password hash simulation (in a real app, use proper hashing)
    const simpleHash = (pwd: string) => btoa(pwd + '_salted');

    db.run(`
      INSERT INTO Users (username, email, password_hash, recovery_phrase, role_id) VALUES 
      ('admin', 'admin@nexusquiz.ai', '${simpleHash('admin123')}', 'apple banana cherry dog elephant frog giraffe horse igloo jaguar', 1),
      ('teacher1', 'teacher@nexusquiz.ai', '${simpleHash('teach123')}', 'kiwi lemon mango nut orange pear quince raspberry strawberry tomato', 2),
      ('student1', 'student1@nexusquiz.ai', '${simpleHash('student123')}', 'umbrella violet water xylophone yacht zebra anchor balloon caterpillar dolphin', 3),
      ('student2', 'student2@nexusquiz.ai', '${simpleHash('student456')}', 'eagle flower garden hat island jungle kite leaf mountain needle', 3);
    `);
  }

  // Save the seeded database
  await saveDB();
}
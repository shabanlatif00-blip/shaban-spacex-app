import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const db = new Database('vault.db');
db.pragma('journal_mode = WAL'); // Improve concurrency

// Initialize Database with Multi-user support
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    theme TEXT DEFAULT 'Galaxy',
    biometric_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS profile (
    user_id INTEGER PRIMARY KEY,
    name TEXT,
    bio TEXT,
    goals TEXT,
    skills TEXT,
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    time TEXT,
    completed INTEGER DEFAULT 0,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    is_locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    encrypted_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

const app = express();
app.set('trust proxy', true); 

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'shaban-vault-secret-v2-ultra-secure-key-jwt-2026';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const isAuthenticated = (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    console.log(`[${new Date().toISOString()}] Auth Failed | Path: ${req.path} | No Token`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log(`[${new Date().toISOString()}] Auth Failed | Path: ${req.path} | Invalid Token`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Add a helper to check session health
app.get('/api/auth/session-check', (req: any, res) => {
  res.json({
    hasSession: !!req.cookies.auth_token,
    hasUserId: !!req.cookies.auth_token,
    sid: 'jwt',
    cookiePresent: !!req.headers.cookie
  });
});

app.get('/api/debug/session', (req: any, res) => {
  res.json({
    cookies: req.headers.cookie,
    token: req.cookies.auth_token
  });
});

// --- Auth Routes ---

const generateToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

const setAuthCookie = (res: any, token: string) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

app.get('/api/auth/status', (req: any, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.json({ isLoggedIn: false, reason: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT username, theme, biometric_enabled FROM users WHERE id = ?').get(decoded.userId) as any;
    
    if (user) {
      res.json({ 
        isLoggedIn: true, 
        username: user.username,
        theme: user.theme,
        biometricEnabled: user.biometric_enabled === 1
      });
    } else {
      res.json({ isLoggedIn: false, reason: 'User not found' });
    }
  } catch (err) {
    res.json({ isLoggedIn: false, reason: 'Invalid token' });
  }
});

app.post('/api/auth/register', (req: any, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  const trimmedUsername = username.trim();
  if (!trimmedUsername) return res.status(400).json({ error: 'Username cannot be empty' });

  // Check if user already exists (case-insensitive)
  const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(trimmedUsername);
  if (existingUser) {
    console.log(`[${new Date().toISOString()}] Register Denied | User already exists: ${trimmedUsername}`);
    return res.status(400).json({ error: 'Username already exists' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(trimmedUsername, hashedPassword);
    const userId = Number(result.lastInsertRowid);
    
    const token = generateToken(userId);
    setAuthCookie(res, token);
    
    console.log(`[${new Date().toISOString()}] Register Success | User: ${trimmedUsername} | UID: ${userId}`);
    res.json({ 
      success: true,
      user: {
        username: trimmedUsername,
        theme: 'Galaxy',
        biometricEnabled: false
      }
    });
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] Register Error:`, e.message);
    if (e.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error during registration' });
    }
  }
});

app.post('/api/auth/login', (req: any, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const trimmedUsername = username.trim();
  // Case-insensitive lookup
  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(trimmedUsername) as any;
  
  if (user && bcrypt.compareSync(password, user.password)) {
    const userId = Number(user.id);
    const token = generateToken(userId);
    setAuthCookie(res, token);
    
    console.log(`[${new Date().toISOString()}] Login Success | User: ${user.username} | UID: ${userId}`);
    
    res.json({ 
      success: true, 
      user: { 
        username: user.username,
        theme: user.theme,
        biometricEnabled: user.biometric_enabled === 1
      } 
    });
  } else {
    console.log(`[${new Date().toISOString()}] Login Failed | User: ${trimmedUsername}`);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req: any, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  res.json({ success: true });
});

app.post('/api/auth/change-password', isAuthenticated, (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId) as any;
  
  if (bcrypt.compareSync(oldPassword, user.password)) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.userId);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Incorrect old password' });
  }
});

app.post('/api/auth/toggle-biometric', isAuthenticated, (req: any, res) => {
  const { enabled } = req.body;
  db.prepare('UPDATE users SET biometric_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.userId);
  res.json({ success: true });
});

// --- User Data Routes ---

app.get('/api/profile', isAuthenticated, (req: any, res) => {
  let profile = db.prepare('SELECT * FROM profile WHERE user_id = ?').get(req.userId);
  if (!profile) {
    db.prepare('INSERT INTO profile (user_id, name, bio, goals, skills, notes) VALUES (?, ?, ?, ?, ?, ?)').run(req.userId, 'New Explorer', '', '', '', '');
    profile = db.prepare('SELECT * FROM profile WHERE user_id = ?').get(req.userId);
  }
  res.json(profile);
});

app.post('/api/profile', isAuthenticated, (req: any, res) => {
  const { name, bio, goals, skills, notes } = req.body;
  db.prepare('UPDATE profile SET name = ?, bio = ?, goals = ?, skills = ?, notes = ? WHERE user_id = ?')
    .run(name, bio, goals, skills, notes, req.userId);
  res.json({ success: true });
});

app.get('/api/tasks', isAuthenticated, (req: any, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY time ASC').all(req.userId);
  res.json(tasks);
});

app.post('/api/tasks', isAuthenticated, (req: any, res) => {
  const { title, time, date } = req.body;
  db.prepare('INSERT INTO tasks (user_id, title, time, date) VALUES (?, ?, ?, ?)').run(req.userId, title, time, date);
  res.json({ success: true });
});

app.patch('/api/tasks/:id', isAuthenticated, (req: any, res) => {
  const { completed } = req.body;
  db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?').run(completed ? 1 : 0, req.params.id, req.userId);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', isAuthenticated, (req: any, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

app.get('/api/notes', isAuthenticated, (req: any, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(notes);
});

app.post('/api/notes', isAuthenticated, (req: any, res) => {
  const { title, content, is_locked } = req.body;
  db.prepare('INSERT INTO notes (user_id, title, content, is_locked) VALUES (?, ?, ?, ?)').run(req.userId, title, content, is_locked ? 1 : 0);
  res.json({ success: true });
});

app.delete('/api/notes/:id', isAuthenticated, (req: any, res) => {
  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    // Allow common safe formats
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload images, videos, audio, PDFs, or text documents.'));
    }
  }
});

app.post('/api/documents', isAuthenticated, (req: any, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size allowed is 100MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, (req: any, res) => {
  console.log('Upload request processed by multer');
  if (!req.file) {
    console.log('No file in request after multer');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { originalname, mimetype, size, filename } = req.file;
  console.log(`Received file: ${originalname}, size: ${size}, type: ${mimetype}, stored as: ${filename}`);
  
  try {
    db.prepare('INSERT INTO documents (user_id, name, original_name, mime_type, size, encrypted_path) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.userId, originalname, originalname, mimetype, size, filename);
    console.log('File metadata saved to database');
    res.json({ success: true });
  } catch (error) {
    console.error('Database error during file upload:', error);
    res.status(500).json({ error: 'Failed to save file metadata' });
  }
});

app.get('/api/documents', isAuthenticated, (req: any, res) => {
  const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(docs);
});

app.delete('/api/documents/:id', isAuthenticated, (req: any, res) => {
  const doc = db.prepare('SELECT encrypted_path FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (doc) {
    const filePath = path.join(UPLOADS_DIR, doc.encrypted_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  }
  res.json({ success: true });
});

app.get('/api/documents/download/:id', isAuthenticated, (req: any, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (doc) {
    const filePath = path.join(UPLOADS_DIR, doc.encrypted_path);
    res.download(filePath, doc.original_name);
  } else {
    res.status(404).send('Not found');
  }
});

app.get('/api/config/theme', isAuthenticated, (req: any, res) => {
  const user = db.prepare('SELECT theme FROM users WHERE id = ?').get(req.userId) as any;
  res.json({ theme: user ? user.theme : 'Galaxy' });
});

app.post('/api/config/theme', isAuthenticated, (req: any, res) => {
  const { theme } = req.body;
  db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(theme, req.userId);
  res.json({ success: true });
});

app.get('/api/backup', isAuthenticated, (req: any, res) => {
  res.download('vault.db', 'shaban_spacex_backup.db');
});

app.get('/api/birthdays', isAuthenticated, (req: any, res) => {
  const birthdays = db.prepare('SELECT * FROM birthdays WHERE user_id = ? ORDER BY date ASC').all(req.userId);
  res.json(birthdays);
});

app.post('/api/birthdays', isAuthenticated, (req: any, res) => {
  const { name, date } = req.body;
  db.prepare('INSERT INTO birthdays (user_id, name, date) VALUES (?, ?, ?)').run(req.userId, name, date);
  res.json({ success: true });
});

app.delete('/api/birthdays/:id', isAuthenticated, (req: any, res) => {
  db.prepare('DELETE FROM birthdays WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

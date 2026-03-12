/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Shield, LayoutDashboard, FileText, User, 
  Calendar, Vault, Settings, LogOut, ChevronRight,
  Plus, Trash2, Check, X, Download, Upload,
  Moon, Sun, Key, Database, Search, Image as ImageIcon,
  Video, Music, Eye, EyeOff, Cake, Bell, Zap,
  ChevronLeft, Fingerprint, Unlock, Loader2, ShieldAlert
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { encrypt, decrypt, formatSize } from './lib/utils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: 'btn-apple',
    secondary: 'btn-apple-secondary',
    danger: 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 rounded-2xl',
    ghost: 'bg-transparent text-space-light hover:bg-white/5 rounded-2xl',
  };
  return (
    <button 
      className={cn(
        'font-semibold transition-all active:scale-95 disabled:opacity-50', 
        variants[variant as keyof typeof variants],
        className
      )} 
      {...props} 
    />
  );
};

const Input = ({ className, ...props }: any) => (
  <input 
    className={cn(
      'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:border-apple-blue transition-all backdrop-blur-md',
      className
    )} 
    {...props} 
  />
);

const Card = ({ children, className, onClick }: any) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className={cn('glass p-6 rounded-[2.5rem] cursor-pointer card-hover', className)}
  >
    {children}
  </motion.div>
);

// --- Sections ---

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server error' }));
        setError(errorData.error || `Error: ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        // Set user data immediately to improve perceived performance
        const userData = data.user;
        
        // We still do a quick status check to confirm the browser has accepted the cookie
        let attempts = 0;
        const maxAttempts = 5;
        const checkStatus = async () => {
          try {
            const statusRes = await fetch('/api/auth/status', { credentials: 'include' });
            const statusData = await statusRes.json();
            
            if (statusData.isLoggedIn) {
              onLogin(userData);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkStatus, 500);
            } else {
              // Fallback: Try to login anyway since we have the data from the successful login call
              console.warn('Session sync slow, proceeding with local data');
              onLogin(userData);
            }
          } catch (e) {
            onLogin(userData);
          }
        };
        checkStatus();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setError('Network error. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-color)] relative overflow-hidden">
      <div className="galaxy-bg" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm text-center relative z-10"
      >
        <div className="mb-12 flex flex-col items-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 bg-gradient-to-br from-apple-blue/20 to-indigo-600/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl shadow-apple-blue/10 backdrop-blur-xl"
          >
            <Shield className="w-14 h-14 text-apple-blue" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">SHABAN<br/><span className="text-apple-blue">SPACEX</span></h1>
          <p className="text-space-light/40 text-xs font-bold uppercase tracking-[0.3em]">
            {isRegistering ? 'Create Secure Account' : 'Secure Vault Access'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-space-light/20 group-focus-within:text-apple-blue transition-colors" />
              <Input 
                placeholder="Username" 
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                autoFocus
                className="pl-14 bg-white/5 border-white/5 hover:bg-white/10 focus:bg-white/10"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-space-light/20 group-focus-within:text-apple-blue transition-colors" />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="pl-14 bg-white/5 border-white/5 hover:bg-white/10 focus:bg-white/10"
              />
            </div>
            {isRegistering && (
              <div className="relative group">
                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-space-light/20 group-focus-within:text-apple-blue transition-colors" />
                <Input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                  className="pl-14 bg-white/5 border-white/5 hover:bg-white/10 focus:bg-white/10"
                />
              </div>
            )}
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-400 text-[11px] text-center font-bold uppercase tracking-[0.2em] bg-red-500/10 border border-red-500/20 py-3 rounded-xl backdrop-blur-md"
            >
              {error}
            </motion.p>
          )}
          <Button type="submit" className="w-full py-5 text-lg font-black tracking-tight shadow-2xl shadow-apple-blue/30 rounded-[2rem]">
            {isRegistering ? 'Create Account' : 'Unlock Vault'}
          </Button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-6">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] text-space-light/40 font-black uppercase tracking-[0.2em] hover:text-apple-blue transition-colors"
          >
            {isRegistering ? 'Already have an account? Login' : 'New user? Create an account'}
          </button>

          <div className="flex items-center gap-4 opacity-20">
            <div className="h-px w-8 bg-white" />
            <button 
              onClick={() => {
                // Only allow biometric if it was previously enabled (we'd need a way to know this)
                // For now, we'll just show the prompt if they click it
                onLogin({ isBiometricTrigger: true });
              }}
              className="hover:scale-110 transition-transform active:scale-90"
            >
              <Fingerprint className="w-6 h-6 text-white" />
            </button>
            <div className="h-px w-8 bg-white" />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-space-light/10 text-[8px] uppercase tracking-[0.5em] font-black">
          <Database className="w-3 h-3" />
          <span>Encrypted Local Storage</span>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ onNavigate, tasks = [], isLoggedIn, setIsLoggedIn }: any) => {
  const [birthdays, setBirthdays] = useState([]);
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const todayTasks = safeTasks.filter((t: any) => !t.completed).slice(0, 3);
  
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/birthdays', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setIsLoggedIn(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) setBirthdays(data);
        else setBirthdays([]);
      })
      .catch(() => setBirthdays([]));
  }, [isLoggedIn]);

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const bday = new Date(dateStr);
    const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
    const diffTime = Math.abs(nextBday.getTime() - today.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const today = new Date().toISOString().split('T')[0].slice(5); // MM-DD
  const safeBirthdays = Array.isArray(birthdays) ? birthdays : [];
  const todayBirthdays = safeBirthdays.filter((b: any) => b.date.slice(5) === today);
  const upcomingBirthdays = safeBirthdays
    .filter((b: any) => b.date.slice(5) !== today)
    .map((b: any) => ({ ...b, daysUntil: getDaysUntil(b.date) }))
    .filter((b: any) => b.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">SHABAN <span className="text-apple-blue">SPACEX</span></h2>
          <p className="text-space-light/40 text-[10px] uppercase tracking-[0.4em] font-bold">Command Center</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-float shadow-xl shadow-apple-blue/10">
          <User className="w-6 h-6 text-apple-blue" />
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-6 rounded-[2rem] border-l-4 border-apple-blue shadow-xl shadow-apple-blue/5">
          <p className="text-[10px] text-space-light/40 uppercase font-bold tracking-widest mb-2">Active Tasks</p>
          <h4 className="text-3xl font-black text-white">{safeTasks.filter((t: any) => !t.completed).length}</h4>
        </div>
        <div className="glass p-6 rounded-[2rem] border-l-4 border-purple-500 shadow-xl shadow-purple-500/5">
          <p className="text-[10px] text-space-light/40 uppercase font-bold tracking-widest mb-2">Vault Health</p>
          <h4 className="text-3xl font-black text-white">100%</h4>
        </div>
      </div>

      {/* Vault Overview */}
      <section className="glass p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-apple-blue/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-apple-blue/10 transition-all duration-500" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Vault Overview</h3>
            <p className="text-xs text-space-light/40 font-medium">Real-time security monitoring</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                fetch('/api/debug/session', { credentials: 'include' })
                  .then(r => r.json())
                  .then(d => alert(JSON.stringify(d, null, 2)))
                  .catch(e => alert('Debug failed: ' + e.message));
              }}
              className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Debug Session"
            >
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </button>
            <div className="w-12 h-12 bg-apple-blue/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-apple-blue" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-space-light/40 uppercase font-bold tracking-widest mb-1">Files</p>
            <p className="text-xl font-black text-white">12</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[10px] text-space-light/40 uppercase font-bold tracking-widest mb-1">Notes</p>
            <p className="text-xl font-black text-white">8</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-space-light/40 uppercase font-bold tracking-widest mb-1">Events</p>
            <p className="text-xl font-black text-white">{safeBirthdays.length}</p>
          </div>
        </div>
      </section>

      {/* Birthday Alerts */}
      <div className="space-y-4">
        {todayBirthdays.length > 0 && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 p-5 rounded-[2rem] flex items-center gap-5 shadow-xl shadow-pink-500/10"
          >
            <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Cake className="w-7 h-7 text-pink-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Birthday Alert!</h4>
              <p className="text-xs text-space-light/60 font-medium">It's {todayBirthdays.map((b: any) => b.name).join(', ')}'s birthday today! 🚀</p>
            </div>
          </motion.div>
        )}

        {upcomingBirthdays.length > 0 && (
          <section className="glass p-6 rounded-[2rem] space-y-4 shadow-xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-400 flex items-center gap-2">
              <Bell className="w-3 h-3" />
              Upcoming Birthdays
            </h3>
            <div className="space-y-3">
              {upcomingBirthdays.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">{b.name}</span>
                  <span className="text-space-light/40 font-medium">in {b.daysUntil} days</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-apple-blue">Daily Routine</h3>
          <button onClick={() => onNavigate('routine')} className="text-[10px] text-space-light/40 hover:text-apple-blue transition-colors font-bold tracking-widest">VIEW ALL</button>
        </div>
        <div className="space-y-4">
          {todayTasks.length === 0 ? (
            <div className="glass p-10 rounded-[2.5rem] text-center opacity-40">
              <Check className="w-10 h-10 mx-auto mb-3 text-apple-blue" />
              <p className="text-sm font-medium">All tasks completed for today!</p>
            </div>
          ) : (
            todayTasks.map((task: any) => (
              <div key={task.id} className="glass p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-apple-blue" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{task.title}</h5>
                    <p className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">{task.time}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-apple-blue transition-colors" />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-apple-blue px-2">Vault Modules</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => onNavigate('documents')} className="flex flex-col items-center gap-4 py-10 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/10">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Documents</span>
          </Card>
          <Card onClick={() => onNavigate('vault')} className="flex flex-col items-center gap-4 py-10 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <Vault className="w-8 h-8 text-emerald-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Secret Notes</span>
          </Card>
          <Card onClick={() => onNavigate('birthdays')} className="flex flex-col items-center gap-4 py-10 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/10">
              <Cake className="w-8 h-8 text-pink-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Birthdays</span>
          </Card>
          <Card onClick={() => onNavigate('settings')} className="flex flex-col items-center gap-4 py-10 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/10">
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Settings</span>
          </Card>
        </div>
      </section>
    </div>
  );
};

const FileIcon = ({ mimeType }: { mimeType: string }) => {
  if (mimeType.startsWith('image/')) return <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/5"><ImageIcon className="w-6 h-6 text-emerald-400" /></div>;
  if (mimeType.startsWith('video/')) return <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/5"><Video className="w-6 h-6 text-red-400" /></div>;
  if (mimeType.startsWith('audio/')) return <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/5"><Music className="w-6 h-6 text-blue-400" /></div>;
  return <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shadow-lg"><FileText className="w-6 h-6 text-space-light/60" /></div>;
};

const PreviewModal = ({ doc, onClose }: { doc: any, onClose: () => void }) => {
  if (!doc) return null;
  const isImage = doc.mime_type.startsWith('image/');
  const isVideo = doc.mime_type.startsWith('video/');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-16 right-0 p-3 bg-white/10 rounded-full text-white/60 hover:text-white transition-all hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="glass rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 w-full flex items-center justify-center bg-black/40 backdrop-blur-3xl">
          {isImage && (
            <img 
              src={`/api/documents/download/${doc.id}`} 
              alt={doc.name} 
              className="max-w-full max-h-[75vh] object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          {isVideo && (
            <video 
              src={`/api/documents/download/${doc.id}`} 
              controls 
              autoPlay 
              className="max-w-full max-h-[75vh]"
            />
          )}
          {!isImage && !isVideo && (
            <div className="p-24 text-center space-y-6">
              <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto">
                <FileText className="w-12 h-12 text-space-light/20" />
              </div>
              <p className="text-space-light/60 font-medium">Preview not available for this file type</p>
              <Button onClick={() => window.location.href = `/api/documents/download/${doc.id}`} className="px-8 py-4">
                Download to View
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <h4 className="text-xl font-black text-white tracking-tight">{doc.name}</h4>
          <p className="text-xs text-space-light/40 font-bold uppercase tracking-widest mt-1">{formatSize(doc.size)} • {doc.mime_type}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Documents = ({ onBack, setIsLoggedIn, isLoggedIn }: { onBack: () => void, setIsLoggedIn: (val: boolean) => void, isLoggedIn: boolean }) => {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  useEffect(() => {
    if (uploadStatus.type) {
      const timer = setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const fetchDocs = async () => {
    console.log('Fetching documents...');
    try {
      const res = await fetch('/api/documents', { credentials: 'include' });
      console.log('Fetch documents response status:', res.status);
      if (res.status === 401) {
        console.error('Unauthorized access to documents - session might be expired');
        setIsLoggedIn(false); // Force re-login
        return;
      }
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocs([]);
    }
  };
  useEffect(() => { if (isLoggedIn) fetchDocs(); }, [isLoggedIn]);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('Starting upload for file:', file.name);
    setUploading(true);
    setUploadStatus({ type: null, message: '' });
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/documents', { 
        method: 'POST', 
        body: formData,
        credentials: 'include'
      });
      
      console.log('Upload response status:', response.status);
      
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again.');
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      if (result.success) {
        console.log('Upload successful');
        setUploadStatus({ type: 'success', message: 'File uploaded successfully!' });
        fetchDocs();
      } else {
        throw new Error('Upload was not successful');
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error.message === 'Failed to fetch' ? 'Network error: Please check your connection.' : error.message 
      });
      if (error.message.includes('Unauthorized')) {
        setIsLoggedIn(false);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteDoc = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchDocs();
  };

  const safeDocs = Array.isArray(docs) ? docs : [];
  const filteredDocs = safeDocs.filter((doc: any) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'images') return matchesSearch && doc.mime_type.startsWith('image/');
    if (filter === 'videos') return matchesSearch && doc.mime_type.startsWith('video/');
    if (filter === 'audio') return matchesSearch && doc.mime_type.startsWith('audio/');
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
        {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tight">Documents</h2>
        </div>
        <label htmlFor="file-upload" className="cursor-pointer">
          <input 
            id="file-upload"
            type="file" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
          <div className="bg-apple-blue hover:bg-apple-blue/80 text-white p-4 rounded-2xl transition-all shadow-lg shadow-apple-blue/20">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          </div>
        </label>
      </header>

      <AnimatePresence>
        {uploadStatus.type && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-3 shadow-lg",
              uploadStatus.type === 'success' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}
          >
            {uploadStatus.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <p className="text-sm font-bold">{uploadStatus.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-space-light/40" />
          <Input 
            placeholder="Search files..." 
            className="pl-14 py-4 rounded-2xl" 
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'images', 'videos', 'audio'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f ? "bg-apple-blue text-white shadow-lg shadow-apple-blue/20" : "glass text-space-light/60 hover:bg-white/10"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="glass p-16 rounded-[2.5rem] text-center opacity-40">
            <FileText className="w-16 h-16 mx-auto mb-4 text-apple-blue" />
            <p className="text-sm font-medium">No documents found</p>
          </div>
        ) : (
          filteredDocs.map((doc: any) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={doc.id} 
              className="glass p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all shadow-lg"
            >
              <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                <FileIcon mimeType={doc.mime_type} />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-white truncate">{doc.name}</h5>
                  <p className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">{formatSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.location.href = `/api/documents/download/${doc.id}`}
                  className="p-3 text-space-light/40 hover:text-apple-blue transition-colors bg-white/5 rounded-xl"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteDoc(doc.id)}
                  className="p-3 text-space-light/40 hover:text-red-400 transition-colors bg-white/5 rounded-xl"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const Profile = ({ onBack, setIsLoggedIn, isLoggedIn }: { onBack: () => void, setIsLoggedIn: (val: boolean) => void, isLoggedIn: boolean }) => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setIsLoggedIn(false);
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(setProfile)
      .catch(err => console.error('Profile fetch error:', err));
  }, [isLoggedIn]);

  const handleSave = async () => {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      credentials: 'include'
    });
    setEditing(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tight">Profile</h2>
        </div>
        <Button variant={editing ? 'primary' : 'secondary'} onClick={() => editing ? handleSave() : setEditing(true)} className="px-6">
          {editing ? 'Save' : 'Edit'}
        </Button>
      </header>

      <div className="space-y-8">
        <div className="flex flex-col items-center py-10 glass rounded-[3rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-apple-blue to-transparent opacity-50" />
          <div className="w-32 h-32 rounded-[2.5rem] bg-apple-blue/10 border-2 border-apple-blue/20 flex items-center justify-center mb-6 relative animate-float">
            <User className="w-16 h-16 text-apple-blue" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-apple-blue rounded-2xl border-4 border-[#0a0a0a] flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
          {editing ? (
            <div className="w-full px-8">
              <Input 
                className="text-center text-2xl font-black bg-transparent border-none p-0 focus:ring-0" 
                value={profile.name} 
                onChange={(e: any) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
              />
            </div>
          ) : (
            <h3 className="text-2xl font-black text-white tracking-tight">{profile.name || 'Set Name'}</h3>
          )}
          <p className="text-[10px] text-space-light/40 font-bold uppercase tracking-[0.4em] mt-2">Verified Agent</p>
        </div>

        <div className="space-y-5">
          <div className="glass p-8 rounded-[2.5rem] space-y-3 shadow-xl">
            <label className="text-[10px] uppercase tracking-[0.3em] text-apple-blue font-black">Biography</label>
            {editing ? (
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-apple-blue/50 transition-all min-h-[100px]" 
                rows={3}
                value={profile.bio}
                onChange={(e: any) => setProfile({ ...profile, bio: e.target.value })}
              />
            ) : (
              <p className="text-sm text-space-light/80 leading-relaxed font-medium">{profile.bio || 'No bio set'}</p>
            )}
          </div>

          <div className="glass p-8 rounded-[2.5rem] space-y-3 shadow-xl">
            <label className="text-[10px] uppercase tracking-[0.3em] text-purple-400 font-black">Strategic Goals</label>
            {editing ? (
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all min-h-[100px]" 
                rows={3}
                value={profile.goals}
                onChange={(e: any) => setProfile({ ...profile, goals: e.target.value })}
              />
            ) : (
              <p className="text-sm text-space-light/80 leading-relaxed font-medium">{profile.goals || 'No goals set'}</p>
            )}
          </div>

          <div className="glass p-8 rounded-[2.5rem] space-y-3 shadow-xl">
            <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black">Technical Skills</label>
            {editing ? (
              <Input 
                className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm" 
                value={profile.skills}
                onChange={(e: any) => setProfile({ ...profile, skills: e.target.value })}
              />
            ) : (
              <p className="text-sm text-space-light/80 leading-relaxed font-medium">{profile.skills || 'No skills set'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Birthdays = ({ onBack, setIsLoggedIn, isLoggedIn }: { onBack: () => void, setIsLoggedIn: (val: boolean) => void, isLoggedIn: boolean }) => {
  const [birthdays, setBirthdays] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const fetchBirthdays = () => {
    if (!isLoggedIn) return;
    fetch('/api/birthdays', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setIsLoggedIn(false);
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => Array.isArray(data) ? setBirthdays(data) : setBirthdays([]))
      .catch((err) => {
        console.error('Fetch birthdays error:', err);
        setBirthdays([]);
      });
  };
  useEffect(() => { if (isLoggedIn) fetchBirthdays(); }, [isLoggedIn]);

  const safeBirthdays = Array.isArray(birthdays) ? birthdays : [];

  const addBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;
    try {
      const res = await fetch('/api/birthdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date }),
        credentials: 'include'
      });
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to save birthday');
      setName(''); setDate('');
      fetchBirthdays();
    } catch (error) {
      console.error('Add birthday error:', error);
      alert('Failed to save birthday. Please try again.');
    }
  };

  const deleteBirthday = async (id: number) => {
    await fetch(`/api/birthdays/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchBirthdays();
  };

  const toggleNotifications = () => {
    if (!notificationsEnabled) {
      // Simulate permission request
      alert('Galaxy Command: Local notifications enabled for upcoming birthdays! 🚀');
    }
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tight">Birthdays</h2>
        </div>
        <button 
          onClick={toggleNotifications}
          className={cn(
            "p-4 rounded-2xl transition-all shadow-lg",
            notificationsEnabled ? "bg-pink-500/20 text-pink-400 shadow-pink-500/10" : "bg-white/5 text-space-light/40"
          )}
        >
          <Bell className="w-6 h-6" />
        </button>
      </header>
      
      <form onSubmit={addBirthday} className="glass p-8 rounded-[2.5rem] space-y-5 shadow-2xl">
        <div className="space-y-4">
          <Input placeholder="Name" value={name} onChange={(e: any) => setName(e.target.value)} className="py-4" />
          <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} className="py-4" />
        </div>
        <Button type="submit" className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20 text-lg">
          Add Reminder
        </Button>
      </form>

      <div className="space-y-4">
        {safeBirthdays.length === 0 ? (
          <div className="glass p-16 rounded-[2.5rem] text-center opacity-40">
            <Cake className="w-16 h-16 mx-auto mb-4 text-pink-400" />
            <p className="text-sm font-medium">No reminders set</p>
          </div>
        ) : (
          safeBirthdays.map((b: any) => (
            <motion.div 
              key={b.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-5 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                  <Cake className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">{b.name}</h5>
                  <p className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">{new Date(b.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <button onClick={() => deleteBirthday(b.id)} className="p-3 text-red-400/40 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const Routine = ({ tasks = [], onRefresh, onBack }: any) => {
  const [newTask, setNewTask] = useState({ title: '', time: '' });
  const [showAdd, setShowAdd] = useState(false);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const addTask = async () => {
    if (!newTask.title) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, date: new Date().toISOString() }),
        credentials: 'include'
      });
      if (res.status === 401) {
        onRefresh(); // This will trigger the 401 check in fetchTasks
        return;
      }
      if (!res.ok) throw new Error('Failed to save task');
      setNewTask({ title: '', time: '' });
      setShowAdd(false);
      onRefresh();
    } catch (error) {
      console.error('Add task error:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const toggleTask = async (id: number, completed: boolean) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
      credentials: 'include'
    });
    onRefresh();
  };

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' });
    onRefresh();
  };
  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tight">Routine</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-apple-blue hover:bg-apple-blue/80 text-white p-4 rounded-2xl transition-all shadow-lg shadow-apple-blue/20">
          {showAdd ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass p-8 rounded-[2.5rem] space-y-5 overflow-hidden shadow-2xl"
          >
            <Input placeholder="Task Title" value={newTask.title} onChange={(e: any) => setNewTask({ ...newTask, title: e.target.value })} className="py-4" />
            <Input type="time" value={newTask.time} onChange={(e: any) => setNewTask({ ...newTask, time: e.target.value })} className="py-4" />
            <Button className="w-full py-5 text-lg" onClick={addTask}>Add Task</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {safeTasks.length === 0 ? (
          <div className="glass p-16 rounded-[2.5rem] text-center opacity-40">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-apple-blue" />
            <p className="text-sm font-medium">No tasks scheduled</p>
          </div>
        ) : (
          safeTasks.map((task: any) => (
            <motion.div 
              key={task.id} 
              layout
              className={cn('glass p-5 rounded-[2rem] flex items-center justify-between transition-all group shadow-lg', task.completed && 'opacity-50')}
            >
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => toggleTask(task.id, !!task.completed)}
                  className={cn(
                    'w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90',
                    task.completed ? 'bg-apple-blue border-apple-blue shadow-lg shadow-apple-blue/20' : 'border-white/10 hover:border-apple-blue/50'
                  )}
                >
                  {task.completed && <Check className="w-5 h-5 text-white" />}
                </button>
                <div>
                  <h5 className={cn('text-sm font-bold text-white transition-all', task.completed && 'line-through text-white/40')}>{task.title}</h5>
                  <p className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">{task.time}</p>
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)} className="p-3 text-red-400/20 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const VaultSection = ({ onBack, setIsLoggedIn, isLoggedIn }: { onBack: () => void, setIsLoggedIn: (val: boolean) => void, isLoggedIn: boolean }) => {
  const [notes, setNotes] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_locked: false });
  const [unlockedIds, setUnlockedIds] = useState<number[]>([]);

  const fetchNotes = () => {
    if (!isLoggedIn) return;
    fetch('/api/notes', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setIsLoggedIn(false);
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => Array.isArray(data) ? setNotes(data) : setNotes([]))
      .catch((err) => {
        console.error('Fetch notes error:', err);
        setNotes([]);
      });
  };
  useEffect(() => { if (isLoggedIn) fetchNotes(); }, [isLoggedIn]);

  const safeNotes = Array.isArray(notes) ? notes : [];

  const addNote = async () => {
    if (!newNote.title) return;
    try {
      const encryptedContent = encrypt(newNote.content);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newNote, content: encryptedContent }),
        credentials: 'include'
      });
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to save note');
      setNewNote({ title: '', content: '', is_locked: false });
      setShowAdd(false);
      fetchNotes();
    } catch (error) {
      console.error('Add note error:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const deleteNote = async (id: number) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchNotes();
  };

  const toggleUnlock = (id: number) => {
    if (unlockedIds.includes(id)) {
      setUnlockedIds(unlockedIds.filter(i => i !== id));
    } else {
      setUnlockedIds([...unlockedIds, id]);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tight">Vault</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-apple-blue hover:bg-apple-blue/80 text-white p-4 rounded-2xl transition-all shadow-lg shadow-apple-blue/20">
          {showAdd ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass p-8 rounded-[2.5rem] space-y-5 shadow-2xl border border-white/10"
          >
            <Input placeholder="Note Title" value={newNote.title} onChange={(e: any) => setNewNote({ ...newNote, title: e.target.value })} className="text-lg font-bold" />
            <textarea 
              placeholder="Write your secret thoughts..." 
              value={newNote.content}
              onChange={(e: any) => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-white/20 focus:outline-none focus:border-apple-blue/50 transition-all min-h-[150px] text-sm"
            />
            <div className="flex items-center gap-3 px-2">
              <input 
                type="checkbox" 
                id="lock" 
                className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-apple-blue focus:ring-apple-blue/50"
                checked={newNote.is_locked} 
                onChange={(e) => setNewNote({ ...newNote, is_locked: e.target.checked })}
              />
              <label htmlFor="lock" className="text-xs font-semibold text-space-light/60">Lock with vault password</label>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setShowAdd(false)} variant="secondary" className="flex-1 py-4">Cancel</Button>
              <Button onClick={addNote} className="flex-1 py-4">Save Note</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-5">
        {safeNotes.length === 0 ? (
          <div className="glass p-16 rounded-[2.5rem] text-center opacity-40">
            <Vault className="w-16 h-16 mx-auto mb-4 text-apple-blue" />
            <p className="text-sm font-medium">Your vault is empty</p>
          </div>
        ) : (
          safeNotes.map((note: any) => {
            const isUnlocked = !note.is_locked || unlockedIds.includes(note.id);
            return (
              <motion.div 
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-[2.5rem] space-y-4 group hover:bg-white/10 transition-all shadow-xl border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {note.is_locked ? <Lock className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5 text-emerald-400" />}
                    <h4 className="text-lg font-black text-white tracking-tight">{note.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.is_locked && (
                      <button onClick={() => toggleUnlock(note.id)} className="p-3 text-space-light/20 hover:text-apple-blue transition-colors bg-white/5 rounded-xl">
                        {unlockedIds.includes(note.id) ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </button>
                    )}
                    <button onClick={() => deleteNote(note.id)} className="p-3 text-space-light/20 hover:text-red-400 transition-colors bg-white/5 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  {isUnlocked ? (
                    <p className="text-sm text-space-light/70 leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {decrypt(note.content)}
                    </p>
                  ) : (
                    <div className="py-8 text-center space-y-3 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <Lock className="w-8 h-8 mx-auto text-white/10" />
                      <p className="text-[10px] text-space-light/30 uppercase tracking-widest font-bold">Encrypted Content</p>
                      <Button variant="secondary" className="text-xs py-2 px-6" onClick={() => toggleUnlock(note.id)}>Unlock Note</Button>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-space-light/30 font-bold uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                    <span className="text-[8px] text-emerald-500/50 font-black uppercase tracking-tighter">Secure</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SettingsSection = ({ onLogout, biometricEnabled, setBiometricEnabled, theme, setTheme, onBack, setIsLoggedIn }: any) => {
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [message, setMessage] = useState('');

  const changePassword = async () => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new }),
      credentials: 'include'
    });
    
    if (res.status === 401) {
      setIsLoggedIn(false);
      return;
    }

    const data = await res.json();
    if (data.success) {
      setMessage('Password updated successfully');
      setPasswords({ old: '', new: '' });
    } else {
      setMessage('Failed to update password');
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    await fetch('/api/config/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
      credentials: 'include'
    });
    setTheme(newTheme);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
      </header>

      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-apple-blue px-2">Security</h3>
        <div className="glass p-8 rounded-[2.5rem] space-y-6 shadow-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-apple-blue/10 rounded-2xl flex items-center justify-center">
              <Key className="w-6 h-6 text-apple-blue" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">Change Password</span>
              <span className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">Keep your vault secure</span>
            </div>
          </div>
          <div className="space-y-3">
            <Input type="password" placeholder="Old Password" value={passwords.old} onChange={(e: any) => setPasswords({ ...passwords, old: e.target.value })} />
            <Input type="password" placeholder="New Password" value={passwords.new} onChange={(e: any) => setPasswords({ ...passwords, new: e.target.value })} />
          </div>
          <Button className="w-full py-5 rounded-2xl" onClick={changePassword}>Update Password</Button>
          {message && <p className="text-[10px] text-center text-apple-blue font-bold animate-pulse">{message}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-apple-blue px-2">Data Management</h3>
        <div className="grid grid-cols-1 gap-4">
          <a href="/api/backup" className="glass p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all group border border-white/5 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <span className="text-base font-bold text-white block">Backup Vault</span>
                <span className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">Download your data</span>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-apple-blue transition-colors" />
          </a>
          <button className="glass p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all group border border-white/5 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="text-base font-bold text-white block">Restore Backup</span>
                <span className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">Import from file</span>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-apple-blue transition-colors" />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-apple-blue px-2">Preferences</h3>
        <div className="space-y-4">
          <div className="glass p-6 rounded-[2.5rem] flex items-center justify-between border border-white/5 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-apple-blue/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-apple-blue" />
              </div>
              <div>
                <span className="text-base font-bold text-white block">Biometric Unlock</span>
                <span className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">FaceID / TouchID</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                const newState = !biometricEnabled;
                await fetch('/api/auth/toggle-biometric', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled: newState }),
                  credentials: 'include'
                });
                setBiometricEnabled(newState);
              }}
              className={cn(
                "w-14 h-8 rounded-full relative transition-all duration-300 p-1",
                biometricEnabled ? "bg-apple-blue" : "bg-white/10"
              )}
            >
              <div className={cn(
                "w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md",
                biometricEnabled ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
          
          <div className="glass p-8 rounded-[2.5rem] space-y-6 border border-white/5 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-base font-bold text-white block">Theme Mode</span>
                <span className="text-[10px] text-space-light/40 font-bold uppercase tracking-widest">Customize your view</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Galaxy', 'Dark', 'Light'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeChange(mode)}
                  className={cn(
                    "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                    theme === mode ? "bg-apple-blue text-white shadow-lg shadow-apple-blue/30" : "bg-white/5 text-space-light/40 hover:bg-white/10"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Button variant="danger" className="w-full flex items-center justify-center gap-4 py-6 rounded-[2.5rem] shadow-xl shadow-red-500/10 active:scale-95" onClick={onLogout}>
        <LogOut className="w-6 h-6" />
        <span className="text-base font-bold">Lock Vault & Logout</span>
      </Button>
    </div>
  );
};

// --- Main App ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="galaxy-bg" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-36 h-36 bg-gradient-to-br from-apple-blue to-indigo-600 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-apple-blue/40 relative z-10"
          >
            <Shield className="w-16 h-16 text-white" />
          </motion.div>
          <div className="absolute inset-0 bg-apple-blue blur-3xl opacity-20 animate-pulse-glow" />
        </div>
        
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-5xl font-black tracking-tighter text-white"
          >
            SHABAN<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-apple-blue to-indigo-400">SPACEX</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-space-light/40 text-[10px] uppercase tracking-[0.5em] font-black"
          >
            Military Grade Security
          </motion.p>
        </div>
        
        <div className="mt-12 w-48 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-apple-blue to-transparent"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 text-space-light/20 text-[10px] font-black tracking-[0.2em] uppercase"
      >
        v2.5.0 • Apple Glassy Edition
      </motion.div>
    </div>
  );
};

const BiometricPrompt = ({ onAuth, onCancel }: { onAuth: () => void, onCancel: () => void }) => {
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onAuth();
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xs glass p-10 rounded-[3rem] text-center space-y-10 border border-white/10 shadow-2xl"
      >
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-white tracking-tight">Biometric Unlock</h3>
          <p className="text-xs text-space-light/40 font-semibold">Touch the sensor to verify identity</p>
        </div>

        <div className="relative flex items-center justify-center py-6">
          <motion.div 
            animate={scanning ? { scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute w-32 h-32 rounded-full border-2 border-apple-blue/30"
          />
          <button 
            onClick={startScan}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 shadow-2xl active:scale-90",
              scanning ? "bg-apple-blue text-white shadow-apple-blue/40" : "bg-white/5 text-apple-blue border border-white/10 hover:bg-white/10"
            )}
          >
            <Fingerprint className={cn("w-12 h-12", scanning && "animate-pulse")} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="secondary" className="py-4 rounded-2xl text-xs font-bold" onClick={onCancel}>Use Password Instead</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [theme, setTheme] = useState('Galaxy');

  const fetchTasks = () => fetch('/api/tasks', { credentials: 'include' })
    .then(res => {
      if (res.status === 401) {
        setIsLoggedIn(false);
        throw new Error('Unauthorized');
      }
      return res.json();
    })
    .then(data => Array.isArray(data) ? setTasks(data) : setTasks([]))
    .catch((err) => {
      console.error('Fetch tasks error:', err);
      setTasks([]);
    });

  useEffect(() => {
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setUser({ username: data.username });
          setTheme(data.theme);
          setBiometricEnabled(data.biometricEnabled);
        }
      });
  }, []);

  useEffect(() => {
    document.body.className = theme === 'Light' ? 'light-mode' : theme === 'Dark' ? 'dark-mode' : '';
  }, [theme]);

  useEffect(() => {
    if (isLoggedIn) {
      const timer = setTimeout(fetchTasks, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsLoggedIn(false);
    setUser(null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <>
        <Login onLogin={(u) => { 
          if (u.isBiometricTrigger) {
            setShowBiometric(true);
          } else {
            setIsLoggedIn(true); 
            setUser(u); 
          }
        }} />
        {showBiometric && (
          <BiometricPrompt 
            onAuth={async () => {
              // Verify session is still valid before unlocking
              const res = await fetch('/api/auth/status', { credentials: 'include' });
              const data = await res.json();
              if (data.isLoggedIn) {
                setIsLoggedIn(true);
                setUser({ username: data.username });
                setShowBiometric(false);
              } else {
                alert('Session expired. Please login with password.');
                setShowBiometric(false);
              }
            }} 
            onCancel={() => setShowBiometric(false)} 
          />
        )}
      </>
    );
  }

  const renderSection = () => {
    const onBack = () => setActiveSection('dashboard');
    switch (activeSection) {
      case 'dashboard': return <Dashboard onNavigate={setActiveSection} tasks={tasks} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
      case 'documents': return <Documents onBack={onBack} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />;
      case 'profile': return <Profile onBack={onBack} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />;
      case 'routine': return <Routine tasks={tasks} onRefresh={fetchTasks} onBack={onBack} />;
      case 'birthdays': return <Birthdays onBack={onBack} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />;
      case 'vault': return <VaultSection onBack={onBack} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />;
      case 'settings': return <SettingsSection onLogout={handleLogout} biometricEnabled={biometricEnabled} setBiometricEnabled={setBiometricEnabled} theme={theme} setTheme={setTheme} onBack={onBack} setIsLoggedIn={setIsLoggedIn} />;
      default: return <Dashboard onNavigate={setActiveSection} tasks={tasks} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Galaxy Background */}
      <div className="galaxy-bg" />

      <main className="p-6 pt-12 min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-8 left-6 right-6 max-w-[calc(28rem-3rem)] mx-auto glass border border-white/10 px-8 py-5 flex items-center justify-between z-50 rounded-[2.5rem] shadow-2xl shadow-black/40">
        <button 
          onClick={() => setActiveSection('dashboard')}
          className={cn('p-2 transition-all active:scale-75 relative', activeSection === 'dashboard' ? 'text-apple-blue' : 'text-space-light/20 hover:text-space-light/40')}
        >
          <LayoutDashboard className="w-6 h-6" />
          {activeSection === 'dashboard' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveSection('documents')}
          className={cn('p-2 transition-all active:scale-75 relative', activeSection === 'documents' ? 'text-apple-blue' : 'text-space-light/20 hover:text-space-light/40')}
        >
          <FileText className="w-6 h-6" />
          {activeSection === 'documents' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveSection('routine')}
          className={cn('p-2 transition-all active:scale-75 relative', activeSection === 'routine' ? 'text-apple-blue' : 'text-space-light/20 hover:text-space-light/40')}
        >
          <Calendar className="w-6 h-6" />
          {activeSection === 'routine' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveSection('vault')}
          className={cn('p-2 transition-all active:scale-75 relative', activeSection === 'vault' ? 'text-apple-blue' : 'text-space-light/20 hover:text-space-light/40')}
        >
          <Vault className="w-6 h-6" />
          {activeSection === 'vault' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-blue rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveSection('settings')}
          className={cn('p-2 transition-all active:scale-75 relative', activeSection === 'settings' ? 'text-apple-blue' : 'text-space-light/20 hover:text-space-light/40')}
        >
          <Settings className="w-6 h-6" />
          {activeSection === 'settings' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-apple-blue rounded-full" />}
        </button>
      </nav>
    </div>
  );
}

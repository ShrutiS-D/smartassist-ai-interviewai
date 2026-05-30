import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, LogOut, LayoutDashboard, Database, ClipboardList, Key, UserCheck, MessageSquare, Briefcase, Award } from 'lucide-react';
import { User as AppUser, Chatbot } from './types';
import DashboardAnalytics from './components/DashboardAnalytics';
import BotCreator from './components/BotCreator';
import KnowledgeManager from './components/KnowledgeManager';
import TranscriptsViewer from './components/TranscriptsViewer';
import ChatWidgetDemo from './components/ChatWidgetDemo';
import LandingPage from './pages/LandingPage';

export default function App() {
  // Navigation Routing States
  // 'landing' | 'sandbox' | 'admin'
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'sandbox' | 'admin'>('landing');
  const [adminTab, setAdminTab] = useState<'analytics' | 'bots' | 'knowledge' | 'transcripts'>('analytics');

  // Authenticated User session states
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth Inputs
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Chatbots Global registries state
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedKnowledgeBotId, setSelectedKnowledgeBotId] = useState<string>('');
  const [editingBot, setEditingBot] = useState<Chatbot | undefined>(undefined);

  // Check storage on boot
  useEffect(() => {
    const storedUser = localStorage.getItem('smartassist_user');
    const storedToken = localStorage.getItem('smartassist_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/chatbots');
      if (res.ok) {
        const data = await res.json();
        setChatbots(data);
        if (data.length > 0) {
          setSelectedKnowledgeBotId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chatbots:', err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const payload = isRegister 
      ? { name: authName, email: authEmail, password: authPassword, role: 'admin' }
      : { email: authEmail, password: authPassword };

    const apiRoute = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
        setToken(json.token);
        localStorage.setItem('smartassist_user', JSON.stringify(json.user));
        localStorage.setItem('smartassist_token', json.token);
        // Clear login form
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
      } else {
        const errJson = await res.json();
        setAuthError(errJson.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setAuthError('Connection failed. Server did not reply.');
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePresetLogin = () => {
    setAuthEmail('hr@company.com');
    setAuthPassword('password123');
    setIsRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartassist_user');
    localStorage.removeItem('smartassist_token');
    setCurrentRoute('landing');
  };

  // Callback triggers when a chatbot is created/updated
  const handleBotSaved = (savedBot: Chatbot) => {
    // Reload bots list
    fetchBots();
    // Move to knowledge tab
    setSelectedKnowledgeBotId(savedBot.id);
    setAdminTab('knowledge');
    setEditingBot(undefined);
  };

  const handleBotUpdate = (updatedBot: Chatbot) => {
    setChatbots(prev => prev.map(c => c.id === updatedBot.id ? updatedBot : c));
  };

  const handleTriggerEdit = (bot: Chatbot) => {
    setEditingBot(bot);
    setAdminTab('bots');
  };

  const activeKnowledgeBot = chatbots.find(c => c.id === selectedKnowledgeBotId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors antialiased">
      
      {/* Universal Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentRoute('landing')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-medium text-[15px] text-slate-900 tracking-tight block">SmartAssist AI Suite</span>
              <span className="text-[10px] text-slate-400 font-sans tracking-widest uppercase block border-t border-slate-100 font-bold">Custom Agent Platform</span>
            </div>
          </div>

          <nav className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setCurrentRoute('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${currentRoute === 'landing' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentRoute('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${currentRoute === 'sandbox' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Interactive Sandbox
            </button>

            <button
              onClick={() => setCurrentRoute('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors ${currentRoute === 'admin' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-650 hover:bg-slate-50'}`}
            >
              {user ? 'Admin Console' : 'HR / Admin Logins'}
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                title="Log out session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Orchestrator Screen Body area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between shrink-0">
        
        {currentRoute === 'landing' && (
          <LandingPage
            onEnterSandbox={() => setCurrentRoute('sandbox')}
            onEnterAdmin={() => setCurrentRoute('admin')}
          />
        )}

        {currentRoute === 'sandbox' && (
          <div className="space-y-6">
            <div className="bg-white/50 p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-display font-medium text-slate-900">Agent Playroom & Sandbox</h2>
                <p className="text-xs text-slate-450 mt-0.5">Test configured AI dialogue, prompt instructions, PDF grounding context and scoring pipelines.</p>
              </div>
              <button
                onClick={() => setCurrentRoute('admin')}
                className="text-xs font-sans font-bold text-indigo-600 hover:text-indigo-800"
              >
                Assemble a new bot &rarr;
              </button>
            </div>
            {chatbots.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
                <p className="text-xs italic">No deployed AI agents detected in the database. Please navigate to the Admin page to configure your first chatbot.</p>
              </div>
            ) : (
              <ChatWidgetDemo chatbots={chatbots} />
            )}
          </div>
        )}

        {currentRoute === 'admin' && (
          !user ? (
            /* Authentication Screen */
            <div className="max-w-md w-full mx-auto my-12 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="text-center space-y-2">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl inline-block">
                  <Key className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-display font-semibold text-slate-900">Admin Authentication</h3>
                <p className="text-xs text-slate-450 leading-relaxed font-sans">
                  Register or login on JWT security tokens. Role-Based permissions apply to conversation records and recruitment evaluation reports.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-sans rounded-xl">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-xs">
                {isRegister && (
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Hiring Manager Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    placeholder="hr@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex justify-center items-center cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Verifying session...' : isRegister ? 'Provision HR Admin Domain' : 'Challenge Credentials'}
                </button>

                {/* Simulated quick start block */}
                <div className="p-3.5 bg-amber-55/40 border border-amber-100 rounded-xl text-slate-550 leading-relaxed text-[11px] text-center space-y-1">
                  <p className="font-bold text-amber-900 flex justify-center items-center">
                    <UserCheck className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                    Quick Tester Preset Credentials
                  </p>
                  <p>Skip signing up! Auto-populate credentials:</p>
                  <button
                    type="button"
                    onClick={handlePresetLogin}
                    className="mt-1 px-3 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded font-semibold text-amber-800 text-[10px] cursor-pointer"
                  >
                    Load Demo Admin (Password: password123)
                  </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setAuthError('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-sans font-semibold text-xs transition-colors"
                  >
                    {isRegister ? 'Already have an admin domain? Sign in' : 'Create new administrator workspace &rarr;'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Secure Admin Dashboard Console */
            <div className="space-y-6">
              
              {/* Profile banner bar */}
              <div className="p-4 bg-white/70 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold font-mono">
                    H
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-semibold text-slate-900">Secure Admin Workspace</h3>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Manager: <span className="font-bold text-slate-700">{user.name}</span> &bull; Verified ID: <span className="font-bold text-slate-700">{user.email}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentRoute('sandbox')}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-650 flex items-center shadow-xs cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                  Launch Sandbox Widgets
                </button>
              </div>

              {/* Master Dashboard Console tabs navigation */}
              <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                
                {/* Horizontal / Sidebar Tabs list */}
                <div className="lg:w-[220px] p-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible shrink-0 bg-slate-50/20">
                  <button
                    onClick={() => setAdminTab('analytics')}
                    className={`flex items-center justify-center lg:justify-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${adminTab === 'analytics' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Insight Dashboards
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('bots');
                      setEditingBot(undefined);
                    }}
                    className={`flex items-center justify-center lg:justify-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${adminTab === 'bots' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Custom Agent Blueprint
                  </button>

                  <button
                    onClick={() => setAdminTab('knowledge')}
                    className={`flex items-center justify-center lg:justify-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${adminTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Knowledge Libraries
                  </button>

                  <button
                    onClick={() => setAdminTab('transcripts')}
                    className={`flex items-center justify-center lg:justify-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${adminTab === 'transcripts' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Conversation Audts
                  </button>
                </div>

                {/* Active Tab Panel renderer */}
                <div className="flex-1 p-5 sm:p-6 overflow-x-hidden min-h-[460px]">
                  {adminTab === 'analytics' && token && (
                    <DashboardAnalytics token={token} />
                  )}

                  {adminTab === 'bots' && token && (
                    <div className="space-y-6">
                      <BotCreator
                        token={token}
                        onCreated={handleBotSaved}
                        editingBot={editingBot}
                        onCancelEdit={() => setEditingBot(undefined)}
                      />
                      
                      {/* Active Bots Inventory table */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                          <h4 className="text-xs font-sans font-bold text-slate-700">Depployed Chatbots Inventory</h4>
                          <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-mono font-bold">{chatbots.length} active</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {chatbots.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400 italic">No chatbots deployed yet. Custom agents will appear here.</div>
                          ) : (
                            chatbots.map((bot) => (
                              <div key={bot.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-slate-800">{bot.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${bot.type === 'interview' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>
                                      {bot.type === 'interview' ? 'InterviewAI HR' : 'SmartAssist FAQ'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-450 mt-0.5 leading-normal max-w-lg">{bot.description || 'No custom description provided.'}</p>
                                </div>
                                <div className="flex space-x-2 shrink-0">
                                  <button
                                    onClick={() => handleTriggerEdit(bot)}
                                    className="px-2.5 py-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[11px] font-sans font-semibold cursor-pointer"
                                  >
                                    Edit Settings
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm('Are you absolute sure you want to completely delete this bot and all associated conversations? This action cannot be reversed.')) {
                                        try {
                                          const res = await fetch(`/api/chatbots/${bot.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          });
                                          if (res.ok) {
                                            fetchBots();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded text-[11px] font-sans font-semibold cursor-pointer"
                                  >
                                    Retire Bot
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {adminTab === 'knowledge' && token && (
                    <div className="space-y-6">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="text-xs font-sans font-bold text-slate-700">Select Chatbot to manage catalogs</h4>
                          <p className="text-[10px] text-slate-450 mt-0.5">Ground answers based on chatbot specific documents and FAQ sheets.</p>
                        </div>

                        <select
                          value={selectedKnowledgeBotId}
                          onChange={(e) => setSelectedKnowledgeBotId(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans bg-white text-slate-700 focus:outline-none"
                        >
                          {chatbots.map(b => (
                            <option key={b.id} value={b.id}>
                              [{b.type === 'interview' ? 'InterviewAI' : 'Support'}] {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {activeKnowledgeBot ? (
                        <KnowledgeManager
                          token={token}
                          chatbot={activeKnowledgeBot}
                          onUpdate={handleBotUpdate}
                        />
                      ) : (
                        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs italic">
                          Please select or create an AI Chatbot first.
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab === 'transcripts' && token && (
                    <TranscriptsViewer token={token} />
                  )}
                </div>

              </div>

            </div>
          )
        )}

      </main>

      {/* Footer credits line */}
      <footer className="py-4 border-t border-slate-200 bg-white leading-none text-center shrink-0">
        <p className="text-[10px] font-sans text-slate-400">
          SmartAssist AI & InterviewAI Suite &bull; {new Date().getFullYear()} Build Portfolio
        </p>
      </footer>

    </div>
  );
}

import React, { useState } from 'react';
import { Bot, HelpCircle, Save, Plus, ArrowRight, LayoutTemplate, Briefcase, Settings } from 'lucide-react';
import { Chatbot } from '../types';

interface BotCreatorProps {
  token: string;
  onCreated: (chatbot: Chatbot) => void;
  editingBot?: Chatbot;
  onCancelEdit?: () => void;
}

const PRIMARY_COLORS = [
  { name: 'Indigo Blend', value: 'indigo', bgClass: 'bg-indigo-600', textClass: 'text-indigo-600' },
  { name: 'Forest Emerald', value: 'emerald', bgClass: 'bg-emerald-600', textClass: 'text-emerald-600' },
  { name: 'Teal Lagoon', value: 'teal', bgClass: 'bg-teal-600', textClass: 'text-teal-600' },
  { name: 'Classic Charcoal', value: 'slate', bgClass: 'bg-slate-700', textClass: 'text-slate-700' },
  { name: 'Sleek Sky', value: 'sky', bgClass: 'bg-sky-500', textClass: 'text-sky-500' }
];

export default function BotCreator({ token, onCreated, editingBot, onCancelEdit }: BotCreatorProps) {
  const [name, setName] = useState(editingBot?.name || '');
  const [description, setDescription] = useState(editingBot?.description || '');
  const [systemInstruction, setSystemInstruction] = useState(editingBot?.systemInstruction || 'You are an AI helpful assistant...');
  const [type, setType] = useState<'support' | 'interview'>(editingBot?.type || 'support');
  const [jobTitle, setJobTitle] = useState(editingBot?.jobTitle || '');
  const [jobRequirements, setJobRequirements] = useState(editingBot?.jobRequirements || '');

  // Theme configuration
  const [primaryColor, setPrimaryColor] = useState(editingBot?.theme?.primaryColor || 'indigo');
  const [welcomeMessage, setWelcomeMessage] = useState(editingBot?.theme?.welcomeMessage || 'Hello! How can I assist you today?');
  const [isDark, setIsDark] = useState(editingBot?.theme?.isDark || false);
  const [botName, setBotName] = useState(editingBot?.theme?.botName || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('A name is required for your AI agent.');
      return;
    }
    setError('');
    setSaving(true);

    const payload = {
      name,
      description,
      systemInstruction,
      type,
      theme: {
        primaryColor,
        welcomeMessage,
        isDark,
        botName: botName || name
      },
      jobTitle: type === 'interview' ? jobTitle : undefined,
      jobRequirements: type === 'interview' ? jobRequirements : undefined
    };

    try {
      const url = editingBot ? `/api/chatbots/${editingBot.id}` : '/api/chatbots';
      const method = editingBot ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        onCreated(json);
        if (!editingBot) {
          // Clear form
          setName('');
          setDescription('');
          setJobTitle('');
          setJobRequirements('');
          setWelcomeMessage('Hello! How can I assist you today?');
        }
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Something went wrong while saving your AI agent.');
      }
    } catch (err) {
      setError('Check server connectivity. API route did not respond.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center">
            <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-600" />
            {editingBot ? 'Configure Bot Parameters' : 'Deploy a new AI Agent'}
          </h3>
          <p className="text-xs text-slate-400">Specify operational constraints, themes, and goals.</p>
        </div>
        {editingBot && (
          <button
            onClick={onCancelEdit}
            className="text-xs font-sans text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-sans rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Block - General parameters */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-700 mb-1">AI Agent Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Support Bot"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!botName) setBotName(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-700 mb-1">Agent Purpose / Description</label>
              <input
                type="text"
                placeholder="e.g. Website Customer Guide"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-700 mb-1">Agent Model Specialization</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setType('support');
                    if (welcomeMessage.includes('interview')) {
                      setWelcomeMessage('Hello! How can I assist you with our services today?');
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 border rounded-xl text-center cursor-pointer transition-colors ${type === 'support' ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Bot className="w-5 h-5 mb-1 text-inherit" />
                  <span className="text-xs font-sans">SmartAssist Bot</span>
                  <span className="text-[9px] text-slate-400 font-medium font-sans mt-0.5">Website FAQ & Document search</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('interview');
                    setWelcomeMessage('Welcome! I have analyzed your resume carefully. When you are ready, say hello to start your screening chat.');
                  }}
                  className={`flex flex-col items-center justify-center p-3 border rounded-xl text-center cursor-pointer transition-colors ${type === 'interview' ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <Briefcase className="w-5 h-5 mb-1 text-inherit" />
                  <span className="text-xs font-sans">InterviewAI</span>
                  <span className="text-[9px] text-slate-400 font-medium font-sans mt-0.5">HR Screening & Applicant Evaluation</span>
                </button>
              </div>
            </div>

            {type === 'support' ? (
              <div>
                <label className="block text-xs font-sans font-semibold text-slate-700 mb-1 flex items-center">
                  System Instruction Override
                  <HelpCircle className="w-3 h-3 text-slate-400 ml-1 cursor-help" title="Guides raw tone and behavior constraints of the Gemini model" />
                </label>
                <textarea
                  rows={4}
                  placeholder="You are Acme support agent. Answer questions politely using standard materials."
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="text-xs font-display font-medium text-slate-700 flex items-center">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Interview Target Specifications
                </h4>
                
                <div>
                  <label className="block text-[10px] font-sans font-semibold text-slate-500 mb-0.5">Target Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Architect"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-sans font-semibold text-slate-500 mb-0.5">Role Specifications / Core Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 4+ yrs React framework, Typescript type models, state manager evaluation logic"
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Block - Widgets Customization Theme */}
          <div className="space-y-4 p-5 bg-slate-50/50 border border-slate-100 rounded-xl">
            <h4 className="text-xs font-sans font-bold text-slate-700 mb-2 flex items-center">
              <Settings className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Widget Branding & Themes
            </h4>

            <div>
              <label className="block text-xs font-sans text-slate-500 mb-1">Widget Avatar Bot Title</label>
              <input
                type="text"
                placeholder="e.g. Acme Support Center"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-slate-500 mb-1">Welcome Text</label>
              <textarea
                rows={2}
                placeholder="Hello! Welcome..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-slate-500 mb-1.5">Primary Theme Accents</label>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setPrimaryColor(col.value)}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-sans border cursor-pointer transition-all ${primaryColor === col.value ? 'ring-2 ring-offset-1 ring-slate-800 font-bold bg-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${col.bgClass}`} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isDarkCheck"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isDarkCheck" className="text-xs font-sans text-slate-600 font-medium">Use dark interface inside widget by default</label>
            </div>

            {/* Simulated Live Widget Preview Box */}
            <div className={`mt-4 p-4 border border-slate-200 rounded-xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white text-slate-800'}`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${primaryColor === 'indigo' ? 'bg-indigo-500' : primaryColor === 'emerald' ? 'bg-emerald-500' : primaryColor === 'teal' ? 'bg-teal-500' : primaryColor === 'sky' ? 'bg-sky-500' : 'bg-slate-500'}`} />
                  <span className="text-[11px] font-sans font-bold">{botName || name || 'Example Bot'}</span>
                </div>
                <span className="text-[9px] font-sans px-1.5 py-0.5 uppercase rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-500 tracking-wider">Preview widget</span>
              </div>
              <p className="text-[11px] font-sans mt-3 text-slate-500 dark:text-slate-400 font-normal italic">
                "{welcomeMessage || 'How can I assist you today?'}"
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-sans font-semibold rounded-lg flex items-center shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : editingBot ? 'Save System Config' : 'Deploy Operational Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}

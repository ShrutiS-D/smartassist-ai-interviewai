import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquare, Send, Mic, RefreshCw, Star, Download, Mail, ArrowLeft, Sun, Moon, Sparkles, CheckCircle, Award } from 'lucide-react';
import { Chatbot, ChatSession, ChatMessage } from '../types';

interface ChatWidgetDemoProps {
  chatbots: Chatbot[];
}

export default function ChatWidgetDemo({ chatbots }: ChatWidgetDemoProps) {
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  
  // Chat input
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Widget aesthetic choices
  const [chatbotThemeDark, setChatbotThemeDark] = useState(false);

  // Forms states
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [startSessionStep, setStartSessionStep] = useState(true);

  // Feedback/Ratings Forms
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Evaluation results for candidate
  const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set default selected bot
  useEffect(() => {
    if (chatbots.length > 0 && !selectedBotId) {
      setSelectedBotId(chatbots[0].id);
      setChatbotThemeDark(chatbots[0].theme?.isDark || false);
    }
  }, [chatbots]);

  const activeBot = chatbots.find(b => b.id === selectedBotId);

  // Auto Scroll message log
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId) return;
    
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: selectedBotId,
          userName: visitorName || 'Visitor',
          userEmail: visitorEmail || 'visitor@example.com'
        })
      });

      if (res.ok) {
        const json = await res.json();
        setActiveSession(json);
        setStartSessionStep(false);
        setChatbotThemeDark(activeBot?.theme?.isDark || false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || isTyping) return;

    const textToSend = inputText;
    setInputText('');
    setIsTyping(true);

    // Append user message locally first for instant feedback experience
    const tempUserMsg: ChatMessage = {
      id: `local-${Math.random()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempUserMsg]
    } : null);

    try {
      const res = await fetch(`/api/conversations/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });

      if (res.ok) {
        const json = await res.json();
        // Replace with official session object returned by server
        setActiveSession(json.conversation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // HTML Web Speech Recognition API
  const handleSimulateSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support standard speech recognition. Please try Chrome/Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
    };

    recognition.start();
  };

  // Close Conversation & Trigger AI evaluation scoring card
  const handleFinalizeChat = async () => {
    if (!activeSession) return;
    setIsTyping(true);
    try {
      const res = await fetch(`/api/conversations/${activeSession.id}/finalize`, {
        method: 'POST'
      });
      if (res.ok) {
        const finalSession = await res.json();
        setActiveSession(finalSession);
        
        if (activeBot?.type === 'interview') {
          // Open immediate results evaluation scorecard popup for candidate!
          setShowEvaluationPopup(true);
        } else {
          // Open rating review dialog for support
          setShowRatingModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Submit Rating Feedback for Customer Support bot
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/conversations/${activeSession.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: userRating, feedbackText: feedbackComment })
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setShowRatingModal(false);
          setFeedbackSuccess(false);
          setFeedbackComment('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!activeSession) return;
    const historyText = activeSession.messages
      .map(m => `[${m.timestamp.slice(11, 16)}] ${m.sender === 'user' ? 'You' : 'Bot'}: ${m.text}`)
      .join('\n');
    const border = `\n==========================================\n`;
    const docText = `SMARTASSIST AI CUSTOMER PORTAL\nBot Companion: ${activeBot?.name}\nDate: ${new Date().toLocaleDateString()}\nCandidate: ${visitorName || 'Visitor'}${border}\n${historyText}\n${border}Customer Support powered by SmartAssist.`;
    
    const elem = document.createElement("a");
    const file = new Blob([docText], {type: 'text/plain'});
    elem.href = URL.createObjectURL(file);
    elem.download = `my_chat_history.txt`;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  };

  const cleanExitSession = () => {
    setActiveSession(null);
    setStartSessionStep(true);
    setVisitorName('');
    setVisitorEmail('');
    setShowEvaluationPopup(false);
  };

  // Color mapper classes
  const getAccentBgClass = (color?: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'teal': return 'bg-teal-600 hover:bg-teal-700';
      case 'slate': return 'bg-slate-700 hover:bg-slate-800';
      case 'sky': return 'bg-sky-500 hover:bg-sky-600';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const getAccentTextClass = (color?: string) => {
    switch (color) {
      case 'emerald': return 'text-emerald-700';
      case 'teal': return 'text-teal-600';
      case 'slate': return 'text-slate-800';
      case 'sky': return 'text-sky-500';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Selector and Widget header */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
            Interactive Agent Simulator
          </h3>
          <p className="text-[11px] text-slate-400">Sandbox. Choose any deployed bot below to start a live conversation.</p>
        </div>

        {startSessionStep && (
          <select
            value={selectedBotId}
            onChange={(e) => {
              setSelectedBotId(e.target.value);
              const bot = chatbots.find(b => b.id === e.target.value);
              if (bot) setChatbotThemeDark(bot.theme?.isDark || false);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-sans text-slate-600 bg-slate-50 focus:outline-none"
          >
            {chatbots.length === 0 ? (
              <option>No chatbots active</option>
            ) : (
              chatbots.map(b => (
                <option key={b.id} value={b.id}>
                  [{b.type === 'interview' ? 'InterviewAI' : 'Support'}] {b.name}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* Actual Chat Simulator Widget */}
      <div className={`border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 min-h-[460px] flex flex-col ${chatbotThemeDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        
        {/* Step 1: Login Register Visitor details inside the Widget */}
        {startSessionStep ? (
          <form onSubmit={handleStartSession} className="flex-1 flex flex-col justify-center items-center p-8 space-y-6 max-w-sm mx-auto">
            <div className="text-center space-y-2">
              <div className={`p-4 rounded-2xl inline-block ${chatbotThemeDark ? 'bg-slate-800 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                {activeBot?.type === 'interview' ? <Award className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
              </div>
              <h4 className="text-base font-display font-bold">{activeBot?.theme?.botName || activeBot?.name || 'Simulator Client'}</h4>
              <p className={`text-xs ${chatbotThemeDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeBot?.type === 'interview' 
                  ? `Entering automated technical HR screening for: ${activeBot.jobTitle || 'Developer'}`
                  : 'Start a session to interact with customer assistance.'}
              </p>
            </div>

            <div className="w-full space-y-3 font-sans">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-sans focus:outline-none ${chatbotThemeDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-800 bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.chen@gmail.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-sans focus:outline-none ${chatbotThemeDark ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-800 bg-white'}`}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center space-x-2 ${getAccentBgClass(activeBot?.theme?.primaryColor)}`}
              >
                <span>🚀 Start {activeBot?.type === 'interview' ? 'Pre-Screening Session' : 'Dialogue Chat'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Live Chat Interface inside widget */
          activeSession && (
            <>
              {/* Header inside widget */}
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${chatbotThemeDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center space-x-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${activeBot?.theme?.primaryColor === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  <div>
                    <h4 className="text-xs font-display font-semibold leading-none">{activeBot?.theme?.botName || activeBot?.name}</h4>
                    <span className="text-[9.5px] font-sans text-slate-400 mt-1 block">Active pipeline user: {activeSession.userName}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Theme toggler */}
                  <button
                    onClick={() => setChatbotThemeDark(!chatbotThemeDark)}
                    className="p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer text-slate-400"
                  >
                    {chatbotThemeDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleDownloadTranscript}
                    title="Download local history transcript"
                    className="p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer text-slate-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Submission and End Session triggers */}
                  <button
                    onClick={handleFinalizeChat}
                    className={`px-2.5 py-1 text-[10px] rounded-full font-bold text-white font-sans uppercase tracking-wider transition-colors cursor-pointer ${getAccentBgClass(activeBot?.theme?.primaryColor)}`}
                  >
                    {activeBot?.type === 'interview' ? '🚩 Complete Interview' : 'Close chat'}
                  </button>
                </div>
              </div>

              {/* Messages Body Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
                {activeSession.messages.map((m) => {
                  const isBot = m.sender === 'bot';
                  return (
                    <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] font-sans leading-relaxed ${isBot ? (chatbotThemeDark ? 'bg-slate-800 text-white rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tl-none') : 'bg-blue-600 text-white rounded-tr-none'}`}>
                        {m.text}
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 mt-0.5 px-1">{m.timestamp.slice(11, 16)}</span>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex flex-col items-start select-none">
                    <div className={`p-2.5 px-4 rounded-xl rounded-tl-none flex items-center space-x-1 ${chatbotThemeDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-[8px] font-sans text-slate-400 mt-1">Analyzing criteria...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* User Input Bar */}
              <form onSubmit={handleSendMessage} className={`p-3 border-t shrink-0 flex items-center space-x-2 ${chatbotThemeDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                {/* Oral Voice Speech recorder button */}
                <button
                  type="button"
                  onClick={handleSimulateSpeech}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : (chatbotThemeDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100')}`}
                  title="Speak / Voice Input using webSpeech Recognition"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Ask a question or reply to recruiter..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs font-sans rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${chatbotThemeDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className={`p-2 rounded-xl text-white transition-colors cursor-pointer ${getAccentBgClass(activeBot?.theme?.primaryColor)} disabled:opacity-40`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )
        )}
      </div>

      {/* Overlay modal screen 1: Customer satisfaction Rating form for support bots */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 text-slate-800">
            <div className="text-center space-y-1">
              <h4 className="font-display font-semibold text-slate-900">How did our assistant do?</h4>
              <p className="text-xs text-slate-400">Rate your experience with {activeBot?.name}.</p>
            </div>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border-emerald-100 rounded-xl space-y-1.5 text-center text-xs">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold">Feedback Registered Successfully!</p>
                <p className="text-[11px] text-slate-400">This rating now updates admin intelligence summaries.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* 5 star selection slider layout */}
                <div className="flex justify-center items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setUserRating(num)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-8 h-8 ${num <= userRating ? 'text-amber-500 fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Provide comments or feature request critiques..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRatingModal(false);
                      cleanExitSession();
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-550"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 font-bold rounded text-xs cursor-pointer"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Register Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Overlay modal screen 2: Interactive Candidate Interview evaluation scorer overview */}
      {showEvaluationPopup && activeSession?.interviewReport && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-100 text-slate-800 max-h-[90vh] overflow-y-auto">
            
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                <Award className="w-6 h-6 animate-bounce" />
              </div>
              <h4 className="font-display font-bold text-slate-901">Interactive Interview Completed!</h4>
              <p className="text-xs text-slate-450 uppercase font-bold tracking-wider font-mono">Real-time candidate score report card</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-201">
                <div>
                  <p className="text-xs font-bold text-slate-800">{activeSession.userName}</p>
                  <p className="text-[10px] text-slate-500 font-sans">{activeSession.userEmail}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold">Overall Rating</p>
                  <p className="text-xl font-display font-extrabold text-emerald-700">{activeSession.interviewReport.overallScore}%</p>
                </div>
              </div>

              {/* Score bar metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                <div className="p-2 bg-white rounded border border-slate-100">
                  <p className="text-[10px] text-slate-405">Technical logic</p>
                  <p className="font-bold text-slate-800">{activeSession.interviewReport.categories.technicalSkills}%</p>
                </div>

                <div className="p-2 bg-white rounded border border-slate-100">
                  <p className="text-[10px] text-slate-405">Communication</p>
                  <p className="font-bold text-slate-800">{activeSession.interviewReport.categories.communication}%</p>
                </div>

                <div className="p-2 bg-white rounded border border-slate-100">
                  <p className="text-[10px] text-slate-410">Experience fit</p>
                  <p className="font-bold text-slate-800">{activeSession.interviewReport.categories.experienceFit}%</p>
                </div>

                <div className="p-2 bg-white rounded border border-slate-100">
                  <p className="text-[10px] text-slate-410">Problem Solving</p>
                  <p className="font-bold text-slate-800">{activeSession.interviewReport.categories.problemSolving}%</p>
                </div>
              </div>

              {/* Recommendation indicator */}
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded text-xs flex justify-between items-center">
                <span className="font-bold font-sans uppercase text-[10px]">Decision Recommendation</span>
                <span className="text-xs bg-emerald-600 text-white rounded font-bold px-2 py-0.5">{activeSession.interviewReport.hiringDecision}</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analysis Summary</p>
                <p className="text-[11px] text-slate-600 leading-normal">{activeSession.interviewReport.transcriptSummary}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-normal">This report card and your transcript have been logged in the systems Admin Panel. Recruiters can view full summaries and export PDF forms there.</p>

            <button
              onClick={cleanExitSession}
              className="w-full py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-sans text-xs font-semibold cursor-pointer"
            >
              Finish & Return to Selector Screen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

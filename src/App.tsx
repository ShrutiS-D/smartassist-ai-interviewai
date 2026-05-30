import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Mic, 
  Coffee, 
  Sparkles, 
  Clock, 
  Compass, 
  CheckCircle, 
  Star, 
  Download, 
  Volume2, 
  Info,
  Check,
  ChevronRight,
  RefreshCw,
  Heart
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Chatbot, ChatSession, ChatMessage } from './types';

export default function App() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [activeBot, setActiveBot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // Connection/Form Errors
  const [chatError, setChatError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isAudioNarratorEnabled, setIsAudioNarratorEnabled] = useState(false);

  // Visitor Details Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [startSessionStep, setStartSessionStep] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Chat input
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Feedback System
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch bot specifications from the server
  useEffect(() => {
    fetchBots();
  }, []);

  // Soft AutoScroll to the latest context message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping]);

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/chatbots');
      if (res.ok) {
        const data = await res.json();
        setChatbots(data);
        // Find our specialized coffee chatbot first
        const coffeeBot = data.find((b: Chatbot) => b.id === 'bot-support-1') || data[0];
        setActiveBot(coffeeBot || null);
      }
    } catch (err) {
      console.error('Failed to load FreshDrop bot specification:', err);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speaking utterances first
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[☕🌱🚚⚙️]/g, ''); // strip coffee emojis for cleaner TTS recitation
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.02;
      utterance.pitch = 1.05; // Friendly coffee barista pitch
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartSession = async (e?: React.FormEvent, isGuest = false) => {
    if (e) e.preventDefault();
    if (!activeBot || isStartingSession) return;

    setStartError(null);
    setIsStartingSession(true);

    const name = isGuest ? 'Guest Roaster' : (visitorName.trim() || 'Guest Roaster');
    const email = isGuest ? 'guest@freshdropcoffee.com' : (visitorEmail.trim() || 'guest@freshdropcoffee.com');

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: activeBot.id,
          userName: name,
          userEmail: email
        })
      });

      if (res.ok) {
        const json = await res.json();
        setActiveSession(json);
        setStartSessionStep(false);
        setVisitorName('');
        setVisitorEmail('');
        
        // Dynamic vocal welcome
        if (isAudioNarratorEnabled) {
          const welcomeMsg = activeBot.theme?.welcomeMessage || "Greetings from the roastery! ☕";
          speakText(welcomeMsg);
        }
      } else {
        setStartError("Operational pressure overflow! We couldn't establish a chat container safely. Tap again to retry.");
      }
    } catch (err) {
      console.error('Failed to instantiate chat session:', err);
      setStartError("Roastery server connectivity is currently unavailable. Please check modern viewport status and retry.");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() || !activeSession || isTyping) return;

    if (!customText) {
      setInputText('');
    }
    setIsTyping(true);
    setChatError(null);

    // Instant local UI append for responsive touch-and-feel
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
        setActiveSession(json.conversation);
        
        // Auto-read response aloud if voice guidance is unmuted
        if (isAudioNarratorEnabled) {
          const loadedMsgList = json.conversation.messages;
          const lastMsg = loadedMsgList[loadedMsgList.length - 1];
          if (lastMsg && lastMsg.sender === 'bot') {
            speakText(lastMsg.text);
          }
        }
      } else {
        setChatError("Roastery communication valve pipe error! The message wasn't received. Please tap retry.");
      }
    } catch (err) {
      console.error('Failed sending packet message:', err);
      setChatError("Connection lost! Check your ethernet/wifi configurations and try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetryMessage = () => {
    if (!activeSession) return;
    const userMessages = activeSession.messages.filter(m => m.sender === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1];
    if (lastUserMsg) {
      // Remove the last local message to avoid duplicates before sending
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== lastUserMsg.id)
        };
      });
      handleSendMessage(undefined, lastUserMsg.text);
    }
  };

  const handleCopyMessageText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  const handleQuickPromptClick = (question: string) => {
    if (startSessionStep) {
      // Auto register visitor details dynamically to provide instant response
      handleStartSession(undefined, true).then(() => {
        setTimeout(() => {
          handleSendMessage(undefined, question);
        }, 300);
      });
    } else {
      handleSendMessage(undefined, question);
    }
  };

  // HTML5 voice input speech recognizer API
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support local speech recognition. Please try modern Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onerror = (e: any) => {
      console.error(e);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
    };

    recognition.start();
  };

  const handleFinalizeChat = async () => {
    if (!activeSession) return;
    setIsTyping(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/conversations/${activeSession.id}/finalize`, {
        method: 'POST'
      });
      if (res.ok) {
        const finalSession = await res.json();
        setActiveSession(finalSession);
        setShowRatingModal(true);
      } else {
        setChatError("Unable to finalize session at this moment. Please tap End conversation once more.");
      }
    } catch (err) {
      console.error(err);
      setChatError("Roastery desk failed to seal report. Please double-check connection.");
    } finally {
      setIsTyping(false);
    }
  };

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
          setActiveSession(null);
          setStartSessionStep(true);
        }, 2200);
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
      .map(m => `[${m.timestamp.slice(11, 16)}] ${m.sender === 'user' ? 'You' : 'FreshDrop Assistant'}: ${m.text}`)
      .join('\n');
    const border = `\n==========================================\n`;
    const docText = `FRESHDROP ORGANIC COFFEE CUSTOMER SERVICE TRANSCRIPT\nDate: ${new Date().toLocaleDateString()}\nCustomer: ${activeSession.userName}\n${border}\n${historyText}\n${border}Sustainable Roasters of Smallholder Coffee Cooperatives.`;
    
    const elem = document.createElement("a");
    const file = new Blob([docText], { type: 'text/plain' });
    elem.href = URL.createObjectURL(file);
    elem.download = `freshdrop_chat_transcript.txt`;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors antialiased">
      
      {/* Premium Coffee Brand Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-emerald-100/60 z-40 shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Coffee className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-semibold text-base text-slate-900 tracking-tight">FreshDrop Organic Coffee Co.</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                  Roastery Active
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-sans tracking-wider block">Live Conversational Support Barista</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="text-[11px] font-mono font-medium text-slate-400 hidden md:inline-flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-350" />
              Batch Roast: Weekly Mondays
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3.5">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-medium text-slate-500 italic">Warming the espresso machine...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Quick Starter Prompts and Menu Highlights */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Quick Starter Suggestions */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Quick Starter prompts
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Click on any coffee-specific topic below to immediately consult our automated master barista:
                </p>

                <div className="space-y-2 text-xs">
                  <button 
                    onClick={() => handleQuickPromptClick("What is the FreshDrop pricing model?")} 
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer font-sans font-medium text-slate-700 flex justify-between items-center group"
                  >
                    <span>☕ Curated Subscription Plans</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button 
                    onClick={() => handleQuickPromptClick("How do I change my grind size?")} 
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer font-sans font-medium text-slate-700 flex justify-between items-center group"
                  >
                    <span>⚙️ Customize Grind Size Preferences</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button 
                    onClick={() => handleQuickPromptClick("What are your shipping and roasting schedules?")} 
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer font-sans font-medium text-slate-700 flex justify-between items-center group"
                  >
                    <span>🚚 Delivery & Weekly Roasting Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button 
                    onClick={() => handleQuickPromptClick("Are your coffee beans sustainably sourced?")} 
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer font-sans font-medium text-slate-700 flex justify-between items-center group"
                  >
                    <span>🌱 Sustainable Sourcing & S-O Origins</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Conversational Assistant Portal */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden">
                
                {startSessionStep ? (
                  /* Form block to kickstart communication profile with interactive states */
                  <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 max-w-md mx-auto space-y-6 w-full">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                        <Coffee className="w-8 h-8 text-emerald-600 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-display font-medium text-slate-900 mt-2">Roastery Customer Service</h3>
                      <p className="text-xs text-slate-450 leading-relaxed font-sans">
                        Introduce yourself to our custom AI roasting assistant to receive tailored suggestions, check deliveries, or modify active coffee-bean boxes!
                      </p>
                    </div>

                    {startError && (
                      <div className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-[11.5px] leading-relaxed animate-fade-in text-center">
                        <span className="font-semibold block mb-0.5">⚠️ Brew Obstruction Detected</span>
                        <p className="text-slate-650">{startError}</p>
                      </div>
                    )}

                    <form onSubmit={handleStartSession} className="w-full space-y-4 font-sans text-xs">
                      <div>
                        <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          disabled={isStartingSession}
                          placeholder="e.g. Sarah Connor"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium text-slate-500 mb-1">Your Email Address</label>
                        <input
                          type="email"
                          required
                          disabled={isStartingSession}
                          placeholder="e.g. sarah@cyberdyne.com"
                          value={visitorEmail}
                          onChange={(e) => setVisitorEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium disabled:opacity-60"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                        <button
                          type="submit"
                          disabled={isStartingSession}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center text-xs"
                        >
                          {isStartingSession ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" />
                              Grinding beans...
                            </>
                          ) : 'Establish Session'}
                        </button>
                        
                        <button
                          type="button"
                          disabled={isStartingSession}
                          onClick={() => handleStartSession(undefined, true)}
                          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-semibold text-slate-600 text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Quick Guest Chat
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Active Live Chat Screen Workspace */
                  activeSession && (
                    <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
                      
                      {/* Active Status bar */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 tracking-tight block truncate">{activeBot?.theme?.botName || "FreshDrop Bot"}</span>
                            <span className="text-[9.5px] font-mono text-slate-400 block truncate">Session ID: {activeSession.id.slice(0, 10)}... &bull; {activeSession.userName}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Audio Narrator Toggle Option */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextState = !isAudioNarratorEnabled;
                              setIsAudioNarratorEnabled(nextState);
                              if (nextState) {
                                speakText("Voice support streaming is turned on! Let me recite my flavor profiles!");
                              } else {
                                if ('speechSynthesis' in window) {
                                  window.speechSynthesis.cancel();
                                }
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
                              isAudioNarratorEnabled 
                                ? 'text-emerald-700 bg-emerald-100/60 shadow-xs ring-1 ring-emerald-200/50' 
                                : 'text-slate-400 hover:text-slate-650 hover:bg-slate-100'
                            }`}
                            title={isAudioNarratorEnabled ? "Voice Barista: ACTIVE (Click to mute)" : "Voice Barista: MUTED (Click to activate reading aloud)"}
                          >
                            <Volume2 className="w-4 h-4" />
                            {isAudioNarratorEnabled && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            )}
                          </button>

                          <button
                            onClick={handleDownloadTranscript}
                            title="Download local support transcript"
                            className="p-1.5 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Would you like to discard this conversation session and return to the start screen?")) {
                                if ('speechSynthesis' in window) {
                                  window.speechSynthesis.cancel();
                                }
                                setActiveSession(null);
                                setStartSessionStep(true);
                                setChatError(null);
                              }
                            }}
                            className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                            title="Reset the current support session"
                          >
                            Reset
                          </button>

                          <button
                            onClick={handleFinalizeChat}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold rounded-lg transition-all cursor-pointer hover:scale-[1.02] shadow-xs"
                          >
                            End Chat
                          </button>
                        </div>
                      </div>

                      {/* Conversations Log List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
                        {activeSession.messages.map((m) => {
                          const isBot = m.sender === 'bot';
                          const isCopied = copiedMessageId === m.id;
                          return (
                            <div key={m.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                              
                              {isBot && (
                                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mr-2 shadow-xs shrink-0 mt-0.5">
                                  <Coffee className="w-4 h-4" />
                                </div>
                              )}

                              <div className="flex flex-col max-w-[80%]">
                                <div className={`p-3 rounded-2xl text-xs font-sans leading-relaxed shadow-3xs hover:shadow-2xs transition-shadow relative group ${
                                  isBot 
                                    ? 'bg-white text-slate-850 rounded-tl-none border border-slate-100' 
                                    : 'bg-emerald-600 text-white rounded-tr-none'
                                }`}>
                                  <div className="markdown-body">
                                    <Markdown
                                      components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-line leading-relaxed font-sans">{children}</p>,
                                        strong: ({ children }) => (
                                          <strong className={`font-bold rounded-md px-1 py-0.5 ${
                                            isBot ? 'text-emerald-950 bg-emerald-100/50' : 'text-emerald-100 bg-emerald-800/80 font-extrabold'
                                          }`}>
                                            {children}
                                          </strong>
                                        ),
                                        ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1 font-sans">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1 font-sans">{children}</ol>,
                                        li: ({ children }) => <li className="leading-relaxed font-sans">{children}</li>,
                                      }}
                                    >
                                      {m.text}
                                    </Markdown>
                                  </div>
                                </div>
                                
                                <span className={`text-[9px] font-mono text-slate-400 mt-1 flex items-center space-x-1.5 ${isBot ? 'text-left pl-1' : 'text-right pr-1 justify-end'}`}>
                                  <span>{m.timestamp.slice(11, 16)}</span>
                                  <span>&bull;</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessageText(m.id, m.text)}
                                    className={`hover:text-emerald-600 transition-colors cursor-pointer ${isCopied ? 'text-emerald-600 font-semibold' : ''}`}
                                    title="Copy text contents"
                                  >
                                    {isCopied ? 'Copied!' : 'Copy'}
                                  </button>
                                  {isBot && (
                                    <>
                                      <span>&bull;</span>
                                      <button
                                        type="button"
                                        onClick={() => speakText(m.text)}
                                        className="hover:text-emerald-600 flex items-center cursor-pointer"
                                        title="Speak message aloud"
                                      >
                                        <Volume2 className="w-2.5 h-2.5 mr-0.5" />
                                        Speak
                                      </button>
                                    </>
                                  )}
                                </span>
                              </div>

                            </div>
                          );
                        })}

                        {isTyping && (
                          <div className="flex justify-start select-none">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mr-2 shrink-0 mt-0.5 shadow-sm">
                              <Coffee className="w-4 h-4 animate-spin" />
                            </div>
                            <div className="bg-white border border-slate-100 p-3 px-4 rounded-2xl rounded-tl-none flex items-center space-x-1 shadow-3xs">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>

                      {/* Connection / Transport Error Alert Banner */}
                      {chatError && (
                        <div className="mx-3 my-1 p-2 bg-red-50 border border-red-100 rounded-xl text-red-800 text-[11px] flex items-center justify-between animate-fade-in font-sans shadow-3xs shrink-0">
                          <span className="flex items-center min-w-0">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shrink-0 animate-ping" />
                            <span className="truncate">{chatError}</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleRetryMessage}
                            className="ml-2 px-2 py-0.5 bg-white border border-red-200 hover:bg-red-50 text-red-900 rounded font-semibold text-[10px] transition-colors cursor-pointer shrink-0"
                          >
                            Retry Send
                          </button>
                        </div>
                      )}

                      {/* User Input Bar */}
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isRecording 
                              ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                              : 'border-slate-200 text-slate-450 hover:bg-slate-50'
                          }`}
                          title="Speak via Voice Recognition"
                        >
                          <Mic className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          placeholder="Type or click quick-starter triggers on left..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 text-xs font-sans rounded-xl bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-medium"
                        />

                        <button
                          type="submit"
                          disabled={!inputText.trim() || isTyping}
                          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>

                    </div>
                  )
                )}

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Overlay Feedback Survey Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 text-slate-800 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                <Heart className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="font-display font-semibold text-slate-900 text-base">Rate our FreshDrop Barista!</h4>
              <p className="text-xs text-slate-400">Your feedback helps tune the organic service model.</p>
            </div>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl space-y-1.5 text-center text-xs">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold">Rating Submitted Successfully!</p>
                <p className="text-[11px] text-slate-400">Your comments have been registered in our database.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
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
                    placeholder="Provide comments or mention favorite origins, roasts..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRatingModal(false);
                      setActiveSession(null);
                      setStartSessionStep(true);
                    }}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded text-xs"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 font-bold rounded text-xs cursor-pointer"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Register Response'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding line */}
      <footer className="py-4 border-t border-slate-200/60 bg-white text-center shrink-0">
        <p className="text-[10px] font-sans text-slate-400">
          FreshDrop Organic Coffee Subscription &bull; Integrated Customer Care Portal &bull; {new Date().getFullYear()} Build
        </p>
      </footer>

    </div>
  );
}

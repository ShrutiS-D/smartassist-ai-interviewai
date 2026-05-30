import { useEffect, useState } from 'react';
import { MessageSquare, Star, User, Calendar, RefreshCw, Mail, Check, Download, AlertTriangle, Printer, Award, FileSpreadsheet } from 'lucide-react';
import { ChatSession } from '../types';

interface TranscriptsViewerProps {
  token: string;
}

export default function TranscriptsViewer({ token }: TranscriptsViewerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  
  // Filtering and emails simulator
  const [filterType, setFilterType] = useState<'all' | 'support' | 'interview'>('all');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort sessions by newest updatedAt first
        const sorted = data.sort((a: ChatSession, b: ChatSession) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSessions(sorted);
        if (sorted.length > 0) {
          setSelectedSession(sorted[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, [token]);

  // Handle simulated email notification
  const handleSimulateEmail = () => {
    if (!selectedSession) return;
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    }, 1200);
  };

  // Launch standard browser printer print on evaluation report card
  const handleLaunchPrint = () => {
    window.print();
  };

  const handleExportTxt = () => {
    if (!selectedSession) return;
    const transcriptText = selectedSession.messages
      .map(m => `[${m.timestamp.slice(11, 16)}] ${m.sender === 'user' ? 'Candidate/User' : 'Bot'}: ${m.text}`)
      .join('\n');
    const header = `SMARTASSIST AI / INTERVIEWAI TRANSCRIPT EXPORT\nID: ${selectedSession.id}\nDate: ${selectedSession.createdAt}\nUser: ${selectedSession.userName} (${selectedSession.userEmail})\n=========================================\n\n`;
    
    const element = document.createElement("a");
    const file = new Blob([header + transcriptText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `chat_transcript_${selectedSession.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredSessions = sessions.filter(s => {
    if (filterType === 'all') return true;
    return s.chatbotType === filterType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 min-h-[400px]">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-sans">Retransmitting conversation records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Left session records list panel */}
      <div className="md:col-span-1 border border-slate-200/80 rounded-xl bg-white overflow-hidden flex flex-col max-h-[560px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-display font-semibold text-slate-800">Operational Log Records</h3>
          <button onClick={fetchTranscripts} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="p-2 border-b border-slate-100 flex gap-2 justify-center shrink-0">
          {['all', 'support', 'interview'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-2.5 py-1 text-[10px] rounded-full font-semibold font-sans uppercase tracking-wide cursor-pointer transition-colors ${filterType === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* List of scrollable sessions */}
        <div className="overflow-y-auto flex-1">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">No corresponding session logs found.</div>
          ) : (
            filteredSessions.map((sess) => {
              const lastMsg = sess.messages[sess.messages.length - 1];
              const isInterview = sess.chatbotType === 'interview';
              
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setSelectedSession(sess);
                    setEmailSuccess(false);
                  }}
                  className={`p-3.5 border-b border-slate-100 cursor-pointer transition-colors flex flex-col space-y-1.5 ${selectedSession?.id === sess.id ? 'bg-indigo-50/30 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight flex items-center">
                      <User className="w-3 h-3 text-slate-450 mr-1 shrink-0" />
                      {sess.userName}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold tracking-wider shrink-0 ${isInterview ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}>
                      {isInterview ? 'Candidate' : 'QA Help'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-405 truncate">{lastMsg?.text || 'No messages'}</p>
                  
                  <div className="flex justify-between items-center pt-1 text-[9px] text-slate-400">
                    <span className="flex items-center">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      {new Date(sess.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                    
                    {sess.rating && (
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-500 mr-0.5" />
                        {sess.rating}
                      </span>
                    )}

                    {isInterview && sess.candidateScore && (
                      <span className="text-emerald-700 font-sans font-bold bg-emerald-50 px-1 py-0.2 rounded">
                        Score: {sess.candidateScore}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Middle & Right Details Viewer panel */}
      {selectedSession ? (
        <div className="md:col-span-2 border border-slate-200/80 rounded-xl bg-white overflow-hidden flex flex-col max-h-[560px]">
          
          {/* Header context */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0">
            <div>
              <p className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest">{selectedSession.chatbotName}</p>
              <h3 className="text-sm font-display font-semibold text-slate-800">Transcript for {selectedSession.userName}</h3>
              <p className="text-[10px] text-slate-400 font-sans">{selectedSession.userEmail} &bull; ID: {selectedSession.id}</p>
            </div>

            <div className="mt-2.5 sm:mt-0 flex gap-2">
              <button
                onClick={handleExportTxt}
                className="inline-flex items-center px-2 py-1 border border-slate-200 rounded text-[10px] font-sans font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="w-3 h-3 mr-1" /> Export .txt
              </button>

              <button
                onClick={handleSimulateEmail}
                disabled={sendingEmail}
                className="inline-flex items-center px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded text-xs font-sans font-semibold text-white tracking-wide cursor-pointer"
              >
                {emailSuccess ? (
                  <>
                    <Check className="w-3 h-3 mr-1" /> Notified!
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 mr-1" /> Email Transcript
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col lg:flex-row gap-6 print:block">
            
            {/* Conversation Messages column */}
            <div className="flex-1 space-y-3 max-h-[380px] lg:max-h-[460px] overflow-y-auto pr-2">
              {selectedSession.messages.map((m) => {
                const isBot = m.sender === 'bot';
                return (
                  <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                    <span className="text-[9px] font-mono text-slate-400 mb-0.5">
                      {isBot ? 'AI Agent' : selectedSession.userName} &bull; {m.timestamp.slice(11, 16)}
                    </span>
                    <div className={`p-3 rounded-lg text-xs leading-normal max-w-[85%] font-sans ${isBot ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                      {m.text}
                    </div>
                    {isBot && m.sentiment && (
                      <span className={`text-[8px] font-semibold mt-0.5 px-1 py-0.1 select-none font-mono tracking-wider rounded ${m.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-800' : m.sentiment === 'negative' ? 'bg-red-50 text-red-800' : 'bg-slate-100 text-slate-500'}`}>
                        Sentiment: {m.sentiment}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Report Scorecard sidebar column (Special for InterviewAI) or Customer Review logs */}
            {selectedSession.chatbotType === 'interview' ? (
              <div id="candidate-report-print-target" className="w-full lg:w-[260px] p-4 bg-slate-50 border border-slate-250/60 rounded-xl space-y-4 shrink-0">
                <div className="flex justify-between items-center pb-2 border-b border-slate-205">
                  <h4 className="text-xs font-display font-semibold text-slate-800 flex items-center">
                    <Award className="w-4 h-4 text-emerald-600 mr-1.5" />
                    Interview Evaluation
                  </h4>
                  <button onClick={handleLaunchPrint} className="text-slate-400 hover:text-indigo-600 cursor-pointer none-print">
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedSession.interviewReport ? (
                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall AI Score</span>
                        <span className={`text-xl font-display font-bold ${selectedSession.interviewReport.overallScore >= 85 ? 'text-emerald-700' : selectedSession.interviewReport.overallScore >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                          {selectedSession.interviewReport.overallScore} / 100
                        </span>
                      </div>
                      
                      {/* Overall Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${selectedSession.interviewReport.overallScore >= 85 ? 'bg-emerald-500' : selectedSession.interviewReport.overallScore >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${selectedSession.interviewReport.overallScore}%` }}></div>
                      </div>
                    </div>

                    {/* Hiring Recommendation badge */}
                    <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500 uppercase tracking-widest text-[9px]">Decision</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${selectedSession.interviewReport.hiringDecision === 'Hire' ? 'bg-emerald-100 text-emerald-800' : selectedSession.interviewReport.hiringDecision === 'Maybe' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-850'}`}>
                        {selectedSession.interviewReport.hiringDecision} Recommendation
                      </span>
                    </div>

                    {/* Breakdown grids */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Categories evaluation</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-1.5 bg-white border border-slate-200 rounded">
                          <p className="text-[9px] text-slate-400">Tech Stacks</p>
                          <p className="font-semibold text-slate-800 font-mono text-[11px]">{selectedSession.interviewReport.categories.technicalSkills}%</p>
                        </div>
                        <div className="p-1.5 bg-white border border-slate-200 rounded">
                          <p className="text-[9px] text-slate-400">Communication</p>
                          <p className="font-semibold text-slate-800 font-mono text-[11px]">{selectedSession.interviewReport.categories.communication}%</p>
                        </div>
                        <div className="p-1.5 bg-white border border-slate-200 rounded">
                          <p className="text-[9px] text-slate-400">Experience Fit</p>
                          <p className="font-semibold text-slate-800 font-mono text-[11px]">{selectedSession.interviewReport.categories.experienceFit}%</p>
                        </div>
                        <div className="p-1.5 bg-white border border-slate-200 rounded">
                          <p className="text-[9px] text-slate-400">Problem Solving</p>
                          <p className="font-semibold text-slate-800 font-mono text-[11px]">{selectedSession.interviewReport.categories.problemSolving}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Core Strengths</div>
                      <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-600">
                        {selectedSession.interviewReport.keyStrengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Areas of Improvement</div>
                      <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-600">
                        {selectedSession.interviewReport.improvementAreas.map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="text-[9.5px] text-slate-400 uppercase font-bold">Transcript analysis overview</div>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{selectedSession.interviewReport.transcriptSummary}</p>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    Interview active. Candidate has not clicked 'Finish' to score candidate yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full lg:w-[240px] p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4 shrink-0">
                <h4 className="text-xs font-display font-semibold text-slate-800">Support Feedback Review</h4>
                
                {selectedSession.rating ? (
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Satisfaction rating</p>
                      <div className="flex items-center text-amber-500 font-sans font-bold text-lg mt-1">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500 mr-1.5" />
                        {selectedSession.rating} / 5
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Comments</p>
                      <p className="p-2.5 bg-white border border-slate-200/60 rounded-lg text-slate-600 mt-1 leading-normal italic text-[11px]">
                        "{selectedSession.feedbackText || 'No commentary feedback submitted.'}"
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Analyzed Conversation Sentiment</p>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-[11px] font-sans font-semibold uppercase ${selectedSession.sentimentAverage === 'positive' ? 'bg-emerald-50 text-emerald-800' : selectedSession.sentimentAverage === 'negative' ? 'bg-red-50 text-red-800' : 'bg-slate-100 text-slate-500'}`}>
                        {selectedSession.sentimentAverage || 'Neutral / Standard'}
                      </span>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Customer has not rated or submitted review form yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Notification system notification alerts inline */}
          {emailSuccess && (
            <div className="p-2 bg-emerald-500 text-white text-xs font-sans font-bold text-center animate-pulse tracking-wide uppercase shrink-0">
              Notification Transmitted: Screening score email sent successfully to company recruiters!
            </div>
          )}

        </div>
      ) : (
        <div className="md:col-span-2 border border-slate-200/80 rounded-xl bg-white p-12 text-center flex items-center justify-center min-h-[300px]">
          <div className="space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-450 font-sans text-xs">Examine historic transcripts by choosing a record in the left column.</p>
          </div>
        </div>
      )}

    </div>
  );
}

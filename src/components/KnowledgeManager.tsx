import React, { useState } from 'react';
import { HelpCircle, FileText, Plus, Trash2, CheckCircle, Search, UploadCloud, Info, Sparkles, BookOpen } from 'lucide-react';
import { Chatbot, FAQ, AppDocument } from '../types';

interface KnowledgeManagerProps {
  token: string;
  chatbot: Chatbot;
  onUpdate: (updatedBot: Chatbot) => void;
}

const RESUME_PRESETS = [
  {
    name: 'Sarah Chen - Technical Lead (Senior Full-Stack Developer applicant)',
    file: 'sarah_chen_resume.txt',
    content: `Sarah Chen
Email: sarah.chen@gmail.com
Phone: (555) 019-2834
Summary: Elite Full-Stack engineer with 6+ years building global payment widgets & streaming micro-frontend layers.

Experience:
- Technical Lead @ Stripe (4 Years)
  Designed reactive customer checkout modals. Migrated legacy state patterns onto Zustand + dynamic selectors. Lowered hydration bottlenecks by 35% and salvaged server memory overheads.
- Senior Software Engineer @ Vercel (2 Years)
  Core Next.js rendering optimizations. Restructured server-side cache invalidations to bolster data streaming.

Skills: React, Next.js, Node.js, Typescript, Zustand, Postgres, AWS, Docker.`
  },
  {
    name: 'Marcus Finch - Infrastructure Automation Analyst',
    file: 'marcus_finch_job_history.txt',
    content: `Marcus Finch
Email: marcus.f@opsnet.io
Summary: 5 years experience focused strictly on Kubernetes orchestration, Terraform automation, and secure CI/CD build environments.

Experience:
- Senior DevOps Engineer @ CloudLabs (3 Years)
  Maintained 400+ container nodes across Google Cloud Workspace and AWS. Implemented automated horizontal scalers.
- Systems Administrator @ CyberOps (2 Years)
  Structured secure Gitlab runner pipelines, hardening access tokens via vault secret tools.

Skills: Kubernetes, Docker, Terraform, Google Cloud, AWS, Bash, Gitlab, Core Linux.`
  },
  {
    name: 'Mia Wong - Product UI/UX & Interaction Specialist',
    file: 'mia_wong_creative_portfolio.txt',
    content: `Mia Wong
Email: mia.wong@designspace.com
Summary: Visual strategist and front-end artist with 4 years creating responsive digital interfaces and component style systems.

Experience:
- lead UI Interaction Strategist @ PixelPerfect (2.5 Years)
  Handled Figma user boards, mapping user journeys. Formulated robust tailwind design guidelines.
- Front End UI developer @ CreativeGrid (1.5 Years)
  Created fluid motion effects, layout transitions, and high-fidelity interaction cards.

Skills: Figma, Tailwind CSS, React transitions, Responsive Grid Design, SVG, Interaction Metrics.`
  }
];

export default function KnowledgeManager({ token, chatbot, onUpdate }: KnowledgeManagerProps) {
  // FAQs State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [addingFaq, setAddingFaq] = useState(false);

  // Documents State
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [docError, setDocError] = useState('');

  // Handle adding FAQ
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setAddingFaq(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question, answer })
      });
      if (res.ok) {
        const newFaq = await res.json();
        const updatedFaqs = [...chatbot.faqs, newFaq];
        onUpdate({ ...chatbot, faqs: updatedFaqs });
        setQuestion('');
        setAnswer('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingFaq(false);
    }
  };

  // Handle deleting FAQ
  const handleDeleteFaq = async (faqId: string) => {
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedFaqs = chatbot.faqs.filter(f => f.id !== faqId);
        onUpdate({ ...chatbot, faqs: updatedFaqs });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle uploading Doc
  const handleUploadDoc = async (nameOfFile: string, textOfFile: string) => {
    if (!nameOfFile.trim() || !textOfFile.trim()) {
      setDocError('Please verify file name and provide content text.');
      return;
    }
    setDocError('');
    setUploadingDoc(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileName: nameOfFile, fileContent: textOfFile })
      });
      if (res.ok) {
        const newDoc = await res.json();
        const updatedDocs = [...chatbot.documents, newDoc];
        onUpdate({ ...chatbot, documents: updatedDocs });
        setFileName('');
        setFileContent('');
        setSuccessMsg(`"${nameOfFile}" processed successfully ${chatbot.type === 'interview' ? 'with AI Resume analysis!' : ''}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errJson = await res.json();
        setDocError(errJson.error || 'Failed to upload document.');
      }
    } catch (err) {
      setDocError('Connectivity error.');
      console.error(err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updatedDocs = chatbot.documents.filter(d => d.id !== docId);
        onUpdate({ ...chatbot, documents: updatedDocs });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop simulator for candidate CVs
  const handleSimulateDrop = (preset: typeof RESUME_PRESETS[0]) => {
    setFileName(preset.file);
    setFileContent(preset.content);
    setPasteMode(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* FAQ Management Section OR Job Specs instructions */}
      <div className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
        {chatbot.type === 'support' ? (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-605" />
                  Configure Chatbot Q&A (FAQs)
                </h3>
                <p className="text-xs text-slate-400 font-sans">Ground model answers with strict company criteria.</p>
              </div>
              <span className="text-[10px] bg-slate-150 px-2 py-0.5 rounded text-slate-500 font-mono">{chatbot.faqs.length} pre-defined QAs</span>
            </div>

            {/* List and Delete FAQs */}
            <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
              {chatbot.faqs.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-lg text-xs text-slate-400 italic">
                  No explicit FAQs configured. Bot will rely strictly on general system instructions & PDFs.
                </div>
              ) : (
                chatbot.faqs.map((faq) => (
                  <div key={faq.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-lg flex justify-between items-start space-x-2">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-800">Q: {faq.question}</p>
                      <p className="text-slate-550">A: {faq.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="text-slate-300 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Form to Add FAQ */}
            <form onSubmit={handleAddFaq} className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-sans font-bold text-slate-600">Register new QA intent</h4>
              <div className="grid grid-cols-1 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. Can I cancel my subscription easily?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Yes! Simply log into your settings, click billing, and hit cancel anytime."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingFaq}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-sans font-semibold rounded-lg flex items-center shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Save Intent
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Recruit guidelines details */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-emerald-600" />
                  InterviewAI Workflow & Guidelines
                </h3>
                <p className="text-xs text-slate-400 font-sans">How the screening recruiter processes candidates.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3.5 text-xs text-slate-600 leading-normal">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  InterviewAI combines advanced **Gemini LLM reasoning** with HR specifications to conduct a live interactive technical screening.
                </p>
              </div>

              <div className="space-y-2.5 pl-6 list-decimal">
                <p className="font-semibold text-slate-700">Recommended Steps:</p>
                <div className="space-y-1.5">
                  <p>1. **Review Job Specs**: Ensure target Job Title and profile requirements are specified correctly in the creator page.</p>
                  <p>2. **Load Resume Context**: Upload the candidate's resume (PDF/Doc or paste as text) on the right panel. Pre-configure Sarah, Marcus, or Mia resumes below to test easily.</p>
                  <p>3. **Simulate Candidate Chat**: Go to the chat simulator sidebar, choose the candidate name, open the widget, and conduct a realistic interview chat!</p>
                  <p>4. **Inspect Evaluation Report**: Once completed, the AI automatically grades communication, technical stacks and drafts a printable report!</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-sans">
                <p className="font-bold text-slate-800 mb-1 flex items-center">
                  <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                  Active Model Specification
                </p>
                Selected model: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px] text-indigo-700">gemini-3.5-flash</code>.
                Perfect for conversational context processing and structured schema evaluation report exports.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Document Knowledge Library - PDF uploads & Resumes */}
      <div className="p-5 bg-white border border-slate-200/80 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-800 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
              {chatbot.type === 'interview' ? 'Uploaded Resumes / CVs' : 'Knowledge Files (PDF, TXT)'}
            </h3>
            <p className="text-xs text-slate-400 font-sans">Configure background files context for search.</p>
          </div>
          <span className="text-[10px] bg-slate-150 px-2 py-0.5 rounded text-slate-500 font-mono">{chatbot.documents.length} Files</span>
        </div>

        {/* Existing files list */}
        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
          {chatbot.documents.length === 0 ? (
            <div className="text-center p-4 bg-slate-55/50 rounded-lg text-xs text-slate-400 italic">
              No files parsed yet. Ground the bot by uploading text below.
            </div>
          ) : (
            chatbot.documents.map((doc) => (
              <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-slate-450 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{doc.fileName}</span>
                  {doc.analysis && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 font-medium px-1 rounded-full shrink-0">Evaluated</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="text-slate-350 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Upload Panel */}
        {successMsg && (
          <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-sans rounded-lg border border-emerald-100 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-2 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {docError && (
          <div className="p-2 bg-red-50 text-red-700 text-xs font-sans rounded-lg border border-red-100">
            {docError}
          </div>
        )}

        {pasteMode ? (
          <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-sans font-bold text-slate-700">Paste document text</span>
              <button onClick={() => setPasteMode(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold">Change to Drag Form</button>
            </div>
            
            <input
              type="text"
              required
              placeholder="Filename (e.g. employee_onboarding.txt)"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-sans bg-white focus:outline-none"
            />

            <textarea
              rows={3}
              required
              placeholder="Paste content here..."
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-sans bg-white font-mono focus:outline-none"
            />

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPasteMode(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => handleUploadDoc(fileName, fileContent)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-sans font-semibold rounded"
              >
                {uploadingDoc ? 'Uploading...' : 'Parse Document'}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-5 rounded-xl cursor-pointer transition-colors text-center space-y-2"
            onClick={() => setPasteMode(true)}
          >
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs">
              <p className="font-semibold text-slate-700">Click to upload TXT, PDF or mock files</p>
              <p className="text-slate-400 mt-1 font-sans text-[11px]">Paste or upload text-based CV resumes & support files directly</p>
            </div>
          </div>
        )}

        {/* Presets and Drag Drop Helpers specifically for InterviewAI candidate screening */}
        {chatbot.type === 'interview' && (
          <div className="p-3 bg-amber-50/45 border border-amber-100 rounded-xl space-y-2">
            <h4 className="text-[11px] font-sans font-bold text-amber-800 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-2 shrink-0" />
              HR Testing Helper: Load Candidate Resume Presets
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {RESUME_PRESETS.map((pct, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSimulateDrop(pct)}
                  className="w-full text-left p-1.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-[10px] font-sans text-slate-600 flex justify-between items-center cursor-pointer transition-colors"
                >
                  <span className="truncate mr-2 font-medium">{pct.name}</span>
                  <span className="text-[9px] bg-slate-100 text-slate-550 px-1 py-0.2 rounded group-hover:bg-indigo-100">Load Setup</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

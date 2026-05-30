import { useState } from 'react';
import { Bot, Shield, ChevronRight, Activity, Award, CheckCircle2, UserCheck, Star, Users, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnterSandbox: () => void;
  onEnterAdmin: () => void;
}

export default function LandingPage({ onEnterSandbox, onEnterAdmin }: LandingPageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-6">
      
      {/* Hero Banner Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-radial from-slate-50 to-white dark:from-slate-905 dark:to-slate-950 p-6 sm:p-10 border border-slate-150/80 rounded-3xl">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-sans font-bold text-indigo-750">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>AI Studio Full-Stack Production Deploy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight leading-none">
            Scale Customer Success & HR Screening.
          </h1>
          
          <p className="text-base text-slate-500 font-sans leading-relaxed max-w-xl">
            Create intelligent, custom AI chatbots grounded in business FAQs & document catalogs, or deploy automated Recruitment Interview pipelines that screen applicants, conduct chats, and compile graded scorecards.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onEnterSandbox}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-sm tracking-wide rounded-xl flex items-center justify-center shadow-md shadow-indigo-200/50 cursor-pointer group"
            >
              <span>Launch Chat Sandbox</span>
              <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={onEnterAdmin}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-sm rounded-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <span>Admin Dashboard Logins</span>
              <ArrowRight className="w-4 h-4 ml-2 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid stack - right side of hero */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs transition-shadow hover:shadow-md">
            <h3 className="text-xs font-display font-semibold text-slate-900 flex items-center uppercase tracking-wide">
              <Bot className="w-4 h-4 text-indigo-610 mr-1.5 shrink-0" />
              SmartAssist Customer Assistant
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans leading-normal">
              Self-learning widget that dynamically parses PDFs and FAQ sheets to provide real-time, context-grounded product support. Performs automated message-level sentiment mapping.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-205 rounded-2xl shadow-xs transition-shadow hover:shadow-md">
            <h3 className="text-xs font-display font-semibold text-slate-900 flex items-center uppercase tracking-wide">
              <Award className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
              InterviewAI Screen Pipeline
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-sans leading-normal">
              Combines CV context evaluation with conversational grilling. Automatically calculates candidate technical logic, communications, problem solving, and produces printable report card summaries.
            </p>
          </div>
        </div>
      </div>

      {/* Feature capabilities matrix */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-slate-800 tracking-tight">Enterprise Architecture Checklist</h2>
          <p className="text-xs text-slate-400 font-sans">100% cloud persistent full-stack pipeline built to specifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          {/* Card 1 */}
          <div className="p-5 bg-white border border-slate-100/80 rounded-xl space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">RBAC Secure Auth</h4>
            <p className="text-[11px] text-slate-405 leading-normal">
              Secure endpoints backed by JWT Session managers. Direct Role-Based controls isolating candidate chats from support registries.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 bg-white border border-slate-100/80 rounded-xl space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Real-Time Insights</h4>
            <p className="text-[11px] text-slate-405 leading-normal">
              Consolidated dashboards reporting satisfaction reviews, language trends, net user sentiment vectors, and HR hiring funnels.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 bg-white border border-slate-100/80 rounded-xl space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Gemini 3.5 Flash Engine</h4>
            <p className="text-[11px] text-slate-405 leading-normal">
              Calculates precise context retrieval over files. Performs interactive multi-turn interview chats and outputs structured scorecard reports safely on servers.
            </p>
          </div>
        </div>
      </div>

      {/* Trust banner */}
      <div className="text-center p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-wrap justify-center items-center gap-4 sm:gap-8 font-sans text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <span className="flex items-center"><UserCheck className="w-4 h-4 text-slate-400 mr-2" /> SaaS Portfolio Ready</span>
        <span>&bull;</span>
        <span className="flex items-center"><Activity className="w-4 h-4 text-slate-400 mr-2" /> Active Health logging</span>
        <span>&bull;</span>
        <span className="flex items-center"><Users className="w-4 h-4 text-slate-400 mr-2" /> 100% Server Side Gemini Secured</span>
      </div>

    </div>
  );
}

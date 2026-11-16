import React from 'react';
import { Sparkles, ExternalLink, Cpu } from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  activeTab: 'internships' | 'generator';
  setActiveTab: (tab: 'internships' | 'generator') => void;
  health: HealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('internships')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CoverCraft</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  AI Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Infosys Springboard VIP 7.0</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('internships')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'internships'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Available Internships
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'generator'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cover Letter Studio
            </button>
          </nav>

          {/* Right Status & Swagger Link */}
          <div className="flex items-center space-x-3">
            {health && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 capitalize font-medium">{health.llm_provider}:</span>
                {health.llm_configured ? (
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600 font-semibold" title="Set GEMINI_API_KEY in backend/.env">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                    Key Needed
                  </span>
                )}
              </div>
            )}

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

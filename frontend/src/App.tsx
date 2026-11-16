import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatusBanner } from './components/StatusBanner';
import { InternshipsPage } from './pages/InternshipsPage';
import { GeneratePage } from './pages/GeneratePage';
import { Internship, HealthStatus } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'internships' | 'generator'>('internships');
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch (err) {
        console.warn('Backend currently unreachable', err);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectInternship = (internship: Internship) => {
    setSelectedInternship(internship);
    setActiveTab('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      <StatusBanner health={health} />

      <main className="flex-1 pb-16">
        {activeTab === 'internships' ? (
          <InternshipsPage
            onSelectInternshipForGeneration={handleSelectInternship}
          />
        ) : (
          <GeneratePage
            selectedInternship={selectedInternship}
            onBackToInternships={() => setActiveTab('internships')}
            onSelectInternship={(internship) => setSelectedInternship(internship)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Infosys Springboard Virtual Internship Program 7.0
          </p>
          <p>
            Internship Application Agent • AI-Powered Cover Letter Generation System
          </p>
          <p className="text-slate-400">
            Built with FastAPI, LangChain, React, TypeScript, and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

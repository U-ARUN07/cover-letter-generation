import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
} from 'lucide-react';
import {
  Internship,
  ResumeData,
  MatchingAnalysisResult,
  CoverLetterResponse,
} from '../types';
import { api } from '../services/api';
import { ResumeSelector } from '../components/ResumeSelector';
import { MatchingScoreGauge } from '../components/MatchingScoreGauge';
import { CoverLetterPreview } from '../components/CoverLetterPreview';

interface GeneratePageProps {
  selectedInternship: Internship | null;
  onBackToInternships: () => void;
  onSelectInternship: (internship: Internship) => void;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({
  selectedInternship,
  onBackToInternships,
  onSelectInternship,
}) => {
  const [internshipsList, setInternshipsList] = useState<Internship[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchingAnalysisResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('professional');

  // Load all internships to allow in-page role switching
  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await api.getInternships();
        const list = data.internships || [];
        setInternshipsList(list);
        if (!selectedInternship && list.length > 0) {
          onSelectInternship(list[0]);
        }
      } catch (err) {
        console.error('Failed to load internships in studio', err);
      }
    }
    loadRoles();
  }, [selectedInternship]);

  // Trigger match analysis whenever internship or resume changes
  useEffect(() => {
    async function runMatch() {
      if (!selectedInternship || !selectedResume) return;

      setLoadingMatch(true);
      setError(null);
      try {
        const analysis = await api.analyzeMatch(
          selectedInternship.internship_id,
          selectedResume.candidate_id,
          selectedResume
        );
        setMatchAnalysis(analysis);
      } catch (err: unknown) {
        console.error('Match analysis error', err);
      } finally {
        setLoadingMatch(false);
      }
    }
    runMatch();
  }, [selectedInternship, selectedResume]);

  const handleGenerateCoverLetter = async () => {
    if (!selectedInternship || !selectedResume) return;

    setGenerating(true);
    setError(null);
    try {
      let res: CoverLetterResponse;
      if (selectedResume.candidate_id) {
        res = await api.generateCoverLetter(
          selectedResume.candidate_id,
          selectedInternship.internship_id,
          selectedTone
        );
      } else {
        res = await api.generateCoverLetterFromResume(
          selectedInternship.internship_id,
          selectedResume,
          selectedTone
        );
      }
      setCoverLetterData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cover letter generation failed';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const currentRole = selectedInternship || (internshipsList.length > 0 ? internshipsList[0] : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Role Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBackToInternships}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-sm self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>

        {/* In-Studio Role Dropdown */}
        {internshipsList.length > 0 && currentRole && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Switch Target:</span>
            <div className="relative inline-block">
              <select
                value={currentRole.internship_id}
                onChange={(e) => {
                  const found = internshipsList.find((i) => i.internship_id === e.target.value);
                  if (found) {
                    onSelectInternship(found);
                    setCoverLetterData(null); // Reset letter for new role
                  }
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
              >
                {internshipsList.map((i) => (
                  <option key={i.internship_id} value={i.internship_id}>
                    {i.company} — {i.title} ({i.work_mode || 'Remote'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Target Internship Header Card */}
      {currentRole && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-brand-300 font-semibold text-xs mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentRole.company}</span>
                <span>•</span>
                <span className="text-slate-300">{currentRole.work_mode || 'Remote'}</span>
                {currentRole.stipend && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{currentRole.stipend}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentRole.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl line-clamp-2 leading-relaxed">
                {currentRole.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 self-start md:self-auto max-w-xs justify-end">
              {currentRole.required_skills?.slice(0, 4).map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/10 text-brand-200 border border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Left (Resume & Match Analysis) | Right (Cover Letter Studio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Candidate & Matching Details */}
        <div className="lg:col-span-5 space-y-6">
          <ResumeSelector
            selectedResume={selectedResume}
            onSelectResume={(resume) => {
              setSelectedResume(resume);
              setCoverLetterData(null);
            }}
          />

          <MatchingScoreGauge
            analysis={matchAnalysis}
            loading={loadingMatch}
          />
        </div>

        {/* Right Column: Generation Controls & Live Letter Preview */}
        <div className="lg:col-span-7">
          <CoverLetterPreview
            coverLetterData={coverLetterData}
            internship={currentRole}
            resume={selectedResume}
            generating={generating}
            error={error}
            selectedTone={selectedTone}
            onChangeTone={(t) => setSelectedTone(t)}
            onGenerate={handleGenerateCoverLetter}
          />
        </div>
      </div>
    </div>
  );
};

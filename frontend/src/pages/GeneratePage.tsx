import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Briefcase,
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
}) => {
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchingAnalysisResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('professional');

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

  if (!selectedInternship) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Internship Selected</h2>
        <p className="text-sm text-slate-500">
          Please select an internship from the catalog first to tailor a cover letter.
        </p>
        <button
          onClick={onBackToInternships}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Available Internships</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToInternships}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Internships</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Step 2 of 2</span>
          <span>•</span>
          <span className="font-semibold text-slate-700">Studio & Generation</span>
        </div>
      </div>

      {/* Target Internship Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-xs mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{selectedInternship.company}</span>
              <span>•</span>
              <span className="text-slate-500">{selectedInternship.work_mode || 'Remote'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {selectedInternship.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl line-clamp-2">
              {selectedInternship.description}
            </p>
          </div>

          <button
            onClick={onBackToInternships}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-700 hover:bg-brand-50 border border-brand-200 transition-colors"
          >
            Change Role
          </button>
        </div>
      </div>

      {/* Two Column Layout: Left (Resume & Match Analysis) | Right (Cover Letter Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Candidate & Matching Details */}
        <div className="lg:col-span-5 space-y-6">
          <ResumeSelector
            selectedResume={selectedResume}
            onSelectResume={(resume) => setSelectedResume(resume)}
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
            internship={selectedInternship}
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

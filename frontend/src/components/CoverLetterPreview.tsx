import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  RotateCw,
  Sparkles,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { CoverLetterResponse, Internship, ResumeData } from '../types';

interface CoverLetterPreviewProps {
  coverLetterData: CoverLetterResponse | null;
  internship: Internship | null;
  resume: ResumeData | null;
  generating: boolean;
  error: string | null;
  selectedTone: string;
  onChangeTone: (tone: string) => void;
  onGenerate: () => void;
}

export const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({
  coverLetterData,
  internship,
  resume,
  generating,
  error,
  selectedTone,
  onChangeTone,
  onGenerate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!coverLetterData?.cover_letter) return;
    try {
      await navigator.clipboard.writeText(coverLetterData.cover_letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadTxt = () => {
    if (!coverLetterData?.cover_letter) return;
    const filename = `Cover_Letter_${internship?.company || 'Company'}_${coverLetterData.candidate_name.replace(/\s+/g, '_')}.txt`;
    const blob = new Blob([coverLetterData.cover_letter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span>AI Cover Letter Generator</span>
          </h2>
          <p className="text-xs text-slate-500">
            Synthesizes candidate qualifications and role requirements into a tailored professional letter.
          </p>
        </div>

        {/* Tone Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 ml-2 text-slate-400" />
            {['professional', 'enthusiastic', 'concise'].map((tone) => (
              <button
                key={tone}
                onClick={() => onChangeTone(tone)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  selectedTone === tone
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>

          <button
            onClick={onGenerate}
            disabled={generating || !internship || !resume}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {generating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Crafting Letter...</span>
              </>
            ) : coverLetterData ? (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate Letter</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Cover Letter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Generation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="mt-6">
        {generating ? (
          /* Loading Animation / Skeleton */
          <div className="p-8 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4 animate-pulse">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
              <div className="h-3.5 bg-slate-200 rounded w-full"></div>
              <div className="h-3.5 bg-slate-200 rounded w-4/6"></div>
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-3.5 bg-slate-200 rounded w-full"></div>
              <div className="h-3.5 bg-slate-200 rounded w-11/12"></div>
              <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="pt-6">
              <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            </div>
          </div>
        ) : coverLetterData ? (
          /* Letterhead Display */
          <div className="border border-slate-200 rounded-2xl p-6 sm:p-10 bg-white shadow-sm font-sans relative">
            {/* Action Bar Floating Top Right */}
            <div className="flex items-center justify-end space-x-2 mb-6 pb-4 border-b border-slate-100 print:hidden">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download TXT</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>

            {/* Document Letterhead */}
            <div className="space-y-6 text-slate-800 text-sm leading-relaxed max-w-prose">
              {/* Candidate Info Header */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {coverLetterData.candidate_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {resume?.email && <span>{resume.email}</span>}
                  {resume?.phone && <span> • {resume.phone}</span>}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(coverLetterData.generated_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Target Company Header */}
              <div className="pt-2 text-xs text-slate-600 border-t border-slate-100">
                <p className="font-bold text-slate-900">Internship Selection:</p>
                <p className="text-brand-700 font-semibold">{coverLetterData.internship_title}</p>
                <p className="font-medium text-slate-700">{coverLetterData.company_name}</p>
              </div>

              {/* Cover Letter Content Body */}
              <div className="pt-2 whitespace-pre-wrap font-serif text-slate-800 text-sm leading-relaxed tracking-normal">
                {coverLetterData.cover_letter}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>Cover Letter ID: <code className="font-mono">{coverLetterData.cover_letter_id}</code></span>
              <span className="flex items-center space-x-1">
                <span>Verified Match Skills:</span>
                <span className="font-medium text-slate-600">
                  {coverLetterData.matching_skills.join(', ')}
                </span>
              </span>
            </div>
          </div>
        ) : (
          /* Empty / Call to Action State */
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Cover Letter Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Generate Cover Letter&quot; above to tailor a personalized letter for{' '}
              <strong className="text-slate-700">{internship?.title || 'the selected internship'}</strong>.
            </p>
            <button
              onClick={onGenerate}
              disabled={!internship || !resume}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

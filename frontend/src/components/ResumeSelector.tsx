import React, { useState, useEffect } from 'react';
import { User, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { ResumeData } from '../types';
import { api } from '../services/api';

interface ResumeSelectorProps {
  selectedResume: ResumeData | null;
  onSelectResume: (resume: ResumeData) => void;
}

export const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  selectedResume,
  onSelectResume,
}) => {
  const [activeMode, setActiveMode] = useState<'sample' | 'upload' | 'json'>('sample');
  const [sampleResumes, setSampleResumes] = useState<ResumeData[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSamples() {
      setLoadingSamples(true);
      try {
        const samples = await api.getSampleResumes();
        setSampleResumes(samples);
        if (samples.length > 0 && !selectedResume) {
          onSelectResume(samples[0]);
        }
      } catch (err) {
        console.error('Failed to load sample resumes', err);
      } finally {
        setLoadingSamples(false);
      }
    }
    loadSamples();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const parsedResume = await api.uploadResumeFile(file);
      onSelectResume(parsedResume);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse resume upload';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleApplyJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.candidate_name) {
        setJsonError('JSON must include at least candidate_name field');
        return;
      }
      onSelectResume(parsed as ResumeData);
    } catch {
      setJsonError('Invalid JSON format. Please verify syntax.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-brand-600" />
            <span>Candidate Resume Profile</span>
          </h2>
          <p className="text-xs text-slate-500">
            Select a verified candidate profile, upload a PDF/DOCX, or provide resume JSON.
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMode('sample')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'sample'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sample Candidates
          </button>
          <button
            onClick={() => setActiveMode('upload')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'upload'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Resume
          </button>
          <button
            onClick={() => setActiveMode('json')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'json'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct JSON
          </button>
        </div>
      </div>

      {/* Mode 1: Pre-loaded Candidate Cards */}
      {activeMode === 'sample' && (
        <div>
          {loadingSamples ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading candidate profiles...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sampleResumes.map((cand) => {
                const isCurrent = selectedResume?.candidate_id === cand.candidate_id;
                return (
                  <div
                    key={cand.candidate_id}
                    onClick={() => onSelectResume(cand)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{cand.candidate_name}</span>
                      {isCurrent && <CheckCircle className="w-4 h-4 text-brand-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">{cand.email || cand.summary}</p>
                    <div className="flex flex-wrap gap-1">
                      {cand.skills?.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                      {cand.skills?.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                          +{cand.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: File Upload (PDF / DOCX) */}
      {activeMode === 'upload' && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">Upload Resume Document</h3>
          <p className="text-xs text-slate-500 mb-4">
            Supports PDF or DOCX files. Our parser will extract candidate information automatically.
          </p>
          <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 cursor-pointer shadow-sm">
            <span>{uploading ? 'Parsing Resume...' : 'Browse File'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          {uploadError && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: JSON Input */}
      {activeMode === 'json' && (
        <div className="space-y-3">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`{\n  "candidate_name": "Arun Kumar",\n  "skills": ["Python", "FastAPI", "React"],\n  "summary": "..."\n}`}
            className="w-full h-36 p-3 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          {jsonError && (
            <p className="text-xs text-rose-600 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {jsonError}
            </p>
          )}
          <button
            onClick={handleApplyJson}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-colors"
          >
            Apply JSON Data
          </button>
        </div>
      )}

      {/* Currently Selected Summary Preview */}
      {selectedResume && (
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {selectedResume.candidate_name?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Active Candidate</p>
              <h4 className="text-sm font-bold text-slate-900">{selectedResume.candidate_name}</h4>
              <p className="text-xs text-slate-500">{selectedResume.email || 'No email provided'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{selectedResume.skills?.length || 0}</span>
            <span>Skills on record</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-900">{selectedResume.projects?.length || 0}</span>
            <span>Projects</span>
          </div>
        </div>
      )}
    </div>
  );
};

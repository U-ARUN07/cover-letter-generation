import React from 'react';
import { CheckCircle2, AlertTriangle, FolderGit2, Sparkles, TrendingUp } from 'lucide-react';
import { MatchingAnalysisResult } from '../types';

interface MatchingScoreGaugeProps {
  analysis: MatchingAnalysisResult | null;
  loading?: boolean;
}

export const MatchingScoreGauge: React.FC<MatchingScoreGaugeProps> = ({
  analysis,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl mb-4"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!analysis) return null;

  const score = analysis.match_percentage || 0;
  const getScoreColor = (val: number) => {
    if (val >= 75) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (val >= 50) return 'text-blue-600 border-blue-500 bg-blue-50';
    return 'text-amber-600 border-amber-500 bg-amber-50';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <span>Qualification Match Analysis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Automated alignment between verified candidate resume & internship requirements.
          </p>
        </div>

        {/* Score Pill */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center space-x-2 ${getScoreColor(score)}`}>
          <span className="text-2xl font-black">{score}%</span>
          <span className="text-xs font-bold uppercase tracking-wider">Match</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-brand-500' : 'bg-amber-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Skills Matched & Gaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matched Skills */}
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Matching Skills ({analysis.matching_skills.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matching_skills.length > 0 ? (
                analysis.matching_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100/70 text-emerald-800"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No direct skill matches</span>
              )}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Skill Gaps ({analysis.skill_gaps.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skill_gaps.length > 0 ? (
                analysis.skill_gaps.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100/70 text-amber-800"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-700 font-medium">All required skills met!</span>
              )}
            </div>
          </div>
        </div>

        {/* Relevant Projects Identified */}
        {analysis.relevant_projects && analysis.relevant_projects.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Highlighted Projects ({analysis.relevant_projects.length})</span>
            </h4>
            <ul className="space-y-1 text-xs text-slate-600">
              {analysis.relevant_projects.map((proj, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-500 font-bold">•</span>
                  <span>{proj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="bg-brand-50/40 rounded-xl p-4 border border-brand-100">
            <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Tailoring Recommendations</span>
            </h4>
            <ul className="space-y-1 text-xs text-brand-900">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-brand-600 font-bold">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

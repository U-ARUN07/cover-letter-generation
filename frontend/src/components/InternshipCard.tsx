import React from 'react';
import { Building2, MapPin, Clock, DollarSign, ArrowRight, Eye } from 'lucide-react';
import { Internship } from '../types';

interface InternshipCardProps {
  internship: Internship;
  isSelected?: boolean;
  onSelect: (internship: Internship) => void;
  onViewDetails: (internship: Internship) => void;
}

export const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  isSelected,
  onSelect,
  onViewDetails,
}) => {
  const getWorkModeBadge = (mode?: string) => {
    const m = (mode || 'Remote').toLowerCase();
    if (m.includes('remote')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (m.includes('hybrid')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between hover:shadow-lg ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div>
        {/* Header: Company & Work Mode */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2 text-slate-600">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-slate-800">{internship.company}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getWorkModeBadge(
              internship.work_mode
            )}`}
          >
            {internship.work_mode || 'Remote'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-brand-600">
          {internship.title}
        </h3>

        {/* Meta badges: Location, Duration, Stipend */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 mb-4">
          {internship.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{internship.location}</span>
            </div>
          )}
          {internship.duration && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{internship.duration}</span>
            </div>
          )}
          {internship.stipend && (
            <div className="flex items-center space-x-1 font-medium text-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{internship.stipend}</span>
            </div>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {internship.description}
        </p>

        {/* Required skills chips */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Required Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {internship.required_skills?.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(internship)}
          className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details</span>
        </button>

        <button
          onClick={() => onSelect(internship)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <span>Generate Cover Letter</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

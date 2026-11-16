import React from 'react';
import { X, Building2, MapPin, Clock, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { Internship } from '../types';

interface InternshipDetailModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (internship: Internship) => void;
}

export const InternshipDetailModal: React.FC<InternshipDetailModalProps> = ({
  internship,
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen || !internship) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2 text-brand-700 font-semibold text-sm mb-1">
              <Building2 className="w-4 h-4" />
              <span>{internship.company}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{internship.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {internship.location || 'Location Not Specified'}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {internship.duration || 'Flexible'}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
              {internship.stipend || 'Competitive Stipend'}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Work Mode: {internship.work_mode || 'Remote'}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">About the Role</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{internship.description}</p>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Required Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {internship.required_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Preferred Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {internship.preferred_skills && internship.preferred_skills.length > 0 ? (
                  internship.preferred_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">None specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          {internship.responsibilities && internship.responsibilities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Roles & Responsibilities</h3>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {internship.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements & Education */}
          {(internship.requirements || internship.education_requirements) && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Eligibility & Prerequisites</h3>
              {internship.education_requirements && (
                <p className="text-xs text-slate-600 mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong className="text-slate-800">Education:</strong>{' '}
                  {internship.education_requirements}
                </p>
              )}
              {internship.requirements && internship.requirements.length > 0 && (
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {internship.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-2 mr-1"></span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelect(internship);
              onClose();
            }}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
          >
            <span>Proceed with this Internship</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

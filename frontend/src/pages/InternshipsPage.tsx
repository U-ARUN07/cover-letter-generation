import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, RefreshCw, Sparkles, Briefcase } from 'lucide-react';
import { Internship } from '../types';
import { api } from '../services/api';
import { InternshipCard } from '../components/InternshipCard';
import { InternshipDetailModal } from '../components/InternshipDetailModal';

interface InternshipsPageProps {
  onSelectInternshipForGeneration: (internship: Internship) => void;
}

export const InternshipsPage: React.FC<InternshipsPageProps> = ({
  onSelectInternshipForGeneration,
}) => {
  const [allInternships, setAllInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [workMode, setWorkMode] = useState<string>('All');
  const [selectedForModal, setSelectedForModal] = useState<Internship | null>(null);

  const fetchInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInternships();
      setAllInternships(data.internships || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch internships';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  // Instant multi-attribute search across title, company, skills, location, responsibilities
  const filteredInternships = useMemo(() => {
    return allInternships.filter((item) => {
      // 1. Work Mode Filter
      if (workMode !== 'All') {
        const itemMode = (item.work_mode || 'Remote').toLowerCase();
        if (!itemMode.includes(workMode.toLowerCase())) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (!searchQuery.trim()) {
        return true;
      }

      const q = searchQuery.toLowerCase().trim();
      const inTitle = item.title?.toLowerCase().includes(q);
      const inCompany = item.company?.toLowerCase().includes(q);
      const inDesc = item.description?.toLowerCase().includes(q);
      const inLocation = item.location?.toLowerCase().includes(q);
      const inSkills = item.required_skills?.some((s) => s.toLowerCase().includes(q)) ||
                       item.preferred_skills?.some((s) => s.toLowerCase().includes(q));
      const inResponsibilities = item.responsibilities?.some((r) => r.toLowerCase().includes(q));

      return inTitle || inCompany || inDesc || inLocation || inSkills || inResponsibilities;
    });
  }, [allInternships, searchQuery, workMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Application Agent</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Available Internships & Roles
          </h1>
          <p className="text-sm sm:text-base text-brand-100/90 leading-relaxed">
            Browse verified internship postings from Infosys and industry leaders. Select a role to analyze your qualification alignment and generate an authentic, personalized cover letter.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Instant Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type any skill (Python, Java, React, SQL), role, or company..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Work Mode Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Mode:
          </span>
          {['All', 'Remote', 'Hybrid', 'On-site'].map((mode) => (
            <button
              key={mode}
              onClick={() => setWorkMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                workMode === mode
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900">{filteredInternships.length}</strong> of {allInternships.length} opportunities
          {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
        </span>
        <button
          onClick={fetchInternships}
          className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand-600 font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800">
          <strong>Error loading internships:</strong> {error}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-16 bg-slate-100 rounded"></div>
              <div className="h-8 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredInternships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInternships.map((internship) => (
            <InternshipCard
              key={internship.internship_id}
              internship={internship}
              onSelect={onSelectInternshipForGeneration}
              onViewDetails={(item) => setSelectedForModal(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No internships found</h3>
          <p className="text-xs text-slate-500 mb-4">
            No opportunities matched your search criteria &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setWorkMode('All');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <InternshipDetailModal
        internship={selectedForModal}
        isOpen={Boolean(selectedForModal)}
        onClose={() => setSelectedForModal(null)}
        onSelect={onSelectInternshipForGeneration}
      />
    </div>
  );
};

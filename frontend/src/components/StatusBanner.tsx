import React from 'react';
import { AlertTriangle, Key } from 'lucide-react';
import { HealthStatus } from '../types';

interface StatusBannerProps {
  health: HealthStatus | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ health }) => {
  if (!health) return null;

  if (health.llm_configured) {
    return null; // All good, no need to show warning banner
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>LLM API Key Not Configured:</strong> The system is running in offline mode. To generate personalized cover letters using live LLM models, set your <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">GEMINI_API_KEY</code> or <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">OPENAI_API_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">backend/.env</code>.
          </span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 text-amber-800">
            <Key className="w-3 h-3 mr-1" />
            Config Ready
          </span>
        </div>
      </div>
    </div>
  );
};

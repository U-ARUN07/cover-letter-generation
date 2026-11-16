import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HealthStatus } from '../types';

interface StatusBannerProps {
  health: HealthStatus | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ health }) => {
  if (!health) return null;

  // When Ollama or any LLM is configured, show a clean, reassuring active banner
  if (health.llm_configured) {
    return (
      <div className="bg-emerald-50/80 border-b border-emerald-200/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>AI Model Active:</strong> Powered by local <strong>Ollama ({health.llm_provider})</strong>. Ready to generate role-specific cover letters.
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            Offline & Free
          </span>
        </div>
      </div>
    );
  }

  return null;
};

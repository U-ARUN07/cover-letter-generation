import {
  Internship,
  InternshipListResponse,
  ResumeData,
  MatchingAnalysisResult,
  CoverLetterResponse,
  HealthStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string'
          ? errJson.detail
          : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthStatus>(res);
  },

  async getInternships(query?: string, workMode?: string): Promise<InternshipListResponse> {
    const params = new URLSearchParams();
    if (query?.trim()) params.append('query', query.trim());
    if (workMode && workMode !== 'All') params.append('work_mode', workMode);

    const res = await fetch(`${API_BASE}/api/v1/internships?${params.toString()}`);
    return handleResponse<InternshipListResponse>(res);
  },

  async getInternshipById(id: string): Promise<Internship> {
    const res = await fetch(`${API_BASE}/api/v1/internships/${id}`);
    return handleResponse<Internship>(res);
  },

  async getSampleResumes(): Promise<ResumeData[]> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/samples`);
    return handleResponse<ResumeData[]>(res);
  },

  async getResumeById(id: string): Promise<ResumeData> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${id}`);
    return handleResponse<ResumeData>(res);
  },

  async registerResume(data: ResumeData): Promise<ResumeData> {
    const res = await fetch(`${API_BASE}/api/v1/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<ResumeData>(res);
  },

  async uploadResumeFile(file: File): Promise<ResumeData> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/v1/resumes/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ResumeData>(res);
  },

  async analyzeMatch(
    internshipId: string,
    candidateId?: string,
    resumeData?: ResumeData
  ): Promise<MatchingAnalysisResult> {
    const params = new URLSearchParams({ internship_id: internshipId });
    if (candidateId) params.append('candidate_id', candidateId);

    const res = await fetch(`${API_BASE}/api/v1/internships/match?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: resumeData ? JSON.stringify(resumeData) : undefined,
    });
    return handleResponse<MatchingAnalysisResult>(res);
  },

  async generateCoverLetter(
    candidateId: string,
    internshipId: string,
    tone: string = 'professional'
  ): Promise<CoverLetterResponse> {
    const res = await fetch(`${API_BASE}/api/v1/cover-letters/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidateId,
        internship_id: internshipId,
        tone,
      }),
    });
    return handleResponse<CoverLetterResponse>(res);
  },

  async generateCoverLetterFromResume(
    internshipId: string,
    resumeData: ResumeData,
    tone: string = 'professional'
  ): Promise<CoverLetterResponse> {
    const res = await fetch(`${API_BASE}/api/v1/cover-letters/generate-from-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internship_id: internshipId,
        resume_data: resumeData,
        tone,
      }),
    });
    return handleResponse<CoverLetterResponse>(res);
  },

  async getCoverLetterById(coverLetterId: string): Promise<CoverLetterResponse> {
    const res = await fetch(`${API_BASE}/api/v1/cover-letters/${coverLetterId}`);
    return handleResponse<CoverLetterResponse>(res);
  },
};

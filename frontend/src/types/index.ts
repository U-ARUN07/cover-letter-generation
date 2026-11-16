export interface Internship {
  internship_id: string;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  requirements: string[];
  education_requirements?: string;
  experience_requirements?: string;
  location?: string;
  work_mode?: string;
  duration?: string;
  stipend?: string;
}

export interface InternshipListResponse {
  total: number;
  internships: Internship[];
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  field_of_study?: string;
  graduation_year?: string;
  gpa?: string;
}

export interface ExperienceItem {
  title?: string;
  company?: string;
  duration?: string;
  description?: string;
  achievements?: string[];
}

export interface ProjectItem {
  name?: string;
  description?: string;
  technologies?: string[];
  link?: string;
}

export interface ResumeData {
  candidate_id?: string;
  candidate_name: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications?: (string | Record<string, unknown>)[];
  achievements?: string[];
}

export interface MatchingAnalysisResult {
  internship_id: string;
  internship_title: string;
  company_name: string;
  candidate_name: string;
  matching_skills: string[];
  skill_gaps: string[];
  relevant_projects: string[];
  relevant_experience: string[];
  relevant_education: string[];
  match_percentage: number;
  recommendations: string[];
}

export interface CoverLetterResponse {
  cover_letter_id: string;
  candidate_id?: string;
  candidate_name: string;
  internship_id: string;
  internship_title: string;
  company_name: string;
  matching_skills: string[];
  relevant_projects: string[];
  relevant_experience: string[];
  cover_letter: string;
  generated_at: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  llm_provider: string;
  llm_configured: boolean;
  gemini_configured: boolean;
  openai_configured: boolean;
  database: string;
  timestamp: string;
}

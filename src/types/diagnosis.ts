// Types for enhanced diagnosis engine

export interface MedicalDataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'research' | 'clinical' | 'database';
  reliability: 'high' | 'medium' | 'low';
  accessLevel: 'free' | 'premium' | 'institutional';
}

export interface DiagnosisEvidence {
  source: string;
  sourceType: string;
  title: string;
  content: string;
  confidence: number;
  relevance: number;
  citation: string;
  url?: string;
  publishedDate?: string;
  authors?: string[];
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  confidence: number;
  reasoning: string;
  supportingEvidence: DiagnosisEvidence[];
  contraindications?: string[];
  riskFactors?: string[];
}

export interface RecommendedTest {
  testName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reasoning: string;
  expectedFindings?: string;
  cost?: string;
  invasiveness: 'non-invasive' | 'minimally-invasive' | 'invasive';
}

export interface TreatmentRecommendation {
  treatment: string;
  type: 'medication' | 'procedure' | 'lifestyle' | 'monitoring';
  priority: 'immediate' | 'urgent' | 'routine';
  dosage?: string;
  duration?: string;
  contraindications?: string[];
  sideEffects?: string[];
  monitoring?: string[];
}

export interface StructuredDiagnosisResponse {
  id: string;
  timestamp: string;
  patientInfo?: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
  };
  executiveSummary: string;
  differentialDiagnoses: DifferentialDiagnosis[];
  supportingEvidence: DiagnosisEvidence[];
  recommendedTests: RecommendedTest[];
  treatmentRecommendations: TreatmentRecommendation[];
  references: DiagnosisEvidence[];
  dataSourcesUsed: string[];
  confidenceScore: number;
  limitations: string[];
  followUpRecommendations: string[];
  emergencyFlags?: string[];
}

export interface DiagnosisReportMetadata {
  doctorInfo: {
    name: string;
    license: string;
    specialty: string;
    institution: string;
  };
  patientInfo?: {
    id?: string;
    name?: string;
    age?: number;
    gender?: string;
  };
  reportType: 'ai-assisted-diagnosis' | 'differential-diagnosis' | 'image-analysis';
  generatedAt: string;
  dataSourcesUsed: string[];
  disclaimer: string;
}

export interface ShareOptions {
  recipients: string[];
  message?: string;
  expirationDate?: string;
  accessLevel: 'view' | 'comment' | 'edit';
  requireLogin: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'json';
  includeImages: boolean;
  includeReferences: boolean;
  includeMetadata: boolean;
  template: 'standard' | 'detailed' | 'summary';
}

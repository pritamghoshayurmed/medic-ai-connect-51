import { Database, FileText, Search, BookOpen, Microscope, Heart, Brain, Stethoscope } from "lucide-react";
import { MedicalDataSource } from "@/types/diagnosis";

export const MEDICAL_DATA_SOURCES: MedicalDataSource[] = [
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'National Library of Medicine database with over 34 million citations for biomedical literature from MEDLINE, life science journals, and online books.',
    icon: <Database className="h-4 w-4" />,
    enabled: true,
    category: 'research',
    reliability: 'high',
    accessLevel: 'free'
  },
  {
    id: 'clinicaltrials',
    name: 'ClinicalTrials.gov',
    description: 'Registry and results database of publicly and privately supported clinical studies of human participants conducted around the world.',
    icon: <FileText className="h-4 w-4" />,
    enabled: true,
    category: 'clinical',
    reliability: 'high',
    accessLevel: 'free'
  },
  {
    id: 'cochrane',
    name: 'Cochrane Library',
    description: 'Collection of high-quality, independent evidence to inform healthcare decision-making including systematic reviews and clinical trials.',
    icon: <BookOpen className="h-4 w-4" />,
    enabled: false,
    category: 'research',
    reliability: 'high',
    accessLevel: 'premium'
  },
  {
    id: 'embase',
    name: 'Embase',
    description: 'Biomedical database with emphasis on drug and medical device research, including conference abstracts and in-process records.',
    icon: <Microscope className="h-4 w-4" />,
    enabled: false,
    category: 'research',
    reliability: 'high',
    accessLevel: 'institutional'
  },
  {
    id: 'uptodate',
    name: 'UpToDate',
    description: 'Evidence-based clinical decision support resource with comprehensive medical information and treatment recommendations.',
    icon: <Stethoscope className="h-4 w-4" />,
    enabled: false,
    category: 'clinical',
    reliability: 'high',
    accessLevel: 'premium'
  },
  {
    id: 'nejm',
    name: 'New England Journal of Medicine',
    description: 'Peer-reviewed medical journal publishing original research articles, review articles, and case reports.',
    icon: <Heart className="h-4 w-4" />,
    enabled: false,
    category: 'research',
    reliability: 'high',
    accessLevel: 'premium'
  },
  {
    id: 'case_studies',
    name: 'Medical Case Studies Database',
    description: 'Comprehensive collection of clinical case reports and studies from various medical specialties and institutions.',
    icon: <FileText className="h-4 w-4" />,
    enabled: true,
    category: 'clinical',
    reliability: 'medium',
    accessLevel: 'free'
  },
  {
    id: 'radiology_db',
    name: 'Radiology Reference Database',
    description: 'Specialized database of radiological findings, imaging patterns, and diagnostic criteria for various conditions.',
    icon: <Brain className="h-4 w-4" />,
    enabled: false,
    category: 'database',
    reliability: 'high',
    accessLevel: 'institutional'
  },
  {
    id: 'orphanet',
    name: 'Orphanet',
    description: 'Reference portal for information on rare diseases and orphan drugs, providing comprehensive data on rare conditions.',
    icon: <Search className="h-4 w-4" />,
    enabled: false,
    category: 'database',
    reliability: 'high',
    accessLevel: 'free'
  },
  {
    id: 'who_icd',
    name: 'WHO ICD-11',
    description: 'World Health Organization International Classification of Diseases, 11th Revision for standardized disease classification.',
    icon: <BookOpen className="h-4 w-4" />,
    enabled: true,
    category: 'database',
    reliability: 'high',
    accessLevel: 'free'
  }
];

export const DATA_SOURCE_CATEGORIES = {
  research: {
    name: 'Research Databases',
    description: 'Peer-reviewed scientific literature and research publications',
    color: 'blue'
  },
  clinical: {
    name: 'Clinical Resources',
    description: 'Clinical trials, case studies, and treatment guidelines',
    color: 'green'
  },
  database: {
    name: 'Reference Databases',
    description: 'Standardized medical classifications and reference materials',
    color: 'purple'
  }
};

export const RELIABILITY_LEVELS = {
  high: {
    name: 'High Reliability',
    description: 'Peer-reviewed, evidence-based sources',
    color: 'green',
    weight: 1.0
  },
  medium: {
    name: 'Medium Reliability',
    description: 'Professional sources with editorial oversight',
    color: 'yellow',
    weight: 0.7
  },
  low: {
    name: 'Low Reliability',
    description: 'General information sources',
    color: 'red',
    weight: 0.4
  }
};

export const ACCESS_LEVELS = {
  free: {
    name: 'Free Access',
    description: 'Publicly available resources',
    icon: '🆓'
  },
  premium: {
    name: 'Premium Access',
    description: 'Subscription-based resources',
    icon: '💎'
  },
  institutional: {
    name: 'Institutional Access',
    description: 'Requires institutional subscription',
    icon: '🏥'
  }
};

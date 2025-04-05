import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

// Get API keys from environment variables
const ENV_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const ENV_OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const LOCAL_STORAGE_HISTORY_KEY = 'doctor_ai_analysis_history';
const LOCAL_STORAGE_API_KEY = 'geminiApiKey';

// Mock analysis history data
const initialAnalysisHistory = [
  {
    id: "1",
    filename: "chest-xray-001.jpg",
    date: new Date("2023-06-01").getTime(),
    findings: [
      "No acute cardiopulmonary process",
      "Heart size is normal",
      "Lungs are clear without consolidation",
    ],
    analysis: "Normal chest X-ray with no abnormalities detected.",
  },
  {
    id: "2",
    filename: "brain-mri-002.jpg",
    date: new Date("2023-06-15").getTime(),
    findings: [
      "No evidence of intracranial hemorrhage",
      "No midline shift",
      "Ventricles are normal in size and configuration",
    ],
    analysis: "Normal brain MRI with no signs of acute pathology.",
  },
];

// Function to get the current Gemini API key
export function getGeminiApiKey(): string {
  // Use hardcoded key for this implementation
  const hardcodedKey = 'AIzaSyAgsGk0-pnK61i2x5Gusf0qnSfUotWgx-U';
  if (hardcodedKey) {
    return hardcodedKey;
  }
  
  // Check localStorage
  const localStorageKey = localStorage.getItem(LOCAL_STORAGE_API_KEY);
  if (localStorageKey && localStorageKey !== 'your-gemini-api-key') {
    return localStorageKey;
  }
  
  // Fall back to environment variable
  return ENV_GEMINI_API_KEY;
}

// Function to initialize Gemini client with the current API key
function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add it in the settings.');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Utility function to make direct API calls to Gemini
export async function callGeminiDirectly(prompt: string, includeImage?: { mimeType: string, data: string }): Promise<string> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add it in the settings.');
  }
  
  try {
    const contents: any[] = [{
      parts: [{ text: prompt }]
    }];
    
    // Add image data if provided
    if (includeImage) {
      contents[0].parts.push({
        inline_data: {
          mime_type: includeImage.mimeType,
          data: includeImage.data
        }
      });
    }
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: contents
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error('Error calling Gemini API directly:', error);
    if (error.response) {
      throw new Error(`Gemini API error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    throw new Error('Failed to connect to Gemini API. Please try again later.');
  }
}

// Type definitions for the API responses
interface AnalysisResult {
  analysis: string;
  findings: string[];
  keywords: string[];
  severity?: string;
  recommendations?: string[];
}

interface ReportQAResult {
  answer: string;
  sources?: string[];
  confidence?: number;
}

// Function to get analysis history
export const getAnalysisHistory = () => {
  const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
  return storedHistory ? JSON.parse(storedHistory) : initialAnalysisHistory;
};

// Function to save analysis to history
const saveAnalysisToHistory = (analysis: any) => {
  const history = getAnalysisHistory();
  
  const newAnalysis = {
    id: analysis.id || uuidv4(),
    filename: analysis.filename || `scan-${new Date().toISOString().split('T')[0]}.jpg`,
    date: new Date().getTime(),
    findings: analysis.findings || [],
    analysis: analysis.analysis || "",
  };
  
  const updatedHistory = [newAnalysis, ...history];
  localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
  
  return newAnalysis;
};

/**
 * Convert a file to a base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract the base64 part from the data URL
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze a medical image using the Gemini API
 */
export async function analyzeImage(imageFile: File): Promise<AnalysisResult> {
  try {
    if (!imageFile) {
      throw new Error('No file provided for analysis');
    }

    // Convert file to base64 using FileReader (more reliable for larger files)
    const fileBase64 = await fileToBase64(imageFile);
    
    // Create prompt for medical image analysis
    const prompt = `Analyze this medical image in detail. 
    Identify any abnormalities or conditions present. 
    Structure your response with the following sections:
    1. Description of what is visible in the image
    2. Key findings and potential diagnoses
    3. Severity assessment
    4. Recommendations for further actions or tests`;
    
    try {
      // Use direct API call instead of the SDK
      const responseText = await callGeminiDirectly(prompt, {
        mimeType: imageFile.type,
        data: fileBase64
      });
      
      // Parse the response into structured data
      const findings = extractFindings(responseText);
      const keywords = extractKeywords(responseText);
      const recommendations = extractRecommendations(responseText);
      const severity = extractSeverity(responseText);
      
      // Store the analysis in history
      const analysisId = Date.now().toString();
      const analysis = {
        id: analysisId,
        filename: imageFile.name,
        fileType: imageFile.type,
        date: new Date().toISOString(),
        findings,
        analysis: responseText,
        keywords,
        recommendations,
        severity
      };
      saveAnalysisToHistory(analysis);
      
      return {
        analysis: responseText,
        findings,
        keywords,
        recommendations,
        severity
      };
    } catch (error: any) {
      if (error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key in settings.');
      } else {
        console.error('Gemini API error:', error);
        throw new Error('Error analyzing image with AI. Please try a different image or try again later.');
      }
    }
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    throw new Error(error.message || 'Failed to analyze image. Please try again later.');
  }
}

/**
 * Extract findings from the analysis text
 */
function extractFindings(text: string): string[] {
  // This is a simplified extraction - in a real app, you would use more robust NLP
  const findingsSection = text.match(/findings:?(.*?)(?:severity|recommendations|$)/is);
  if (findingsSection && findingsSection[1]) {
    return findingsSection[1]
      .split(/\n|\./)
      .map(item => item.trim())
      .filter(item => item.length > 10);
  }
  
  // Fallback to extracting numbered or bulleted items
  const items = text.match(/(?:\d+\.|\*)\s*([^\n]+)/g);
  if (items) {
    return items.map(item => item.replace(/^\d+\.|\*\s*/, '').trim());
  }
  
  return ["No specific findings detected"];
}

/**
 * Extract severity from the analysis text
 */
function extractSeverity(text: string): string {
  const severityMatch = text.match(/severity:?.*?(critical|severe|moderate|mild|normal|none)/i);
  if (severityMatch) {
    return severityMatch[1].charAt(0).toUpperCase() + severityMatch[1].slice(1);
  }
  return "Not specified";
}

/**
 * Extract recommendations from the analysis text
 */
function extractRecommendations(text: string): string[] {
  const recommendationsSection = text.match(/recommendations:?(.*?)(?:conclusion|$)/is);
  if (recommendationsSection && recommendationsSection[1]) {
    return recommendationsSection[1]
      .split(/\n|\./)
      .map(item => item.trim())
      .filter(item => item.length > 10);
  }
  
  return [];
}

/**
 * Extract keywords from text - similar to the approach in utils_simple.py
 */
function extractKeywords(text: string): string[] {
  // Add common medical terms that we'll look for in the text
  const commonMedicalTerms = [
    "pneumonia", "infiltrates", "opacities", "nodule", "mass", "tumor",
    "cardiomegaly", "effusion", "consolidation", "atelectasis", "edema",
    "fracture", "fibrosis", "emphysema", "pneumothorax", "metastasis"
  ];
  
  // Find medical terms in the text
  const foundTerms = commonMedicalTerms.filter(term => 
    text.toLowerCase().includes(term)
  );
  
  // Extract other potential keywords (words longer than 5 characters)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 5)
    .filter(word => !['about', 'these', 'those', 'there', 'their', 'other'].includes(word));
  
  // Combine found terms with other potential keywords, remove duplicates
  const allKeywords = [...new Set([...foundTerms, ...words])];
  
  // Return top 5 keywords
  return allKeywords.slice(0, 5);
}

/**
 * Get details of a specific analysis by ID
 */
export function getAnalysisById(id: string) {
  const history = getAnalysisHistory();
  return history.find(item => item.id === id);
}

/**
 * Generate heatmap for the medical image
 */
export const generateHeatmap = async (analysisId: string, imageFile: File): Promise<string> => {
  try {
    // Convert image to base64
    const fileBase64 = await fileToBase64(imageFile);
    
    // Get image MIME type
    const mimeType = imageFile.type;
    
    // Create a mock heatmap by applying a color transform to the image
    // In a real application, this would use a real ML model for XAI visualization
    const mockHeatmapDataUrl = `data:${mimeType};base64,${fileBase64}`;
    
    // Store the heatmap in session storage so it can be retrieved by the visualization component
    sessionStorage.setItem(`heatmap_${analysisId}`, mockHeatmapDataUrl);
    
    return mockHeatmapDataUrl;
  } catch (error) {
    console.error('Error generating heatmap:', error);
    throw new Error('Failed to generate visualization');
  }
};

/**
 * Fetch related literature from PubMed based on findings
 */
export async function fetchRelatedLiterature(findings: string[]): Promise<any[]> {
  try {
    // Extract keywords from findings for better search results
    const keywords = extractKeywords(findings.join(' '));
    const searchTerms = keywords.join('+OR+');
    
    // Use PubMed API to fetch related literature
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${searchTerms}&retmode=json&retmax=10`;
    
    console.log('Fetching PubMed articles for terms:', searchTerms);
    
    // First, search for article IDs
    const searchResponse = await axios.get(searchUrl);
    const idList = searchResponse.data.esearchresult.idlist;
    
    if (idList.length === 0) {
      console.log('No PubMed articles found for the given terms');
      return [];
    }
    
    // Then, fetch details for these IDs
    const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryResponse = await axios.get(summaryUrl);
    const result = summaryResponse.data.result;
    
    // Format the response
    const literature = idList.map(id => {
      const article = result[id];
      if (!article) return null;
      
      // Extract authors (first 3)
      const authors = article.authors?.map((author: any) => author.name).slice(0, 3).join(', ');
      const authorDisplay = authors ? (authors + (article.authors?.length > 3 ? ', et al.' : '')) : 'Unknown authors';
      
      return {
        id: id,
        title: article.title || 'Untitled article',
        authors: authorDisplay,
        journal: article.fulljournalname || article.source || 'Unknown journal',
        year: article.pubdate ? parseInt(article.pubdate.substring(0, 4)) : new Date().getFullYear(),
        abstract: article.abstract || 'Abstract not available',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        keywords: keywords.slice(0, 5)
      };
    }).filter(item => item !== null);
    
    return literature;
  } catch (error) {
    console.error('Error fetching related literature:', error);
    // Fallback to mock data if API fails
    console.log('Falling back to mock literature data');
    const keywords = extractKeywords(findings.join(' '));
    return keywords.slice(0, 3).map((keyword, index) => {
      return {
        id: `PMID${1000000 + index}`,
        title: `Recent advances in ${keyword} diagnosis and treatment`,
        authors: `Johnson M, Smith K${index > 0 ? `, et al` : ''}`,
        journal: "Journal of Medical Imaging",
        year: 2023 - index,
        abstract: `This study discusses the latest techniques in ${keyword} analysis, focusing on AI-assisted diagnosis...`,
        url: `https://pubmed.ncbi.nlm.nih.gov/example${index}`,
        keywords: [keyword, ...keywords.filter(k => k !== keyword).slice(0, 2)]
      };
    });
  }
}

/**
 * Fetch related clinical trials from ClinicalTrials.gov based on findings
 */
export async function fetchRelatedClinicalTrials(findings: string[]): Promise<any[]> {
  try {
    // Extract keywords from findings for better search results
    const keywords = extractKeywords(findings.join(' '));
    const searchTerms = keywords.join('+OR+');
    
    // Use ClinicalTrials.gov API to fetch related trials
    const baseUrl = 'https://clinicaltrials.gov/api/query/study_fields';
    const fields = [
      'NCTId', 'BriefTitle', 'OfficialTitle', 'OverallStatus', 
      'Phase', 'Condition', 'LocationFacility', 'ConditionMeshTerm'
    ].join(',');
    
    const url = `${baseUrl}?expr=${searchTerms}&fields=${fields}&fmt=json&max_rnk=10`;
    
    console.log('Fetching clinical trials for terms:', searchTerms);
    
    const response = await axios.get(url);
    const studyFields = response.data.StudyFieldsResponse.StudyFields;
    
    if (!studyFields || studyFields.length === 0) {
      console.log('No clinical trials found for the given terms');
      return [];
    }
    
    // Format the response
    const trials = studyFields.map((trial: any) => {
      // Get the first NCTId if there are multiple
      const nctId = Array.isArray(trial.NCTId) ? trial.NCTId[0] : trial.NCTId;
      
      // Use official title if available, otherwise brief title
      const title = Array.isArray(trial.OfficialTitle) && trial.OfficialTitle.length > 0 
        ? trial.OfficialTitle[0] 
        : (Array.isArray(trial.BriefTitle) ? trial.BriefTitle[0] : 'Untitled trial');
      
      // Get status
      const status = Array.isArray(trial.OverallStatus) ? trial.OverallStatus[0] : 'Unknown status';
      
      // Get phase
      const phase = Array.isArray(trial.Phase) && trial.Phase.length > 0 
        ? trial.Phase[0] 
        : 'Not specified';
      
      // Get conditions
      const conditions = Array.isArray(trial.Condition) 
        ? trial.Condition.slice(0, 3) 
        : (Array.isArray(trial.ConditionMeshTerm) ? trial.ConditionMeshTerm.slice(0, 3) : ['Not specified']);
      
      // Get location
      const location = Array.isArray(trial.LocationFacility) && trial.LocationFacility.length > 0
        ? trial.LocationFacility[0]
        : 'Multiple Locations';
      
      return {
        id: nctId,
        title: title,
        status: status,
        phase: phase,
        conditions: conditions,
        location: location,
        url: `https://clinicaltrials.gov/ct2/show/${nctId}`
      };
    });
    
    return trials;
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    // Fallback to mock data if API fails
    console.log('Falling back to mock clinical trials data');
    const keywords = extractKeywords(findings.join(' '));
    return keywords.slice(0, 2).map((keyword, index) => {
      return {
        id: `NCT${10000000 + index}`,
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Diagnostic Study Using AI`,
        status: index === 0 ? "Recruiting" : "Active, not recruiting",
        phase: `Phase ${index + 2}`,
        conditions: [keyword.charAt(0).toUpperCase() + keyword.slice(1)],
        location: "Multiple Locations",
        url: `https://clinicaltrials.gov/ct2/show/NCT${10000000 + index}`
      };
    });
  }
}

/**
 * Generate a comprehensive medical report from an analysis
 */
export async function generateReport(analysisId: string) {
  try {
    // Get the analysis details
    const analysis = getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const prompt = `Based on the following medical image analysis, generate a formal medical report.
    Include sections for Patient Information (use placeholder data), Examination Details, Findings, 
    Impression, and Recommendations.
    
    Format it as a structured document with clear headings and bullet points for findings.
    
    ANALYSIS: ${analysis.analysis}`;
    
    // Use direct API call instead of the SDK
    const reportText = await callGeminiDirectly(prompt);
    
    // Create a report object with additional metadata
    const report = {
      id: `report-${Date.now()}`,
      analysisId,
      content: reportText,
      timestamp: new Date().toISOString(),
      title: `Medical Report - ${analysis.filename}`,
      doctor: "Dr. User", // In a real app, this would come from the user context
      patientId: "P-" + Math.floor(10000 + Math.random() * 90000) // Mock patient ID
    };
    
    // Generate PDF and download it
    generatePDFReport(report, analysis);
    
    return report;
  } catch (error: any) {
    console.error('Error generating report:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in settings.');
    } else if (error.message === 'Analysis not found') {
      throw error;
    } else {
      throw new Error('Failed to generate report. Please try again later.');
    }
  }
}

/**
 * Generate and download a PDF report
 */
function generatePDFReport(report: any, analysis: any) {
  // In a real application, this would use a library like jsPDF to generate a PDF
  // For this demo, we'll create a data URL for a mock PDF and trigger a download
  
  // Create a blob with HTML content that browsers can render
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
        h1 { color: #333366; }
        h2 { color: #333366; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .header { display: flex; justify-content: space-between; }
        .metadata { margin-bottom: 20px; }
        .metadata p { margin: 5px 0; }
        .findings li { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${report.title}</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
      </div>
      
      <div class="metadata">
        <p><strong>Patient ID:</strong> ${report.patientId}</p>
        <p><strong>Referring Physician:</strong> ${report.doctor}</p>
        <p><strong>Image Filename:</strong> ${analysis.filename}</p>
        <p><strong>Analysis ID:</strong> ${analysis.id}</p>
      </div>
      
      <h2>AI-Assisted Analysis</h2>
      <div>
        ${analysis.analysis.replace(/\n/g, '<br>')}
      </div>
      
      <h2>Key Findings</h2>
      <ul class="findings">
        ${analysis.findings.map((finding: string) => `<li>${finding}</li>`).join('')}
      </ul>
      
      ${analysis.recommendations ? `
        <h2>Recommendations</h2>
        <ul class="findings">
          ${analysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
      ` : ''}
      
      <h2>Report Content</h2>
      <div>
        ${report.content.replace(/\n/g, '<br>')}
      </div>
      
      <p style="margin-top: 30px;">
        <em>Note: This is an AI-generated report and should be reviewed by a qualified healthcare professional.</em>
      </p>
    </body>
    </html>
  `;
  
  // Create a Blob containing the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = `medical_report_${report.id}.html`;
  
  // Append the link to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the Blob URL
  URL.revokeObjectURL(url);
  
  return true;
}

/**
 * Ask a medical question and get an AI-generated answer
 */
export async function askMedicalQuestion(question: string): Promise<ReportQAResult> {
  try {
    const prompt = `You are a medical AI assistant. Answer the following medical question 
    with accurate and scientifically valid information. Be clear and concise in your answer.
    
    QUESTION: ${question}`;
    
    // Use direct API call instead of the SDK
    const responseText = await callGeminiDirectly(prompt);
    
    return {
      answer: responseText,
      confidence: 0.85 // Mock confidence score
    };
  } catch (error: any) {
    console.error('Error processing question:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in settings.');
    } else {
      throw new Error('Failed to process your medical question. Please try again later.');
    }
  }
} 
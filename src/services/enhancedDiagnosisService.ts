import { StructuredDiagnosisResponse, MedicalDataSource, DiagnosisEvidence, DifferentialDiagnosis } from '@/types/diagnosis';
import { askMedicalQuestion, callGeminiDirectly, fileToBase64 } from './doctorAiService';

export class EnhancedDiagnosisService {
  /**
   * Generate a structured diagnosis response using selected data sources
   */
  async generateStructuredDiagnosis(
    imageFile: File,
    selectedDataSources: MedicalDataSource[],
    patientInfo?: any,
    additionalContext?: string
  ): Promise<StructuredDiagnosisResponse> {
    try {
      console.log('🔍 Starting enhanced diagnosis analysis...');
      console.log('📁 Image file:', imageFile.name, imageFile.type, imageFile.size);
      console.log('📊 Selected data sources:', selectedDataSources.map(ds => ds.name));
      console.log('👤 Patient info:', patientInfo);
      console.log('📝 Additional context:', additionalContext);

      if (!imageFile) {
        throw new Error('No image file provided for analysis');
      }

      // Validate image file
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image file.');
      }

      // Convert file to base64 for AI analysis
      console.log('🔄 Converting image to base64...');
      const fileBase64 = await fileToBase64(imageFile);
      console.log('✅ Image conversion complete');

      // Create enhanced prompt for structured response
      const structuredPrompt = this.createStructuredPrompt(selectedDataSources, patientInfo, additionalContext);
      console.log('📋 Created structured prompt');

      // Get AI response with image analysis
      console.log('🤖 Sending request to AI service...');
      const responseText = await callGeminiDirectly(structuredPrompt, {
        mimeType: imageFile.type,
        data: fileBase64
      });
      console.log('✅ Received AI response');

      // Parse and structure the response
      console.log('🔧 Parsing structured response...');
      const structuredResponse = this.parseStructuredResponse(responseText, selectedDataSources);
      console.log('✅ Enhanced diagnosis analysis complete');

      return structuredResponse;
    } catch (error: any) {
      console.error('❌ Error generating structured diagnosis:', error);

      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key in settings.');
      } else if (error.message?.includes('file type')) {
        throw error;
      } else if (error.message?.includes('network') || error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again with a smaller image or check your connection.');
      } else {
        throw new Error(`Enhanced diagnosis failed: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  /**
   * Create a structured prompt for comprehensive medical analysis
   */
  private createStructuredPrompt(
    dataSources: MedicalDataSource[],
    patientInfo?: any,
    additionalContext?: string
  ): string {
    const enabledSources = dataSources.filter(source => source.enabled);
    const sourceNames = enabledSources.map(source => source.name).join(', ');
    
    return `
Please provide a comprehensive medical analysis in the following structured format, referencing information from these medical databases: ${sourceNames}.

REQUIRED STRUCTURE:

1. EXECUTIVE SUMMARY
   - Brief overview of findings and primary concerns
   - Key diagnostic considerations

2. DIFFERENTIAL DIAGNOSIS (ranked by probability)
   For each diagnosis, provide:
   - Condition name
   - Probability percentage (0-100%)
   - Confidence level (0-100%)
   - Supporting reasoning
   - Key evidence from selected databases

3. SUPPORTING EVIDENCE
   Organize by data source:
   ${enabledSources.map(source => `- ${source.name}: Relevant findings and citations`).join('\n   ')}

4. RECOMMENDED TESTS/INVESTIGATIONS
   For each test:
   - Test name
   - Priority level (urgent/high/medium/low)
   - Reasoning
   - Expected findings

5. TREATMENT RECOMMENDATIONS
   For each recommendation:
   - Treatment type (medication/procedure/lifestyle/monitoring)
   - Priority (immediate/urgent/routine)
   - Specific details (dosage, duration, etc.)
   - Contraindications and side effects

6. REFERENCES/CITATIONS
   - Specific citations from the selected databases
   - Publication dates and authors where applicable

7. CONFIDENCE ASSESSMENT
   - Overall confidence score (0-100%)
   - Limitations of the analysis
   - Areas requiring further investigation

8. FOLLOW-UP RECOMMENDATIONS
   - Timeline for reassessment
   - Warning signs to monitor
   - When to seek immediate care

${patientInfo ? `Patient Context: ${JSON.stringify(patientInfo)}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Please ensure all recommendations are evidence-based and include appropriate medical disclaimers.
    `;
  }

  /**
   * Parse AI response into structured format
   */
  private parseStructuredResponse(
    aiResponse: string,
    dataSources: MedicalDataSource[]
  ): StructuredDiagnosisResponse {
    const timestamp = new Date().toISOString();
    const id = `diagnosis_${Date.now()}`;

    // Parse different sections from the AI response
    const sections = this.extractSections(aiResponse);
    
    return {
      id,
      timestamp,
      executiveSummary: sections.executiveSummary || 'Analysis completed with AI assistance.',
      differentialDiagnoses: this.parseDifferentialDiagnoses(sections.differentialDiagnosis || ''),
      supportingEvidence: this.parseSupportingEvidence(sections.supportingEvidence || '', dataSources),
      recommendedTests: this.parseRecommendedTests(sections.recommendedTests || ''),
      treatmentRecommendations: this.parseTreatmentRecommendations(sections.treatmentRecommendations || ''),
      references: this.parseReferences(sections.references || ''),
      dataSourcesUsed: dataSources.filter(ds => ds.enabled).map(ds => ds.name),
      confidenceScore: this.extractConfidenceScore(sections.confidenceAssessment || ''),
      limitations: this.parseLimitations(sections.confidenceAssessment || ''),
      followUpRecommendations: this.parseFollowUpRecommendations(sections.followUpRecommendations || ''),
      emergencyFlags: this.extractEmergencyFlags(aiResponse)
    };
  }

  /**
   * Extract sections from AI response
   */
  private extractSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    const sectionPatterns = {
      executiveSummary: /(?:EXECUTIVE SUMMARY|1\.\s*EXECUTIVE SUMMARY)(.*?)(?=(?:DIFFERENTIAL DIAGNOSIS|2\.|$))/is,
      differentialDiagnosis: /(?:DIFFERENTIAL DIAGNOSIS|2\.\s*DIFFERENTIAL DIAGNOSIS)(.*?)(?=(?:SUPPORTING EVIDENCE|3\.|$))/is,
      supportingEvidence: /(?:SUPPORTING EVIDENCE|3\.\s*SUPPORTING EVIDENCE)(.*?)(?=(?:RECOMMENDED TESTS|4\.|$))/is,
      recommendedTests: /(?:RECOMMENDED TESTS|4\.\s*RECOMMENDED TESTS)(.*?)(?=(?:TREATMENT RECOMMENDATIONS|5\.|$))/is,
      treatmentRecommendations: /(?:TREATMENT RECOMMENDATIONS|5\.\s*TREATMENT RECOMMENDATIONS)(.*?)(?=(?:REFERENCES|6\.|$))/is,
      references: /(?:REFERENCES|6\.\s*REFERENCES)(.*?)(?=(?:CONFIDENCE ASSESSMENT|7\.|$))/is,
      confidenceAssessment: /(?:CONFIDENCE ASSESSMENT|7\.\s*CONFIDENCE ASSESSMENT)(.*?)(?=(?:FOLLOW-UP|8\.|$))/is,
      followUpRecommendations: /(?:FOLLOW-UP|8\.\s*FOLLOW-UP)(.*?)$/is
    };

    Object.entries(sectionPatterns).forEach(([key, pattern]) => {
      const match = response.match(pattern);
      if (match) {
        sections[key] = match[1].trim();
      }
    });

    return sections;
  }

  /**
   * Parse differential diagnoses from text
   */
  private parseDifferentialDiagnoses(text: string): DifferentialDiagnosis[] {
    const diagnoses: DifferentialDiagnosis[] = [];
    
    // Simple parsing - in a real implementation, this would be more sophisticated
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const probabilityMatch = line.match(/(\d+)%/);
      const probability = probabilityMatch ? parseInt(probabilityMatch[1]) : 50;
      
      diagnoses.push({
        condition: line.replace(/^\d+\.?\s*/, '').replace(/\s*\(\d+%.*?\)/, '').trim(),
        probability,
        confidence: Math.min(probability + 10, 95),
        reasoning: line,
        supportingEvidence: []
      });
    });

    return diagnoses.slice(0, 5); // Limit to top 5 diagnoses
  }

  /**
   * Parse supporting evidence from text
   */
  private parseSupportingEvidence(text: string, dataSources: MedicalDataSource[]): DiagnosisEvidence[] {
    const evidence: DiagnosisEvidence[] = [];
    
    dataSources.filter(ds => ds.enabled).forEach(source => {
      evidence.push({
        source: source.name,
        sourceType: source.category,
        title: `Evidence from ${source.name}`,
        content: text.substring(0, 200) + '...',
        confidence: 80,
        relevance: 85,
        citation: `${source.name} Database - ${new Date().getFullYear()}`
      });
    });

    return evidence;
  }

  /**
   * Parse recommended tests from text
   */
  private parseRecommendedTests(text: string) {
    const tests = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('-') || line.match(/^\d+\./)) {
        tests.push({
          testName: line.replace(/^\d+\.?\s*-?\s*/, '').trim(),
          priority: 'medium' as const,
          reasoning: 'Based on clinical presentation and differential diagnosis',
          invasiveness: 'non-invasive' as const
        });
      }
    });

    return tests.slice(0, 8);
  }

  /**
   * Parse treatment recommendations from text
   */
  private parseTreatmentRecommendations(text: string) {
    const treatments = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('-') || line.match(/^\d+\./)) {
        treatments.push({
          treatment: line.replace(/^\d+\.?\s*-?\s*/, '').trim(),
          type: 'medication' as const,
          priority: 'routine' as const
        });
      }
    });

    return treatments.slice(0, 6);
  }

  /**
   * Parse references from text
   */
  private parseReferences(text: string): DiagnosisEvidence[] {
    const references: DiagnosisEvidence[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        references.push({
          source: 'Medical Literature',
          sourceType: 'research',
          title: `Reference ${index + 1}`,
          content: line.trim(),
          confidence: 90,
          relevance: 85,
          citation: line.trim()
        });
      }
    });

    return references.slice(0, 10);
  }

  /**
   * Extract confidence score from text
   */
  private extractConfidenceScore(text: string): number {
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 75;
  }

  /**
   * Parse limitations from text
   */
  private parseLimitations(text: string): string[] {
    const limitations = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('limitation') || line.includes('-')) {
        limitations.push(line.replace(/^\d+\.?\s*-?\s*/, '').trim());
      }
    });

    return limitations.slice(0, 5);
  }

  /**
   * Parse follow-up recommendations from text
   */
  private parseFollowUpRecommendations(text: string): string[] {
    const recommendations = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('-') || line.match(/^\d+\./)) {
        recommendations.push(line.replace(/^\d+\.?\s*-?\s*/, '').trim());
      }
    });

    return recommendations.slice(0, 6);
  }

  /**
   * Extract emergency flags from response
   */
  private extractEmergencyFlags(text: string): string[] {
    const emergencyKeywords = ['urgent', 'emergency', 'immediate', 'critical', 'acute'];
    const flags = [];
    
    emergencyKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        flags.push(`Potential ${keyword} condition identified`);
      }
    });

    return flags;
  }
}

export const enhancedDiagnosisService = new EnhancedDiagnosisService();

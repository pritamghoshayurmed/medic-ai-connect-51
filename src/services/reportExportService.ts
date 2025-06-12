import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { StructuredDiagnosisResponse, DiagnosisReportMetadata, ExportOptions } from '@/types/diagnosis';

export class ReportExportService {
  /**
   * Export diagnosis report in specified format
   */
  async exportReport(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: ExportOptions
  ): Promise<void> {
    try {
      switch (options.format) {
        case 'pdf':
          await this.exportToPDF(diagnosis, metadata, options);
          break;
        case 'docx':
          await this.exportToDocx(diagnosis, metadata, options);
          break;
        case 'txt':
          await this.exportToText(diagnosis, metadata, options);
          break;
        case 'json':
          await this.exportToJSON(diagnosis, metadata, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: ExportOptions
  ): Promise<void> {
    try {
      console.log('📄 Starting PDF export...');

      const pdf = new jsPDF();
      let yPosition = 20;
      const lineHeight = 7;
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to clean markdown formatting for PDF
      const cleanMarkdown = (text: string): string => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
          .replace(/#{1,6}\s/g, '') // Remove header markers
          .replace(/^[-*+]\s/gm, '• ') // Convert bullet points
          .replace(/^\d+\.\s/gm, '') // Remove numbered list markers
          .replace(/`(.*?)`/g, '$1') // Remove code markers
          .trim();
      };

      // Helper function to add text with page break handling
      const addText = (text: string, fontSize = 12, isBold = false, isHeader = false) => {
        if (!text) return;

        const cleanedText = cleanMarkdown(text);

        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }

        if (isHeader) {
          yPosition += 5; // Extra space before headers
        }

        const lines = pdf.splitTextToSize(cleanedText, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight;

        if (isHeader) {
          yPosition += 3; // Extra space after headers
        }
      };

      // Header
      addText('MEDICAL DIAGNOSIS REPORT', 18, true, true);
      addText(`Generated: ${new Date(diagnosis.timestamp).toLocaleString()}`, 10);
      addText(`Report ID: ${diagnosis.id}`, 10);
      yPosition += 10;

      // Doctor Information
      if (options.includeMetadata && metadata.doctorInfo) {
        addText('DOCTOR INFORMATION', 14, true, true);
        addText(`Name: ${metadata.doctorInfo.name}`);
        addText(`License: ${metadata.doctorInfo.license}`);
        addText(`Specialty: ${metadata.doctorInfo.specialty}`);
        addText(`Institution: ${metadata.doctorInfo.institution}`);
        yPosition += 5;
      }

      // Patient Information
      if (metadata.patientInfo && options.includeMetadata) {
        addText('PATIENT INFORMATION', 14, true, true);
        if (metadata.patientInfo.name) addText(`Name: ${metadata.patientInfo.name}`);
        if (metadata.patientInfo.age) addText(`Age: ${metadata.patientInfo.age}`);
        if (metadata.patientInfo.gender) addText(`Gender: ${metadata.patientInfo.gender}`);
        yPosition += 5;
      }

      // Confidence Score
      addText('ANALYSIS CONFIDENCE', 14, true, true);
      addText(`Overall Confidence Score: ${diagnosis.confidenceScore}%`);
      yPosition += 5;

      // Executive Summary
      addText('EXECUTIVE SUMMARY', 14, true, true);
      addText(diagnosis.executiveSummary);
      yPosition += 5;

      // Differential Diagnoses
      addText('DIFFERENTIAL DIAGNOSIS', 14, true, true);
      diagnosis.differentialDiagnoses.forEach((dx, index) => {
        addText(`${index + 1}. ${dx.condition}`, 12, true);
        addText(`   Probability: ${dx.probability}% | Confidence: ${dx.confidence}%`);
        addText(`   Reasoning: ${dx.reasoning}`);
        if (dx.riskFactors && dx.riskFactors.length > 0) {
          addText(`   Risk Factors: ${dx.riskFactors.join(', ')}`);
        }
        yPosition += 3;
      });

      // Recommended Tests
      if (diagnosis.recommendedTests.length > 0) {
        addText('RECOMMENDED TESTS', 14, true, true);
        diagnosis.recommendedTests.forEach((test, index) => {
          addText(`${index + 1}. ${test.testName}`, 12, true);
          addText(`   Priority: ${test.priority} | Invasiveness: ${test.invasiveness}`);
          addText(`   Reasoning: ${test.reasoning}`);
          if (test.expectedFindings) addText(`   Expected Findings: ${test.expectedFindings}`);
          yPosition += 2;
        });
      }

      // Treatment Recommendations
      if (diagnosis.treatmentRecommendations.length > 0) {
        addText('TREATMENT RECOMMENDATIONS', 14, true, true);
        diagnosis.treatmentRecommendations.forEach((treatment, index) => {
          addText(`${index + 1}. ${treatment.treatment}`, 12, true);
          addText(`   Type: ${treatment.type} | Priority: ${treatment.priority}`);
          if (treatment.dosage) addText(`   Dosage: ${treatment.dosage}`);
          if (treatment.duration) addText(`   Duration: ${treatment.duration}`);
          if (treatment.contraindications && treatment.contraindications.length > 0) {
            addText(`   Contraindications: ${treatment.contraindications.join(', ')}`);
          }
          yPosition += 2;
        });
      }

      // Follow-up Recommendations
      if (diagnosis.followUpRecommendations.length > 0) {
        addText('FOLLOW-UP RECOMMENDATIONS', 14, true, true);
        diagnosis.followUpRecommendations.forEach((recommendation, index) => {
          addText(`${index + 1}. ${recommendation}`);
        });
        yPosition += 5;
      }

      // Data Sources
      addText('DATA SOURCES USED', 14, true, true);
      addText(diagnosis.dataSourcesUsed.join(', '));
      yPosition += 5;

      // References
      if (options.includeReferences && diagnosis.references.length > 0) {
        addText('REFERENCES', 14, true, true);
        diagnosis.references.forEach((ref, index) => {
          addText(`${index + 1}. ${ref.citation}`);
        });
        yPosition += 5;
      }

      // Limitations
      if (diagnosis.limitations.length > 0) {
        addText('ANALYSIS LIMITATIONS', 14, true, true);
        diagnosis.limitations.forEach((limitation, index) => {
          addText(`${index + 1}. ${limitation}`);
        });
        yPosition += 5;
      }

      // Disclaimer
      addText('DISCLAIMER', 14, true, true);
      addText(metadata.disclaimer, 10);

      // Save the PDF
      const fileName = `diagnosis_report_${new Date().toISOString().split('T')[0]}_${diagnosis.id.slice(-8)}.pdf`;
      console.log('💾 Saving PDF:', fileName);
      pdf.save(fileName);
      console.log('✅ PDF export completed successfully');

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export to DOCX format
   */
  private async exportToDocx(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: ExportOptions
  ): Promise<void> {
    try {
      console.log('📄 Starting DOCX export...');

      // Helper function to clean markdown formatting
      const cleanMarkdown = (text: string): string => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/^[-*+]\s/gm, '• ')
          .replace(/^\d+\.\s/gm, '')
          .replace(/`(.*?)`/g, '$1')
          .trim();
      };

      const children = [];

      // Title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "MEDICAL DIAGNOSIS REPORT", bold: true, size: 32 })],
          heading: HeadingLevel.TITLE
        })
      );

      // Generated date and ID
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date(diagnosis.timestamp).toLocaleString()}`, size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: `Report ID: ${diagnosis.id}`, size: 20 })]
        })
      );

      // Doctor Information
      if (options.includeMetadata && metadata.doctorInfo) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "DOCTOR INFORMATION", bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            children: [new TextRun({ text: `Name: ${metadata.doctorInfo.name}`, size: 20 })]
          }),
          new Paragraph({
            children: [new TextRun({ text: `License: ${metadata.doctorInfo.license}`, size: 20 })]
          }),
          new Paragraph({
            children: [new TextRun({ text: `Specialty: ${metadata.doctorInfo.specialty}`, size: 20 })]
          })
        );
      }

      // Confidence Score
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "ANALYSIS CONFIDENCE", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: `Overall Confidence Score: ${diagnosis.confidenceScore}%`, size: 20 })]
        })
      );

      // Executive Summary
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "EXECUTIVE SUMMARY", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: cleanMarkdown(diagnosis.executiveSummary), size: 20 })]
        })
      );

      // Differential Diagnoses
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "DIFFERENTIAL DIAGNOSIS", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1
        })
      );

      diagnosis.differentialDiagnoses.forEach((dx, index) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${index + 1}. ${dx.condition}`, bold: true, size: 20 })]
          }),
          new Paragraph({
            children: [new TextRun({ text: `Probability: ${dx.probability}% | Confidence: ${dx.confidence}%`, size: 18 })]
          }),
          new Paragraph({
            children: [new TextRun({ text: `Reasoning: ${cleanMarkdown(dx.reasoning)}`, size: 18 })]
          })
        );

        if (dx.riskFactors && dx.riskFactors.length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Risk Factors: ${dx.riskFactors.join(', ')}`, size: 18 })]
            })
          );
        }
      });

      // Recommended Tests
      if (diagnosis.recommendedTests.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "RECOMMENDED TESTS", bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_1
          })
        );

        diagnosis.recommendedTests.forEach((test, index) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${index + 1}. ${test.testName}`, bold: true, size: 20 })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Priority: ${test.priority} | Invasiveness: ${test.invasiveness}`, size: 18 })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Reasoning: ${cleanMarkdown(test.reasoning)}`, size: 18 })]
            })
          );
        });
      }

      // Treatment Recommendations
      if (diagnosis.treatmentRecommendations.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "TREATMENT RECOMMENDATIONS", bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_1
          })
        );

        diagnosis.treatmentRecommendations.forEach((treatment, index) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${index + 1}. ${treatment.treatment}`, bold: true, size: 20 })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Type: ${treatment.type} | Priority: ${treatment.priority}`, size: 18 })]
            })
          );

          if (treatment.dosage) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `Dosage: ${treatment.dosage}`, size: 18 })]
              })
            );
          }
        });
      }

      // Data Sources
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "DATA SOURCES USED", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: diagnosis.dataSourcesUsed.join(', '), size: 20 })]
        })
      );

      // Disclaimer
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "DISCLAIMER", bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: metadata.disclaimer, size: 18 })]
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const fileName = `diagnosis_report_${new Date().toISOString().split('T')[0]}_${diagnosis.id.slice(-8)}.docx`;
      console.log('💾 Saving DOCX:', fileName);
      saveAs(new Blob([buffer]), fileName);
      console.log('✅ DOCX export completed successfully');

    } catch (error) {
      console.error('❌ DOCX export failed:', error);
      throw new Error(`DOCX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export to plain text format
   */
  private async exportToText(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: ExportOptions
  ): Promise<void> {
    let content = '';
    
    content += 'MEDICAL DIAGNOSIS REPORT\n';
    content += '========================\n\n';
    content += `Generated: ${new Date(diagnosis.timestamp).toLocaleString()}\n\n`;

    if (options.includeMetadata) {
      content += 'DOCTOR INFORMATION\n';
      content += '------------------\n';
      content += `Name: ${metadata.doctorInfo.name}\n`;
      content += `License: ${metadata.doctorInfo.license}\n`;
      content += `Specialty: ${metadata.doctorInfo.specialty}\n`;
      content += `Institution: ${metadata.doctorInfo.institution}\n\n`;
    }

    content += 'EXECUTIVE SUMMARY\n';
    content += '-----------------\n';
    content += `${diagnosis.executiveSummary}\n\n`;

    content += 'DIFFERENTIAL DIAGNOSIS\n';
    content += '----------------------\n';
    diagnosis.differentialDiagnoses.forEach((dx, index) => {
      content += `${index + 1}. ${dx.condition} (${dx.probability}% probability)\n`;
      content += `   Reasoning: ${dx.reasoning}\n\n`;
    });

    if (diagnosis.recommendedTests.length > 0) {
      content += 'RECOMMENDED TESTS\n';
      content += '-----------------\n';
      diagnosis.recommendedTests.forEach((test, index) => {
        content += `${index + 1}. ${test.testName} (Priority: ${test.priority})\n`;
        content += `   Reasoning: ${test.reasoning}\n\n`;
      });
    }

    content += 'DISCLAIMER\n';
    content += '----------\n';
    content += `${metadata.disclaimer}\n`;

    const fileName = `diagnosis_report_${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: ExportOptions
  ): Promise<void> {
    const exportData = {
      diagnosis,
      metadata: options.includeMetadata ? metadata : undefined,
      exportOptions: options,
      exportedAt: new Date().toISOString()
    };

    const fileName = `diagnosis_report_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, fileName);
  }

  /**
   * Generate shareable link for the report
   */
  async generateShareableLink(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    options: any
  ): Promise<{ link: string; expiresAt: string; accessCode?: string }> {
    try {
      console.log('🔗 Generating shareable link...');

      // Create a unique report ID
      const reportId = `report_${diagnosis.id}_${Date.now()}`;
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Calculate expiration date (default 30 days)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // In a real implementation, this would:
      // 1. Upload the report data to a secure server
      // 2. Store access permissions and expiration
      // 3. Return a secure shareable link

      // For now, we'll create a mock shareable link
      const shareableData = {
        reportId,
        diagnosis,
        metadata,
        options,
        createdAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString(),
        accessLevel: options.accessLevel || 'view',
        requireLogin: options.requireLogin || true
      };

      // Store in localStorage for demo purposes (in production, use secure server)
      localStorage.setItem(`shared_report_${reportId}`, JSON.stringify(shareableData));

      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/shared-report/${reportId}`;

      console.log('✅ Shareable link generated:', shareLink);

      return {
        link: shareLink,
        expiresAt: expirationDate.toISOString(),
        accessCode: options.requireLogin ? accessCode : undefined
      };

    } catch (error) {
      console.error('❌ Share link generation failed:', error);
      throw new Error(`Share link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send report via email (mock implementation)
   */
  async sendReportByEmail(
    diagnosis: StructuredDiagnosisResponse,
    metadata: DiagnosisReportMetadata,
    recipients: string[],
    message?: string
  ): Promise<void> {
    try {
      console.log('📧 Sending report via email...');

      // In a real implementation, this would use an email service
      // For now, we'll just generate a mailto link

      const subject = `Medical Diagnosis Report - ${new Date().toLocaleDateString()}`;
      const body = `
${message || 'Please find the attached medical diagnosis report.'}

Report Summary:
- Generated: ${new Date(diagnosis.timestamp).toLocaleString()}
- Confidence Score: ${diagnosis.confidenceScore}%
- Primary Diagnosis: ${diagnosis.differentialDiagnoses[0]?.condition || 'N/A'}

This report was generated using AI assistance and should be reviewed by a qualified medical professional.

Best regards,
${metadata.doctorInfo.name}
${metadata.doctorInfo.institution}
      `.trim();

      const mailtoLink = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open default email client
      window.open(mailtoLink);

      console.log('✅ Email client opened with report details');

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const reportExportService = new ReportExportService();

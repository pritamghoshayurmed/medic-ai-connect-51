import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, MessageSquare, FileText, BookOpen, Microscope, FlaskConical, Link, Clock } from 'lucide-react';
import { generateReport, fetchRelatedLiterature, fetchRelatedClinicalTrials } from '@/services/doctorAiService';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeatmapVisualization from './HeatmapVisualization';
import MarkdownRenderer from './MarkdownRenderer';

interface Analysis {
  id: string;
  filename?: string;
  findings: string[];
  analysis: string;
  rawResponse?: string;
}

interface AnalysisResultsProps {
  analysis: Analysis;
  onStartChat?: () => void;
}

// Mock medical literature data (in a real app, this would come from an API)
const mockMedicalLiterature = [
  {
    id: 1,
    title: "Recent Advances in Medical Imaging Analysis",
    authors: "Johnson M, Smith K, et al.",
    journal: "Journal of Medical Imaging",
    year: 2023,
    abstract: "This review discusses the latest techniques in medical image analysis, focusing on AI-assisted diagnosis...",
    url: "https://example.com/journal1"
  },
  {
    id: 2,
    title: "Artificial Intelligence in Radiology: Current Applications",
    authors: "Zhang R, Williams P, et al.",
    journal: "Radiology Innovation",
    year: 2022,
    abstract: "An overview of current AI applications in radiology, including deep learning models for image classification and segmentation...",
    url: "https://example.com/journal2"
  },
  {
    id: 3,
    title: "Clinical Validation of AI-Based Medical Image Analysis",
    authors: "Roberts N, Chen J, et al.",
    journal: "Clinical AI Research",
    year: 2023,
    abstract: "This study evaluates the clinical validation process for AI systems used in medical image analysis...",
    url: "https://example.com/journal3"
  }
];

// Mock clinical trials data
const mockClinicalTrials = [
  {
    id: "NCT01234567",
    title: "AI-Assisted Diagnosis in Radiology",
    status: "Recruiting",
    phase: "Phase 2",
    conditions: ["Lung Cancer", "Pneumonia"],
    location: "Multiple Locations",
    url: "https://clinicaltrials.gov/ct2/show/NCT01234567"
  },
  {
    id: "NCT02345678",
    title: "Validation of Deep Learning in Medical Imaging",
    status: "Active, not recruiting",
    phase: "Phase 3",
    conditions: ["Multiple Conditions"],
    location: "University Medical Center",
    url: "https://clinicaltrials.gov/ct2/show/NCT02345678"
  }
];

export default function AnalysisResults({ analysis, onStartChat }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("findings");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [relatedLiterature, setRelatedLiterature] = useState<any[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<any[]>([]);
  const [isLoadingLiterature, setIsLoadingLiterature] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Extract image data URL if available in sessionStorage
  useEffect(() => {
    // Safely extract image from sessionStorage
    const getStoredImage = () => {
      try {
        const storedImage = sessionStorage.getItem(`scan_image_${analysis.id}`);
        if (storedImage) {
          setImageUrl(storedImage);
        } else {
          // Fallback to placeholder image
          setImageUrl("https://placehold.co/600x400/e2e8f0/475569?text=Medical+Scan+Image");
        }
      } catch (error) {
        console.error("Error retrieving image from sessionStorage:", error);
        setImageUrl("https://placehold.co/600x400/e2e8f0/475569?text=Medical+Scan+Image");
      }
    };
    
    // Fetch related literature and clinical trials
    const fetchRelatedResources = async () => {
      setIsLoadingLiterature(true);
      try {
        // First try to get literature
        let literature = [];
        try {
          literature = await fetchRelatedLiterature(analysis.findings);
          setRelatedLiterature(literature);
        } catch (litError) {
          console.error("Error fetching literature:", litError);
          setRelatedLiterature([]);
          toast.error("Could not fetch related literature");
        }
        
        // Then try to get clinical trials
        try {
          const trials = await fetchRelatedClinicalTrials(analysis.findings);
          setClinicalTrials(trials);
        } catch (trialError) {
          console.error("Error fetching clinical trials:", trialError);
          setClinicalTrials([]);
          toast.error("Could not fetch clinical trials");
        }
      } catch (error) {
        console.error("Error in fetchRelatedResources:", error);
      } finally {
        setIsLoadingLiterature(false);
      }
    };
    
    // Run both functions
    getStoredImage();
    fetchRelatedResources();
  }, [analysis.id, analysis.findings]);
  
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await generateReport(analysis.id);
      toast.success("Report generated and downloaded successfully");
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  // Function to format date for literature references
  const formatDate = (year: number, month?: number) => {
    if (month) {
      return `${year}-${month.toString().padStart(2, '0')}`;
    }
    return year.toString();
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Analysis Results</h2>
              <p className="text-gray-500 text-sm">
                {analysis.filename || "Medical scan analysis"}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Analysis Complete
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="literature">Literature</TabsTrigger>
              <TabsTrigger value="trials">Clinical Trials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="findings" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Key Findings
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {analysis.findings.map((finding, index) => (
                    <li key={index} className="text-gray-700">
                      <MarkdownRenderer
                        content={finding}
                        variant="compact"
                        className="inline"
                      />
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Detailed Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <MarkdownRenderer
                    content={analysis.analysis}
                    variant="medical"
                    className="text-gray-700"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="visualization">
              <HeatmapVisualization 
                analysisId={analysis.id}
                imageUrl={imageUrl}
                findings={analysis.findings}
              />
            </TabsContent>
            
            <TabsContent value="literature" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Relevant Medical Literature
                </h3>
                <Badge variant="outline" className="text-sm">
                  {isLoadingLiterature ? 'Loading...' : `${relatedLiterature.length} articles found`}
                </Badge>
              </div>
              
              {isLoadingLiterature ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 animate-pulse">
                    Searching medical databases...
                  </p>
                </div>
              ) : relatedLiterature.length > 0 ? (
                <div className="space-y-3">
                  {relatedLiterature.map((paper) => (
                    <Card key={paper.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium mb-1">{paper.title}</h4>
                            <p className="text-sm text-gray-500">{paper.authors}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                              <span className="mr-3">{paper.journal}</span>
                              <span>{paper.year}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="ml-2 shrink-0" asChild>
                            <a href={paper.url} target="_blank" rel="noopener noreferrer">
                              <Link className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {paper.keywords.map((keyword: string, i: number) => (
                            <Badge variant="secondary" key={i} className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No relevant literature found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="trials" className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Related Clinical Trials
                </h3>
                <Badge variant="outline" className="text-sm">
                  {isLoadingLiterature ? 'Loading...' : `${clinicalTrials.length} trials found`}
                </Badge>
              </div>
              
              {isLoadingLiterature ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 animate-pulse">
                    Searching clinical trials database...
                  </p>
                </div>
              ) : clinicalTrials.length > 0 ? (
                <div className="space-y-3">
                  {clinicalTrials.map((trial) => (
                    <Card key={trial.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{trial.title}</h4>
                              <Badge 
                                variant={
                                  trial.status.includes('Recruiting') 
                                    ? 'success' 
                                    : trial.status.includes('Active') 
                                      ? 'outline' 
                                      : 'secondary'
                                }
                                className="text-xs"
                              >
                                {trial.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {trial.location}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="ml-2 shrink-0" asChild>
                            <a href={trial.url} target="_blank" rel="noopener noreferrer">
                              <Link className="h-4 w-4 mr-1" />
                              View Trial
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <FlaskConical className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No related clinical trials found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-muted/40 p-4 flex flex-wrap gap-2">
          <Button 
            variant="default" 
            onClick={handleGenerateReport} 
            disabled={isGeneratingReport}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
          
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Analysis
          </Button>
          
          {onStartChat && (
            <Button variant="outline" onClick={onStartChat}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Discuss with AI
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 
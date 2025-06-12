import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, FileText, FileImage, Brain, Stethoscope, Settings, Users, Database, Search, Download, Share2, Mail, Link, Eye, Calendar, User, Shield, Info, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResults from "@/components/AnalysisResults";
import MedicalQAChat from "@/components/MedicalQAChat";
import StructuredDiagnosisDisplay from "@/components/StructuredDiagnosisDisplay";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { analyzeImage, getAnalysisHistory, getGeminiApiKey } from "@/services/doctorAiService";
import { enhancedDiagnosisService } from "@/services/enhancedDiagnosisService";
import { reportExportService } from "@/services/reportExportService";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MEDICAL_DATA_SOURCES, DATA_SOURCE_CATEGORIES, RELIABILITY_LEVELS, ACCESS_LEVELS } from "@/config/medicalDataSources";
import { MedicalDataSource, StructuredDiagnosisResponse, DiagnosisReportMetadata, ExportOptions, ShareOptions } from "@/types/diagnosis";

const scanTypes = [
  {
    name: "X-Ray Analysis",
    description: "Analyze bone structure and tissues",
    icon: <FileImage className="h-8 w-8 text-primary" />,
  },
  {
    name: "CT Scan",
    description: "Detailed cross-sectional images",
    icon: <Brain className="h-8 w-8 text-primary" />,
  },
  {
    name: "MRI Scan",
    description: "Detailed soft tissue imaging",
    icon: <Brain className="h-8 w-8 text-primary" />,
  },
  {
    name: "Ultrasound",
    description: "Sound wave imaging",
    icon: <Stethoscope className="h-8 w-8 text-primary" />,
  },
];

// Enhanced medical data sources from configuration
const dataSourcesAvailable = MEDICAL_DATA_SOURCES;

export default function DiagnosisEngine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: uiToast } = useToast();

  // Basic state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Enhanced diagnosis state
  const [dataSources, setDataSources] = useState<MedicalDataSource[]>(dataSourcesAvailable);
  const [structuredDiagnosis, setStructuredDiagnosis] = useState<StructuredDiagnosisResponse | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    medicalHistory: ''
  });
  const [additionalContext, setAdditionalContext] = useState('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeImages: true,
    includeReferences: true,
    includeMetadata: true,
    template: 'standard'
  });
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    recipients: [],
    accessLevel: 'view',
    requireLogin: true
  });

  // Initialize API keys on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem("geminiApiKey");
    if (storedKey) {
      setGeminiApiKey(storedKey);
    }
    
    // Check if we have a valid API key from any source
    checkApiKeyAvailability();
  }, []);
  
  // Function to check if a valid API key is available
  const checkApiKeyAvailability = () => {
    const key = getGeminiApiKey();
    setHasApiKey(!!key && key !== 'your-gemini-api-key');
    
    if (!key || key === 'your-gemini-api-key') {
      toast.info("Please add your Gemini API key in settings to use the diagnosis engine");
    }
  };

  // Filter history based on search query
  const analysisHistory = getAnalysisHistory().filter(item => 
    searchQuery 
      ? item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.findings.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const handleFileSelect = (file: File) => {
    console.log('📁 File selected:', file.name, file.type, file.size);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image file is too large. Please upload an image smaller than 10MB.");
      return;
    }

    setSelectedFile(file);
    setAnalysisResults(null);
    setStructuredDiagnosis(null);

    // Show success message for valid file
    toast.success(`Image "${file.name}" uploaded successfully`);

    // Check if API key is available
    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) {
      toast.error("Please upload a scan image to analyze");
      return;
    }

    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error("Image file is too large. Please upload an image smaller than 10MB.");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Unsupported file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    console.log('🚀 Starting analysis process...');
    console.log('📁 File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      advancedMode
    });

    setIsAnalyzing(true);

    try {
      if (advancedMode) {
        console.log('🔬 Using enhanced diagnosis mode...');

        // Use enhanced diagnosis service for structured analysis
        const selectedDataSources = dataSources.filter(source => source.enabled);

        if (selectedDataSources.length === 0) {
          toast.error("Please select at least one data source for analysis");
          setIsAnalyzing(false);
          return;
        }

        console.log('📊 Selected data sources:', selectedDataSources.map(ds => ds.name));

        const patientData = {
          age: patientInfo.age ? parseInt(patientInfo.age) : undefined,
          gender: patientInfo.gender || undefined,
          medicalHistory: patientInfo.medicalHistory ? [patientInfo.medicalHistory] : undefined
        };

        console.log('👤 Patient data:', patientData);
        console.log('📝 Additional context:', additionalContext);

        // Add timeout wrapper
        const analysisPromise = enhancedDiagnosisService.generateStructuredDiagnosis(
          selectedFile,
          selectedDataSources,
          patientData,
          additionalContext
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout after 60 seconds')), 60000)
        );

        const structuredResult = await Promise.race([analysisPromise, timeoutPromise]) as StructuredDiagnosisResponse;

        console.log('✅ Enhanced analysis completed successfully');

        setStructuredDiagnosis(structuredResult);
        setAnalysisResults({
          findings: structuredResult.differentialDiagnoses.map(dx => dx.condition),
          analysis: structuredResult.executiveSummary,
          structured: true,
          structuredData: structuredResult
        });

        toast.success("Enhanced analysis complete with structured diagnosis");
      } else {
        console.log('🔍 Using standard analysis mode...');

        // Add timeout wrapper for standard analysis too
        const analysisPromise = analyzeImage(selectedFile);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000)
        );

        const results = await Promise.race([analysisPromise, timeoutPromise]);

        console.log('✅ Standard analysis completed successfully');

        setAnalysisResults(results);
        toast.success("Analysis complete");
      }
    } catch (error: any) {
      console.error("❌ Error analyzing image:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Error analyzing image. Please try again.";

      if (error.message?.includes('timeout')) {
        errorMessage = "Analysis timed out. Please try again with a smaller image or check your connection.";
      } else if (error.message?.includes('API key')) {
        errorMessage = "Invalid API key. Please check your Gemini API key in settings.";
        setApiKeyDialogOpen(true);
      } else if (error.message?.includes('network') || error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes('file type')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      console.log('🏁 Analysis process completed, resetting loading state');
      setIsAnalyzing(false);
    }
  };

  const saveApiKey = () => {
    if (!geminiApiKey) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    localStorage.setItem("geminiApiKey", geminiApiKey);
    setApiKeyDialogOpen(false);
    toast.success("API key saved");
    setHasApiKey(true);

    // If a file is selected, start analysis
    if (selectedFile) {
      startAnalysis();
    }
  };

  const handleStartChat = () => {
    // Check if API key is available before starting chat
    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
      return;
    }
    setShowChat(true);
  };

  const handleScanTypeSelect = (scanType: string) => {
    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    // This would trigger file selection based on scan type
    // For now, we'll just open the file selector
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      (fileInput as HTMLInputElement).click();
    }
  };

  const toggleDataSource = (sourceId: string) => {
    setDataSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? { ...source, enabled: !source.enabled }
          : source
      )
    );
  };

  // Export functionality
  const handleExportReport = async () => {
    if (!structuredDiagnosis || !user) {
      toast.error("No diagnosis available to export");
      return;
    }

    setIsGeneratingReport(true);

    try {
      const metadata: DiagnosisReportMetadata = {
        doctorInfo: {
          name: user.name || user.full_name || 'Dr. Unknown',
          license: 'Medical License #12345',
          specialty: 'General Medicine',
          institution: 'Medical Center'
        },
        patientInfo: patientInfo.age || patientInfo.gender ? {
          age: patientInfo.age ? parseInt(patientInfo.age) : undefined,
          gender: patientInfo.gender || undefined
        } : undefined,
        reportType: 'ai-assisted-diagnosis',
        generatedAt: new Date().toISOString(),
        dataSourcesUsed: dataSources.filter(ds => ds.enabled).map(ds => ds.name),
        disclaimer: 'This report was generated with AI assistance and should be reviewed by a qualified medical professional. It is not a substitute for professional medical advice, diagnosis, or treatment.'
      };

      await reportExportService.exportReport(structuredDiagnosis, metadata, exportOptions);
      toast.success(`Report exported as ${exportOptions.format.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Share functionality
  const handleShareReport = async () => {
    if (!structuredDiagnosis || !user) {
      toast.error("No diagnosis available to share");
      return;
    }

    try {
      const metadata: DiagnosisReportMetadata = {
        doctorInfo: {
          name: user.name || user.full_name || 'Dr. Unknown',
          license: 'Medical License #12345',
          specialty: 'General Medicine',
          institution: 'Medical Center'
        },
        reportType: 'ai-assisted-diagnosis',
        generatedAt: new Date().toISOString(),
        dataSourcesUsed: dataSources.filter(ds => ds.enabled).map(ds => ds.name),
        disclaimer: 'This report was generated with AI assistance and should be reviewed by a qualified medical professional.'
      };

      const shareResult = await reportExportService.generateShareableLink(
        structuredDiagnosis,
        metadata,
        shareOptions
      );

      // Copy to clipboard
      await navigator.clipboard.writeText(shareResult.link);
      toast.success(`Share link copied to clipboard! ${shareResult.accessCode ? `Access code: ${shareResult.accessCode}` : ''}`);
      setShowShareDialog(false);
    } catch (error: any) {
      console.error('Error sharing report:', error);
      toast.error('Failed to generate share link');
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #005A7A, #002838)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mr-2" onClick={() => navigate(-1)}>
            <ChevronLeft />
          </Button>
          <h1 className="text-xl font-bold">Diagnosis Engine</h1>
        </div>
        <div className="flex items-center">
          {advancedMode && (
            <Badge variant="outline" className="mr-2 bg-yellow-500/20 text-yellow-100 border-yellow-400/50">
              Advanced Mode
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mr-2">
                <Users className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h4 className="font-medium">Collaboration</h4>
                <p className="text-sm text-gray-500">Share and discuss cases with other doctors</p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    if (analysisResults) {
                      handleStartChat();
                    } else {
                      toast.error("Please analyze an image first");
                    }
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Start Collaboration
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20" 
            onClick={() => setApiKeyDialogOpen(true)}
          >
            <Settings />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-white/10 backdrop-blur-sm mx-4 mt-4 rounded-lg">
          <TabsTrigger value="analyze" className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">Analyze</TabsTrigger>
          <TabsTrigger value="history" className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">History</TabsTrigger>
        </TabsList>
        
        {/* Analyze Tab */}
        <TabsContent value="analyze" className="p-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <FileImage className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Medical Image Analysis</h2>
            <p className="text-white/80 mb-4">
              Our AI engine analyzes medical images and provides diagnostic insights
            </p>
            
            {!hasApiKey && (
              <div className="mb-4 p-3 bg-amber-500/20 backdrop-blur-sm text-amber-100 rounded-md border border-amber-400/30">
                <p className="font-medium">API Key Required</p>
                <p className="text-sm">Please add your Gemini API key in settings to use the diagnosis engine.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-amber-400/50 text-amber-100 hover:bg-amber-400/20"
                  onClick={() => setApiKeyDialogOpen(true)}
                >
                  Add API Key
                </Button>
              </div>
            )}
            
            <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="options" className="border-white/20">
                    <AccordionTrigger className="text-white hover:no-underline">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Analysis Options</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 py-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-white">Advanced Analysis Mode</label>
                            <Button 
                              variant={advancedMode ? "default" : "outline"} 
                              size="sm"
                              className={advancedMode ? "" : "border-white/30 text-white hover:bg-white/20"}
                              onClick={() => setAdvancedMode(!advancedMode)}
                            >
                              {advancedMode ? "Enabled" : "Disabled"}
                            </Button>
                          </div>
                          <p className="text-xs text-white/70 mt-1">
                            Enable detailed analysis with heatmap visualization and literature search
                          </p>
                        </div>
                        
                        {advancedMode && (
                          <div className="space-y-4">
                            {/* Patient Information */}
                            <div>
                              <label className="text-sm font-medium block mb-2 text-white">Patient Information (Optional)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Age"
                                  value={patientInfo.age}
                                  onChange={(e) => setPatientInfo(prev => ({ ...prev, age: e.target.value }))}
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                                <Select value={patientInfo.gender} onValueChange={(value) => setPatientInfo(prev => ({ ...prev, gender: value }))}>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Textarea
                                placeholder="Medical history or additional context..."
                                value={patientInfo.medicalHistory}
                                onChange={(e) => setPatientInfo(prev => ({ ...prev, medicalHistory: e.target.value }))}
                                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                rows={2}
                              />
                            </div>

                            {/* Data Sources Selection */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-white">Medical Data Sources</label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowDataSourceSelector(true)}
                                  className="border-white/30 text-white hover:bg-white/20"
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configure
                                </Button>
                              </div>

                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {dataSources.filter(source => source.enabled).map(source => (
                                  <div key={source.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                                    <div className="flex items-center text-white">
                                      {source.icon}
                                      <span className="text-sm ml-2">{source.name}</span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Info className="h-3 w-3 ml-1 text-white/50" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs">{source.description}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                    <Badge variant="outline" className="text-xs border-white/30 text-white">
                                      {RELIABILITY_LEVELS[source.reliability].name}
                                    </Badge>
                                  </div>
                                ))}
                              </div>

                              {dataSources.filter(source => source.enabled).length === 0 && (
                                <Alert className="bg-amber-500/20 border-amber-400/30">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription className="text-amber-100">
                                    No data sources selected. Please configure data sources for enhanced analysis.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>

                            {/* Additional Context */}
                            <div>
                              <label className="text-sm font-medium block mb-2 text-white">Additional Context</label>
                              <Textarea
                                placeholder="Specific symptoms, concerns, or areas to focus on..."
                                value={additionalContext}
                                onChange={(e) => setAdditionalContext(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            
            <ImageUploader 
              key={`uploader-${Date.now()}`} 
              onUpload={handleFileSelect} 
              isLoading={isAnalyzing} 
            />
            
            {selectedFile && !analysisResults && (
              <div className="mt-4 space-y-3">
                {/* File Info Display */}
                <div className="p-3 bg-white/5 rounded-md border border-white/10">
                  <div className="flex items-center justify-between text-white text-sm">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-white/70">
                        {selectedFile.type} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                </div>

                {/* Analysis Mode Info */}
                {advancedMode && (
                  <div className="p-3 bg-blue-500/10 rounded-md border border-blue-400/30">
                    <div className="text-blue-100 text-sm">
                      <p className="font-medium mb-1">Enhanced Analysis Mode</p>
                      <p>Using {dataSources.filter(ds => ds.enabled).length} medical data sources</p>
                      {patientInfo.age && <p>Patient age: {patientInfo.age}</p>}
                      {patientInfo.gender && <p>Gender: {patientInfo.gender}</p>}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-white text-gray-900 hover:bg-white/90"
                  onClick={startAnalysis}
                  disabled={isAnalyzing || !hasApiKey}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {advancedMode ? "Performing Enhanced Analysis..." : "Analyzing..."}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Brain className="h-4 w-4 mr-2" />
                      {advancedMode ? "Start Enhanced Analysis" : "Start Analysis"}
                    </div>
                  )}
                </Button>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <div className="text-center text-white">
                    <p className="font-medium">
                      {advancedMode ? 'Performing Enhanced Analysis...' : 'Analyzing Medical Image...'}
                    </p>
                    <p className="text-sm text-white/70 mt-1">
                      {advancedMode
                        ? 'Processing with selected medical databases and generating structured diagnosis...'
                        : 'This may take a few moments...'
                      }
                    </p>
                  </div>
                </div>

                {advancedMode && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-white/80 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      Image uploaded and validated
                    </div>
                    <div className="flex items-center text-white/80 text-sm">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing with AI and medical databases
                    </div>
                    <div className="flex items-center text-white/60 text-sm">
                      <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/30" />
                      Generating structured diagnosis report
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {analysisResults && (
              <div className="mt-6">
                <ErrorBoundary>
                  {analysisResults.structured && structuredDiagnosis ? (
                    <StructuredDiagnosisDisplay
                      diagnosis={structuredDiagnosis}
                      onExport={() => setShowExportDialog(true)}
                      onShare={() => setShowShareDialog(true)}
                      onStartChat={handleStartChat}
                      className="bg-white/95 backdrop-blur-sm border-white/20"
                    />
                  ) : (
                    <AnalysisResults
                      analysis={{
                        id: Date.now().toString(),
                        ...analysisResults
                      }}
                      onStartChat={handleStartChat}
                    />
                  )}
                </ErrorBoundary>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-white">Select Scan Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {scanTypes.map((scan, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                  onClick={() => handleScanTypeSelect(scan.name)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="text-white">
                      {React.cloneElement(scan.icon, { className: "h-8 w-8 text-white" })}
                    </div>
                    <h4 className="font-medium mt-2 text-white">{scan.name}</h4>
                    <p className="text-xs text-white/70 mt-1">{scan.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="p-4">
          <div className="mt-4 mb-2 flex justify-between items-center">
            <h3 className="font-medium text-lg text-white">Previous Analyses</h3>
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-[200px] bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          
          <div className="space-y-4">
            {analysisHistory.length > 0 ? (
              analysisHistory.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{item.filename}</h4>
                        <p className="text-sm text-white/70">
                          {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/30 text-white hover:bg-white/20"
                        onClick={() => {
                          setAnalysisResults({
                            findings: item.findings,
                            analysis: item.analysis
                          });
                        }}
                      >
                        View
                      </Button>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium text-white">Key findings:</p>
                      <ul className="mt-1 text-sm text-white/80">
                        {item.findings.slice(0, 2).map((finding, idx) => (
                          <li key={idx} className="line-clamp-1">{finding}</li>
                        ))}
                        {item.findings.length > 2 && (
                          <li className="text-xs text-white/60">
                            +{item.findings.length - 2} more findings
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-white">
                <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No previous analyses found</p>
                {searchQuery && (
                  <p className="text-sm">Try a different search term</p>
                )}
                <Button
                  variant="outline"
                  className="mt-4 border-white/30 text-white hover:bg-white/20"
                  onClick={() => window.location.href = "#analyze"}
                >
                  Start a new analysis
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Settings Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doctor AI Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Gemini API key to use the Doctor AI features. You can get a key from the
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary mx-1">Google AI Studio</a>
              website.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apiKey" className="text-sm font-medium">Gemini API Key</label>
                <Input
                  id="apiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
              </div>
              <Button onClick={saveApiKey} className="w-full">Save API Key</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-full sm:w-[400px] md:w-[500px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Discuss with Colleagues</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-64px)]">
            <MedicalQAChat
              userName="Dr. User"
              analysisId={analysisResults?.id}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Diagnosis Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select value={exportOptions.format} onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                  <SelectItem value="txt">Plain Text</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Template</Label>
              <Select value={exportOptions.template} onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, template: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Report</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="summary">Executive Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={exportOptions.includeImages}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeImages: !!checked }))}
                />
                <Label>Include Images</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={exportOptions.includeReferences}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeReferences: !!checked }))}
                />
                <Label>Include References</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={exportOptions.includeMetadata}
                  onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                />
                <Label>Include Metadata</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Diagnosis Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Access Level</Label>
              <Select value={shareOptions.accessLevel} onValueChange={(value: any) => setShareOptions(prev => ({ ...prev, accessLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">View & Comment</SelectItem>
                  <SelectItem value="edit">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={shareOptions.requireLogin}
                onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, requireLogin: !!checked }))}
              />
              <Label>Require Login</Label>
            </div>

            <div>
              <Label>Recipients (Email addresses, comma-separated)</Label>
              <Textarea
                placeholder="doctor@example.com, colleague@hospital.com"
                value={shareOptions.recipients.join(', ')}
                onChange={(e) => setShareOptions(prev => ({
                  ...prev,
                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                }))}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareReport}>
              <Link className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
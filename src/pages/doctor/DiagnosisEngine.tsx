import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, FileText, FileImage, Brain, Stethoscope, Settings, Users, Database, Search } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResults from "@/components/AnalysisResults";
import MedicalQAChat from "@/components/MedicalQAChat";
import { analyzeImage, getAnalysisHistory, getGeminiApiKey } from "@/services/doctorAiService";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ErrorBoundary from "@/components/ErrorBoundary";

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

// Mock data for research database sources
const dataSourcesAvailable = [
  { id: 'pubmed', name: 'PubMed', icon: <Database className="h-4 w-4 mr-2" />, enabled: true },
  { id: 'clinicaltrials', name: 'ClinicalTrials.gov', icon: <FileText className="h-4 w-4 mr-2" />, enabled: true },
  { id: 'journals', name: 'Medical Journals Database', icon: <Search className="h-4 w-4 mr-2" />, enabled: false },
  { id: 'case_studies', name: 'Case Studies Database', icon: <FileText className="h-4 w-4 mr-2" />, enabled: false },
];

export default function DiagnosisEngine() {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [dataSources, setDataSources] = useState(dataSourcesAvailable);
  const [advancedMode, setAdvancedMode] = useState(false);

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
    setSelectedFile(file);
    setAnalysisResults(null);
    
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

    setIsAnalyzing(true);
    
    try {
      // Use Doctor AI service to analyze the image
      const results = await analyzeImage(selectedFile);
      setAnalysisResults(results);
      toast.success("Analysis complete");
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast.error(error.message || "Error analyzing image. Please try again.");
    } finally {
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
                          <div>
                            <label className="text-sm font-medium block mb-2 text-white">Select Data Sources</label>
                            <div className="space-y-2">
                              {dataSources.map(source => (
                                <div key={source.id} className="flex items-center justify-between">
                                  <div className="flex items-center text-white">
                                    {source.icon}
                                    <span className="text-sm">{source.name}</span>
                                  </div>
                                  <Button 
                                    variant={source.enabled ? "default" : "outline"} 
                                    size="sm"
                                    className={source.enabled ? "" : "border-white/30 text-white hover:bg-white/20"}
                                    onClick={() => toggleDataSource(source.id)}
                                  >
                                    {source.enabled ? "Enabled" : "Disabled"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-white/70 mt-2">
                              Select which medical databases to include in the analysis
                            </p>
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
              <Button 
                className="w-full mt-4 bg-white text-gray-900 hover:bg-white/90"
                onClick={startAnalysis}
                disabled={isAnalyzing || !hasApiKey}
              >
                {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              </Button>
            )}
            
            {isAnalyzing && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                <p className="animate-pulse text-center text-white">
                  Analyzing your medical image...
                </p>
              </div>
            )}
            
            {analysisResults && (
              <div className="mt-6">
                <ErrorBoundary>
                  <AnalysisResults 
                    analysis={{
                      id: Date.now().toString(),
                      ...analysisResults
                    }}
                    onStartChat={handleStartChat}
                  />
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
      
      <BottomNavigation />
    </div>
  );
}
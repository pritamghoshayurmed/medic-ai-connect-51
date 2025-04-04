
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Upload, Search, FileText, Image, FileImage } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const scanTypes = [
  {
    name: "X-Ray Analysis",
    description: "Analyze bone structure and tissues",
    icon: <FileImage className="h-8 w-8 text-primary" />,
  },
  {
    name: "CT Scan",
    description: "Detailed cross-sectional images",
    icon: <FileImage className="h-8 w-8 text-primary" />,
  },
  {
    name: "MRI Scan",
    description: "Detailed soft tissue imaging",
    icon: <FileImage className="h-8 w-8 text-primary" />,
  },
  {
    name: "Ultrasound",
    description: "Sound wave imaging",
    icon: <Image className="h-8 w-8 text-primary" />,
  },
];

const recentCases = [
  {
    id: "case1",
    patientName: "John Doe",
    scanType: "X-Ray",
    date: "2025-04-02",
    diagnosis: "Fractured wrist",
  },
  {
    id: "case2",
    patientName: "Jane Smith",
    scanType: "CT Scan",
    date: "2025-04-01",
    diagnosis: "Normal brain structure",
  },
  {
    id: "case3",
    patientName: "Robert Johnson",
    scanType: "MRI",
    date: "2025-03-28",
    diagnosis: "Herniated disc (L4-L5)",
  },
];

export default function DiagnosisEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setAnalysis(null);
    }
  };

  const handleScanTypeSelect = (scanType: string) => {
    // Trigger file input click
    document.getElementById("scan-upload")?.click();
  };

  const startAnalysis = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a scan image to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate analysis process
    setTimeout(() => {
      // Mock analysis results based on file name
      const fileName = selectedFile.name.toLowerCase();
      let result = "No abnormalities detected.";
      
      if (fileName.includes("xray") || fileName.includes("x-ray")) {
        result = "Analysis indicates a possible hairline fracture in the distal radius. Recommend additional views and potential orthopedic consultation.";
      } else if (fileName.includes("ct") || fileName.includes("brain")) {
        result = "Normal brain structure with no evidence of acute intracranial hemorrhage, mass effect, or midline shift. Ventricles are of normal size and configuration.";
      } else if (fileName.includes("mri") || fileName.includes("spine")) {
        result = "L4-L5 disc shows moderate posterior herniation with mild compression of the thecal sac. No significant spinal canal stenosis. Consider orthopedic consultation.";
      }
      
      setAnalysis(result);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "AI diagnosis has been generated.",
      });
    }, 3000);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Diagnosis Engine</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Analyze Tab */}
        <TabsContent value="analyze" className="p-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileImage className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Medical Image Analysis</h2>
            <p className="text-gray-600 mb-4">
              Our AI engine analyzes medical images and provides diagnostic insights
            </p>
            
            <input
              id="scan-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.dicom"
              className="hidden"
              onChange={handleFileUpload}
            />
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full py-6"
              onClick={() => document.getElementById("scan-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Scan
            </Button>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-left">
                <p className="font-medium">File: {selectedFile.name}</p>
                <p className="text-sm">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button 
                  className="w-full mt-2"
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Start Analysis"}
                </Button>
              </div>
            )}
            
            {analysis && (
              <div className="mt-4 bg-white border rounded-md p-4 text-left">
                <h3 className="font-bold mb-2">AI Diagnostic Report</h3>
                <Separator className="mb-2" />
                <p>{analysis}</p>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Save Report
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Select Scan Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {scanTypes.map((scan, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleScanTypeSelect(scan.name)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    {scan.icon}
                    <h4 className="font-medium mt-2">{scan.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{scan.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search cases..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <h3 className="font-semibold mb-3">Recent Cases</h3>
          <div className="space-y-3">
            {recentCases.map((caseItem) => (
              <Card key={caseItem.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{caseItem.patientName}</h4>
                      <p className="text-sm text-gray-500">
                        {caseItem.scanType} • {new Date(caseItem.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium mt-1">Diagnosis: {caseItem.diagnosis}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}

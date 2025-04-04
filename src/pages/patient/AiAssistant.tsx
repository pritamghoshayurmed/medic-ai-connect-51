
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Search, Upload, FileText } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const commonQuestions = [
  "What could cause persistent headaches?",
  "How to reduce fever naturally?",
  "Best practices for managing diabetes?",
  "When should I see a doctor for back pain?",
  "Is my cough a sign of something serious?",
  "How can I improve my sleep quality?",
];

const reportTypes = [
  {
    name: "X-Ray Analysis",
    description: "Upload X-ray images for AI analysis",
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
  {
    name: "Blood Test Results",
    description: "Analyze blood test reports",
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
  {
    name: "CT Scan Reports",
    description: "Get insights from CT scan images",
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
  {
    name: "MRI Reports",
    description: "Detailed analysis of MRI scans",
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
];

export default function AiAssistant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleStartChat = () => {
    // Navigate to AI chat
    navigate("/patient/chat/ai");
  };

  const handleQuestionClick = (question: string) => {
    // Navigate to AI chat with pre-filled question
    navigate("/patient/chat/ai", { state: { initialMessage: question } });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      
      toast({
        title: "File Uploaded",
        description: "Your report will be analyzed shortly.",
      });
    }
  };

  const handleReportTypeSelect = (reportType: string) => {
    // Trigger file input click
    document.getElementById("report-upload")?.click();
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">AI Health Assistant</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="chat">Chat with AI</TabsTrigger>
          <TabsTrigger value="reports">Analyze Reports</TabsTrigger>
        </TabsList>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="p-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C16.982 3 21 7.018 21 12C21 16.982 16.982 21 12 21C7.018 21 3 16.982 3 12C3 7.018 7.018 3 12 3ZM12 5C8.14 5 5 8.14 5 12C5 15.86 8.14 19 12 19C15.86 19 19 15.86 19 12C19 8.14 15.86 5 12 5ZM12 8.5C13.1046 8.5 14 9.39543 14 10.5C14 11.6046 13.1046 12.5 12 12.5C10.8954 12.5 10 11.6046 10 10.5C10 9.39543 10.8954 8.5 12 8.5ZM8.5 15C8.5 13.067 10.067 11.5 12 11.5C13.933 11.5 15.5 13.067 15.5 15H8.5Z" fill="#2563EB"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Health AI Assistant</h2>
            <p className="text-gray-600 mb-6">
              Get instant answers to your health queries from our AI assistant
            </p>
            <Button size="lg" className="w-full py-6" onClick={handleStartChat}>
              Start Chat
            </Button>
          </div>
          
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search health topics..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Common Questions</h3>
            <div className="space-y-3">
              {commonQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="p-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Upload Medical Reports</h2>
            <p className="text-gray-600 mb-4">
              Our AI will analyze your medical reports and provide insights
            </p>
            
            <input
              id="report-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileUpload}
            />
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full py-6"
              onClick={() => document.getElementById("report-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Report
            </Button>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
                <p className="font-medium">{selectedFile.name} uploaded</p>
                <p className="text-sm">Analysis in progress...</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Report Types</h3>
            <div className="grid grid-cols-2 gap-4">
              {reportTypes.map((report, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleReportTypeSelect(report.name)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    {report.icon}
                    <h4 className="font-medium mt-2">{report.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}

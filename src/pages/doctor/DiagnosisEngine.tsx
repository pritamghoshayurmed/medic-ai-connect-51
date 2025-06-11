import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Stethoscope, Loader2, FileText, SendHorizontal, Wand2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DiagnosisResult {
  possibleConditions: {
    name: string;
    probability: number;
    description: string;
    recommendations: string[];
  }[];
  differentialDiagnosis: string;
  recommendations: string;
  suggestedTests: string[];
}

export default function DiagnosisEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [symptoms, setSymptoms] = useState("");
  const [patientInfo, setPatientInfo] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter symptoms to analyze",
        variant: "destructive",
      });
      return;
    }

    setDiagnosing(true);

    try {
      // Simulate API call with a timeout
      setTimeout(() => {
        const mockResult = generateMockDiagnosisResult();
        setResult(mockResult);
        setDiagnosing(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate diagnosis",
        variant: "destructive",
      });
      setDiagnosing(false);
    }
  };

  const handleReset = () => {
    setSymptoms("");
    setPatientInfo("");
    setMedicalHistory("");
    setResult(null);
  };

  const generateMockDiagnosisResult = (): DiagnosisResult => {
    const symptomsLower = symptoms.toLowerCase();
    
    // Very simplified mock diagnosis logic based on keywords
    if (symptomsLower.includes("headache") || symptomsLower.includes("head pain")) {
      return {
        possibleConditions: [
          {
            name: "Tension Headache",
            probability: 0.75,
            description: "Tension headaches are the most common type of headache and are often caused by stress, anxiety, or muscle strain.",
            recommendations: ["Rest in a quiet, dark room", "Over-the-counter pain relievers", "Stress management", "Regular sleep schedule"]
          },
          {
            name: "Migraine",
            probability: 0.45,
            description: "Migraines are severe headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.",
            recommendations: ["Prescription migraine medications", "Identify and avoid triggers", "Rest in a dark, quiet room"]
          },
          {
            name: "Sinusitis",
            probability: 0.30,
            description: "Inflammation of the sinuses, often due to infection, causing pain around the eyes, cheeks and forehead.",
            recommendations: ["Antibiotics if bacterial", "Nasal decongestants", "Steam inhalation", "Saline nasal spray"]
          }
        ],
        differentialDiagnosis: "Based on the symptoms described, the most likely diagnosis is a tension headache. However, migraine and sinusitis should be considered in the differential diagnosis. The absence of visual disturbances or aura makes migraine less likely, while the lack of nasal congestion or discharge reduces the probability of sinusitis.",
        recommendations: "Recommend OTC pain relievers such as ibuprofen or acetaminophen. Advise patient to monitor stress levels and ensure adequate hydration and regular sleep. If symptoms persist beyond 72 hours or increase in severity, further evaluation is warranted.",
        suggestedTests: ["Complete Blood Count", "Sinus X-ray if symptoms persist"]
      };
    } else if (symptomsLower.includes("cough") || symptomsLower.includes("fever")) {
      return {
        possibleConditions: [
          {
            name: "Common Cold",
            probability: 0.65,
            description: "A viral infection of the upper respiratory tract, causing symptoms such as cough, sore throat, and nasal congestion.",
            recommendations: ["Rest", "Increased fluid intake", "Over-the-counter cold medications", "Humidifier use"]
          },
          {
            name: "Influenza",
            probability: 0.50,
            description: "A viral infection that affects the respiratory system, characterized by fever, body aches, and fatigue.",
            recommendations: ["Antiviral medications (if within 48 hours of onset)", "Rest", "Fluids", "Antipyretics for fever"]
          },
          {
            name: "Bronchitis",
            probability: 0.35,
            description: "Inflammation of the bronchial tubes, often resulting in cough with mucus production.",
            recommendations: ["Rest", "Increased fluid intake", "Humidifier", "Bronchodilators if prescribed"]
          }
        ],
        differentialDiagnosis: "The presentation suggests a viral upper respiratory infection, most likely a common cold. Influenza should be considered, particularly if symptoms include high fever, severe body aches, and profound fatigue. Acute bronchitis is a possibility if the cough is productive and persistent.",
        recommendations: "Recommend symptomatic treatment including rest, adequate hydration, and over-the-counter cough suppressants and antipyretics as needed. Consider antiviral therapy if influenza is suspected and symptoms began within 48 hours.",
        suggestedTests: ["Rapid Influenza Test", "Chest X-ray if respiratory symptoms worsen"]
      };
    } else if (symptomsLower.includes("stomach") || symptomsLower.includes("nausea") || symptomsLower.includes("vomiting") || symptomsLower.includes("diarrhea")) {
      return {
        possibleConditions: [
          {
            name: "Gastroenteritis",
            probability: 0.70,
            description: "Inflammation of the digestive tract, often due to viral or bacterial infection, causing vomiting and diarrhea.",
            recommendations: ["Oral rehydration", "BRAT diet (Bananas, Rice, Applesauce, Toast)", "Rest", "Gradual return to normal diet"]
          },
          {
            name: "Food Poisoning",
            probability: 0.55,
            description: "Illness caused by consuming contaminated food, resulting in symptoms similar to gastroenteritis.",
            recommendations: ["Hydration", "Rest", "Avoid solid foods temporarily", "Probiotics after acute phase resolves"]
          },
          {
            name: "Irritable Bowel Syndrome",
            probability: 0.25,
            description: "A chronic condition affecting the large intestine, causing abdominal pain, cramping, and changes in bowel habits.",
            recommendations: ["Dietary modifications", "Stress management", "Regular exercise", "Medication for specific symptoms"]
          }
        ],
        differentialDiagnosis: "The clinical picture is most consistent with acute gastroenteritis, likely viral in origin. Food poisoning should be considered, especially if symptoms began shortly after eating potentially contaminated food. Chronic conditions like IBS are less likely given the acute presentation but should be considered if symptoms persist or recur.",
        recommendations: "Focus on hydration with electrolyte solutions. Avoid dairy products and fatty foods temporarily. Gradually reintroduce bland foods as tolerated. Monitor for signs of dehydration such as decreased urination or dry mucous membranes.",
        suggestedTests: ["Stool Culture if symptoms persist > 3 days", "Complete Blood Count", "Basic Metabolic Panel to assess hydration status"]
      };
    } else {
      // Default generic response
      return {
        possibleConditions: [
          {
            name: "Non-specific Condition",
            probability: 0.50,
            description: "Based on the limited or general symptoms provided, a specific diagnosis cannot be determined with confidence.",
            recommendations: ["Monitoring symptoms", "Follow-up if symptoms persist or worsen", "Maintain general health practices"]
          }
        ],
        differentialDiagnosis: "The symptoms described are non-specific and could represent numerous conditions. More detailed clinical information, physical examination findings, and possibly diagnostic tests would be necessary to narrow down the differential diagnosis.",
        recommendations: "Recommend supportive care and symptom monitoring. Advise the patient to return for evaluation if symptoms persist beyond 1 week or if new concerning symptoms develop.",
        suggestedTests: ["Consider basic laboratory workup if symptoms persist"]
      };
    }
  };

  const formatProbability = (probability: number): string => {
    return `${Math.round(probability * 100)}%`;
  };

  const formattedDate = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a] pb-24">
      <div className="w-full max-w-[425px] mx-auto px-5">
        {/* Header */}
        <div className="flex justify-between items-center w-full py-2.5 mt-5">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-transparent border-0 text-white text-2xl cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Diagnosis Engine</h2>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Date Display */}
        <div className="w-full text-center mb-5">
          <p className="text-white/80 text-sm">{formattedDate}</p>
        </div>

        {result ? (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-white rounded-[15px] p-5 shadow-lg text-center">
              <div className="w-12 h-12 bg-[#00C389]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-[#00C389]" />
              </div>
              <h3 className="text-lg font-medium text-[#004953] mb-1">Diagnosis Complete</h3>
              <p className="text-gray-500 text-sm mb-4">Based on the provided symptoms and information</p>
              <Button 
                variant="outline" 
                className="border-[#00C389] text-[#00C389] hover:bg-[#00C389]/5"
                onClick={handleReset}
              >
                Start New Diagnosis
              </Button>
            </div>
            
            {/* Conditions */}
            <div className="bg-white rounded-[15px] p-5 shadow-lg">
              <h3 className="text-lg font-medium text-[#004953] mb-4">Possible Conditions</h3>
              <div className="space-y-4">
                {result.possibleConditions.map((condition, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{condition.name}</h4>
                      <span 
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          condition.probability > 0.6 
                            ? 'bg-red-100 text-red-700' 
                            : condition.probability > 0.3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {formatProbability(condition.probability)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{condition.description}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Recommendations:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {condition.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Differential Diagnosis */}
            <div className="bg-white rounded-[15px] p-5 shadow-lg">
              <h3 className="text-lg font-medium text-[#004953] mb-2">Differential Diagnosis</h3>
              <p className="text-sm text-gray-600">{result.differentialDiagnosis}</p>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white rounded-[15px] p-5 shadow-lg">
              <h3 className="text-lg font-medium text-[#004953] mb-2">Recommendations</h3>
              <p className="text-sm text-gray-600 mb-4">{result.recommendations}</p>
              
              <h4 className="font-medium text-sm mb-2">Suggested Tests:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {result.suggestedTests.map((test, index) => (
                  <li key={index}>{test}</li>
                ))}
              </ul>
            </div>
            
            {/* Note */}
            <div className="bg-[#004953]/10 rounded-[15px] p-4 shadow-md">
              <p className="text-white text-sm italic">
                Note: This is an AI-assisted diagnostic suggestion based on provided information. Clinical judgment and further evaluation are essential for definitive diagnosis.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-[15px] p-5 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(0,195,137,0.1)] flex items-center justify-center mr-4">
                  <Stethoscope className="text-[#00C389]" size={20} />
                </div>
                <h3 className="text-lg font-medium text-[#004953]">AI Diagnosis Assistant</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Enter symptoms and patient information to receive AI-assisted diagnostic suggestions. This tool helps identify possible conditions based on the information provided.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                    Symptoms *
                  </label>
                  <Textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe the symptoms in detail (e.g., severe headache for 3 days, fever of 101°F)"
                    className="min-h-[120px] resize-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="patientInfo" className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Information (Optional)
                  </label>
                  <Textarea
                    id="patientInfo"
                    value={patientInfo}
                    onChange={(e) => setPatientInfo(e.target.value)}
                    placeholder="Age, gender, weight, height, etc."
                    className="min-h-[80px] resize-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
                    Medical History (Optional)
                  </label>
                  <Textarea
                    id="medicalHistory"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Existing conditions, medications, allergies, etc."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* AI Suggestions */}
            <div className="bg-white rounded-[15px] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#004953]">Common Conditions</h3>
                <Wand2 className="text-[#00C389]" size={18} />
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b">
                  <AccordionTrigger className="text-sm font-medium py-3">Migraine</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Characterized by severe headache, often on one side, with sensitivity to light and sound, nausea, and visual disturbances.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b">
                  <AccordionTrigger className="text-sm font-medium py-3">Upper Respiratory Infection</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Common symptoms include cough, nasal congestion, sore throat, mild fever, and general malaise.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b">
                  <AccordionTrigger className="text-sm font-medium py-3">Gastroenteritis</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Inflammation of the digestive tract causing diarrhea, vomiting, abdominal pain, and sometimes fever.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-b">
                  <AccordionTrigger className="text-sm font-medium py-3">Hypertension</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Often asymptomatic, but may present with headaches, shortness of breath, chest pain, or visual changes.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-sm font-medium py-3">Type 2 Diabetes</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Symptoms include increased thirst, frequent urination, unexplained weight loss, fatigue, and blurred vision.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#00C389] hover:bg-[#00A070] text-white shadow-lg h-12"
              disabled={diagnosing}
            >
              {diagnosing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" /> Generate Diagnosis
                </>
              )}
            </Button>
            
            <div className="bg-white/10 rounded-[15px] p-4 border border-white/20">
              <p className="text-white text-xs text-center">
                Note: This tool is designed to assist healthcare professionals but should not replace clinical judgment or proper medical evaluation.
              </p>
            </div>
          </form>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}

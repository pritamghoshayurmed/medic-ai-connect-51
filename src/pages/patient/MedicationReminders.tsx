
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Bell } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import MedicationCard from "@/components/MedicationCard";
import { Medication } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockMedications: Medication[] = [
  {
    id: "med1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: "2025-03-15",
    endDate: "2025-06-15",
    prescribed_by: "Dr. Sarah Johnson",
  },
  {
    id: "med2",
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "Twice daily",
    startDate: "2025-04-01",
    endDate: "2025-04-15",
    prescribed_by: "Dr. Michael Chen",
  },
  {
    id: "med3",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    startDate: "2025-03-01",
    prescribed_by: "Dr. Emily Williams",
  },
];

export default function MedicationReminders() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  
  // Filter active and completed medications
  const activeMedications = medications.filter((med) => {
    if (!med.endDate) return true;
    const endDate = new Date(med.endDate);
    return endDate >= new Date();
  });
  
  const completedMedications = medications.filter((med) => {
    if (!med.endDate) return false;
    const endDate = new Date(med.endDate);
    return endDate < new Date();
  });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Medication Reminders</h1>
      </div>

      {/* Today's Reminders */}
      <div className="p-4 bg-blue-50">
        <h2 className="text-lg font-bold mb-3">Today's Reminders</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Lisinopril 10mg</h3>
              <p className="text-sm text-gray-600">8:00 AM with breakfast</p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto">
              Taken
            </Button>
          </div>
        </div>
        
        <div className="mt-3 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Ibuprofen 400mg</h3>
              <p className="text-sm text-gray-600">2:00 PM after lunch</p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto">
              Taken
            </Button>
          </div>
        </div>
      </div>

      {/* All Medications */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-3">My Medications</h2>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeMedications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedMedications.length > 0 ? (
              completedMedications.map((medication) => (
                <MedicationCard key={medication.id} medication={medication} />
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No completed medications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add medication button */}
      <div className="fixed bottom-20 right-4">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <Plus />
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}


import { Medication } from "@/types";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface MedicationCardProps {
  medication: Medication;
}

export default function MedicationCard({ medication }: MedicationCardProps) {
  const [isReminderActive, setIsReminderActive] = useState(true);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const toggleReminder = () => {
    setIsReminderActive(!isReminderActive);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{medication.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleReminder}
        >
          {isReminderActive ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
        </Button>
      </div>
      
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Dosage:</span> {medication.dosage}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Frequency:</span> {medication.frequency}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Duration:</span> {formatDate(medication.startDate)} 
          {medication.endDate && ` - ${formatDate(medication.endDate)}`}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Prescribed by:</span> {medication.prescribed_by}
        </p>
      </div>
    </div>
  );
}

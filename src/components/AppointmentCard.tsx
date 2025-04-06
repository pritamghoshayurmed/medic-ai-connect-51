import { Appointment, Doctor, Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { CalendarClock, Video, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentCardProps {
  appointment: Appointment;
  person: Doctor | Patient;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorImage?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  onReschedule?: () => void;
  onChat?: () => void;
  onViewDetails?: () => void;
}

export default function AppointmentCard({ 
  appointment, 
  person, 
  doctorName,
  doctorSpecialty,
  doctorImage,
  onCancel, 
  onReschedule,
  onChat,
  onViewDetails,
  showCancelButton = true
}: AppointmentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const basePath = isDoctor ? "/doctor" : "/patient";

  const getStatusColor = () => {
    switch (appointment.status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAppointmentDate = () => {
    try {
      const date = new Date(appointment.date);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return appointment.date;
    }
  };

  const handleChatClick = () => {
    if (onChat) {
      onChat();
    } else {
      navigate(`${isDoctor ? '/doctor/chat/' : '/patient/chat/'}${isDoctor ? appointment.patientId : appointment.doctorId}`);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  // Using provided doctor props if available, otherwise use person props
  const displayName = doctorName || person.name;
  const displaySpecialty = doctorSpecialty || (isDoctor ? "Patient" : (person as Doctor).specialty);
  const profileImage = doctorImage || person.profilePic;

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {profileImage ? (
            <img
              src={profileImage}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover mr-3"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mr-3">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold">{displayName}</h3>
            <p className="text-sm text-gray-600">
              {displaySpecialty}
            </p>
          </div>
        </div>
        <span className={`text-xs py-1 px-2 rounded-full ${getStatusColor()}`}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </span>
      </div>
      
      <div className="mt-3 flex items-center text-gray-600">
        <CalendarClock className="w-4 h-4 mr-2" />
        <span className="text-sm">{formatAppointmentDate()} • {appointment.time}</span>
      </div>
      
      {appointment.reason && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-semibold">Reason:</span> {appointment.reason}
        </p>
      )}
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-1"
          onClick={handleChatClick}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-1"
        >
          <Video className="w-4 h-4" /> Video Call
        </Button>
        
        {appointment.status !== "completed" && appointment.status !== "cancelled" && showCancelButton && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        {onViewDetails && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}

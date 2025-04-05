
import { Doctor } from "@/types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment?: () => void;
  onViewProfile?: () => void;
}

export default function DoctorCard({ doctor, onBookAppointment, onViewProfile }: DoctorCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          {doctor.profilePic ? (
            <img
              src={doctor.profilePic}
              alt={doctor.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
              {doctor.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="font-bold">{doctor.name}</h3>
          <p className="text-sm text-gray-600">{doctor.specialty}</p>
          <div className="flex items-center mt-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm ml-1">{doctor.rating || 4.5}</span>
            <span className="text-sm text-gray-500 ml-2">{doctor.experience} years exp</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-primary border-primary"
          onClick={() => onViewProfile ? onViewProfile() : navigate(`/patient/chat/${doctor.id}`)}
        >
          {onViewProfile ? "View Profile" : "Chat"}
        </Button>
        <Button 
          size="sm" 
          onClick={onBookAppointment}
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
}

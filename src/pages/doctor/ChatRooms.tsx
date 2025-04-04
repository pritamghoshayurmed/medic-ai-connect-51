
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Search, Plus, Users, MessageSquare } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockPatientChats = [
  {
    id: "chat1",
    name: "John Doe",
    lastMessage: "Thank you for the prescription, doctor.",
    time: "10:45 AM",
    unread: 0,
  },
  {
    id: "chat2",
    name: "Jane Smith",
    lastMessage: "When should I take this medication?",
    time: "Yesterday",
    unread: 2,
  },
  {
    id: "chat3",
    name: "Robert Johnson",
    lastMessage: "The symptoms are getting better now.",
    time: "2 days ago",
    unread: 0,
  },
];

const mockDoctorChats = [
  {
    id: "docChat1",
    name: "Dr. Sarah Williams",
    lastMessage: "What do you think about this unusual case?",
    time: "3:20 PM",
    unread: 1,
    participants: ["Dr. Sarah Williams", "Dr. Michael Chen", "You"],
  },
  {
    id: "docChat2",
    name: "Cardiology Group",
    lastMessage: "New treatment protocol discussion",
    time: "Yesterday",
    unread: 0,
    participants: ["Dr. James Wilson", "Dr. Emily Taylor", "Dr. Richard Brown", "You"],
  },
];

const availableDoctors = [
  { id: "doc1", name: "Dr. Sarah Williams", specialty: "Cardiologist" },
  { id: "doc2", name: "Dr. Michael Chen", specialty: "Neurologist" },
  { id: "doc3", name: "Dr. Emily Taylor", specialty: "Pediatrician" },
  { id: "doc4", name: "Dr. James Wilson", specialty: "Dermatologist" },
  { id: "doc5", name: "Dr. Richard Brown", specialty: "Orthopedic Surgeon" },
];

export default function DoctorChatRooms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  
  const filteredPatientChats = mockPatientChats.filter(
    (chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDoctorChats = mockDoctorChats.filter(
    (chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctors((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
  };

  const createChatRoom = () => {
    if (selectedDoctors.length === 0) {
      toast({
        title: "No doctors selected",
        description: "Please select at least one doctor for the chat room.",
        variant: "destructive",
      });
      return;
    }
    
    // For a group chat, require a name
    if (selectedDoctors.length > 1 && !groupName) {
      toast({
        title: "Group name required",
        description: "Please provide a name for the group chat.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Chat room created",
      description: selectedDoctors.length === 1 
        ? "Direct chat has been started"
        : "Group chat has been created",
    });
    
    setDialogOpen(false);
    setSelectedDoctors([]);
    setGroupName("");
    
    // In a real app, you would navigate to the newly created chat
    // For now, we'll just navigate to a mock chat
    navigate("/doctor/chat/docChat1");
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center">
        <Button variant="ghost" size="icon" className="text-white mr-2" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-xl font-bold">Chat Rooms</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid grid-cols-2 w-full px-4">
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
        </TabsList>
        
        {/* Patients Tab */}
        <TabsContent value="patients" className="px-4 mt-4">
          <div className="space-y-3">
            {filteredPatientChats.length > 0 ? (
              filteredPatientChats.map((chat) => (
                <Card key={chat.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(`/doctor/chat/${chat.id}`)}>
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-primary font-semibold">{chat.name.charAt(0)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold truncate">{chat.name}</h3>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center ml-2">
                          <span className="text-white text-xs">{chat.unread}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No conversations found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Doctors Tab */}
        <TabsContent value="doctors" className="px-4 mt-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <div className="flex justify-end mb-4">
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" /> New Chat
                </Button>
              </DialogTrigger>
            </div>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chat</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select Doctors</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${
                          selectedDoctors.includes(doctor.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted"
                        }`}
                        onClick={() => handleDoctorSelect(doctor.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className={`font-semibold ${selectedDoctors.includes(doctor.id) ? "text-primary-foreground" : "text-primary"}`}>
                            {doctor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-xs opacity-80">{doctor.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedDoctors.length > 1 && (
                  <div className="space-y-2">
                    <label htmlFor="group-name" className="text-sm font-medium">Group Name</label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group chat name"
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={createChatRoom}>Create Chat</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="space-y-3">
            {filteredDoctorChats.length > 0 ? (
              filteredDoctorChats.map((chat) => (
                <Card key={chat.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(`/doctor/chat/${chat.id}`)}>
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full ${chat.participants.length > 2 ? "bg-primary" : "bg-blue-100"} flex items-center justify-center mr-3`}>
                        {chat.participants.length > 2 ? (
                          <Users className={`h-6 w-6 ${chat.participants.length > 2 ? "text-white" : "text-primary"}`} />
                        ) : (
                          <span className="text-primary font-semibold">{chat.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold truncate">{chat.name}</h3>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        {chat.participants.length > 2 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {chat.participants.slice(0, 2).join(", ")} {chat.participants.length > 3 ? `+${chat.participants.length - 3}` : ""}
                          </p>
                        )}
                      </div>
                      {chat.unread > 0 && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center ml-2">
                          <span className="text-white text-xs">{chat.unread}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No conversations found</p>
                <Button variant="link" className="mt-2" onClick={() => setDialogOpen(true)}>
                  Start a new chat
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}

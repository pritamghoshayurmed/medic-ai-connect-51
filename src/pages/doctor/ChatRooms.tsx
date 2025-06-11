import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, Plus, MessageSquare, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  time?: string;
  unread: number;
  participants?: string[];
}

export default function DoctorChatRooms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [patientChats, setPatientChats] = useState<ChatRoom[]>([]);
  const [doctorChats, setDoctorChats] = useState<ChatRoom[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<{id: string, name: string, specialty: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        // Fetch messages between users with explicit relationship hints
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            timestamp,
            read,
            sender:profiles!messages_sender_id_fkey(id, full_name, role),
            receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('timestamp', { ascending: false });

        if (messagesError) {
          console.error("Messages fetch error:", messagesError);
          throw messagesError;
        }

        // Process messages to create chat rooms
        const messagesByUser = new Map<string, {
          userId: string,
          userName: string,
          role: string,
          lastMessage: string,
          timestamp: string,
          unread: number
        }>();

        // Group messages by user
        messagesData?.forEach(msg => {
          // Determine if the other user is a patient or doctor
          let otherUserId: string;
          let otherUserName: string;
          let otherUserRole: string;
          
          if (msg.sender_id === user.id) {
            otherUserId = msg.receiver_id;
            otherUserName = msg.receiver?.full_name || '';
            otherUserRole = msg.receiver?.role || '';
          } else {
            otherUserId = msg.sender_id;
            otherUserName = msg.sender?.full_name || '';
            otherUserRole = msg.sender?.role || '';
            // Count unread messages
            if (!msg.read) {
              const existing = messagesByUser.get(otherUserId);
              if (existing) {
                existing.unread += 1;
              }
            }
          }

          // If this is the first message we've seen with this user
          if (!messagesByUser.has(otherUserId) || 
              new Date(messagesByUser.get(otherUserId)!.timestamp) < new Date(msg.timestamp)) {
            
            messagesByUser.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName,
              role: otherUserRole,
              lastMessage: msg.content,
              timestamp: msg.timestamp,
              unread: messagesByUser.has(otherUserId) ? messagesByUser.get(otherUserId)!.unread : (msg.sender_id !== user.id && !msg.read ? 1 : 0)
            });
          }
        });

        // Convert to ChatRoom objects and separate by role
        const patientChatsList: ChatRoom[] = [];
        const doctorChatsList: ChatRoom[] = [];

        messagesByUser.forEach(chat => {
          const timeAgo = formatTimeAgo(new Date(chat.timestamp));
          
          const chatRoom: ChatRoom = {
            id: chat.userId,
            name: chat.userName,
            lastMessage: chat.lastMessage,
            time: timeAgo,
            unread: chat.unread
          };

          if (chat.role === 'patient') {
            patientChatsList.push(chatRoom);
          } else if (chat.role === 'doctor') {
            doctorChatsList.push(chatRoom);
          }
        });

        setPatientChats(patientChatsList);
        setDoctorChats(doctorChatsList);

        // Fetch available doctors for creating new chats
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            doctor_profiles:doctor_profiles(
              experience_years
            )
          `)
          .eq('role', 'doctor')
          .neq('id', user.id);

        if (doctorsError) {
          console.error("Doctors fetch error:", doctorsError);
          throw doctorsError;
        }

        const formattedDoctors = doctorsData?.map((doc: any) => ({
          id: doc.id,
          name: doc.full_name,
          specialty: 'General Practitioner' // Default value
        })) || [];

        setAvailableDoctors(formattedDoctors);

      } catch (error) {
        console.error("Error fetching chats:", error);
        toast({
          title: "Error",
          description: "Failed to load chat rooms",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, toast]);

  // Helper function to format time
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    
    // For older messages, show the date
    return date.toLocaleDateString();
  };
  
  const filteredPatientChats = patientChats.filter(
    (chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDoctorChats = doctorChats.filter(
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

  const createChatRoom = async () => {
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

    try {
      // Here in a real application, you would create the chat room in the database
      // For now, we'll just simulate success
      
      toast({
        title: "Chat created",
        description: selectedDoctors.length > 1
          ? `Group chat "${groupName}" has been created successfully.`
          : `Chat with ${availableDoctors.find(d => d.id === selectedDoctors[0])?.name} has been created.`,
      });
      
      setDialogOpen(false);
      setSelectedDoctors([]);
      setGroupName("");
      
      // In a real application, you would redirect to the new chat room or fetch the updated list of chats
    } catch (error) {
      console.error("Error creating chat room:", error);
      toast({
        title: "Error",
        description: "Failed to create chat room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/doctor/chat/${chatId}`);
  };

  const formattedDate = format(new Date(), "EEEE, MMMM d");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#004953] via-[#006064] to-[#00363a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-white">Chats</h2>
          <button 
            onClick={() => setDialogOpen(true)} 
            className="bg-transparent border-0 text-white text-2xl cursor-pointer"
          >
            <PlusCircle size={22} />
          </button>
        </div>
        
        {/* Date Display */}
        <div className="w-full text-center mb-5">
          <p className="text-white/80 text-sm">{formattedDate}</p>
        </div>
        
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white rounded-[10px] border-0 shadow-sm w-full"
          />
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="patients" className="w-full mb-5">
          <TabsList className="grid grid-cols-2 bg-white rounded-full p-1 shadow-sm">
            <TabsTrigger 
              value="patients" 
              className="data-[state=active]:bg-[#00C389] data-[state=active]:text-white rounded-full"
            >
              Patients
            </TabsTrigger>
            <TabsTrigger 
              value="doctors" 
              className="data-[state=active]:bg-[#00C389] data-[state=active]:text-white rounded-full"
            >
              Doctors
            </TabsTrigger>
          </TabsList>
          
          {/* Patient Chats Tab */}
          <TabsContent value="patients" className="mt-4">
            <div className="space-y-3">
              {filteredPatientChats.length > 0 ? (
                filteredPatientChats.map(chat => (
                  <div
                    key={chat.id}
                    className="bg-white rounded-[15px] p-4 shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleChatClick(chat.id)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                            {chat.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {chat.unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#00C389] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{chat.name}</h3>
                          <span className="text-xs text-gray-500">
                            {chat.time}
                          </span>
                        </div>
                        <p className={`text-sm mt-0.5 line-clamp-1 ${chat.unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                          {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[15px] p-6 text-center shadow-lg">
                  <div className="w-16 h-16 bg-[#004953]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-[#00C389]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#004953] mb-1">No Patient Conversations</h3>
                  <p className="text-gray-500">You don't have any conversations with patients yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Doctor Chats Tab */}
          <TabsContent value="doctors" className="mt-4">
            <div className="space-y-3">
              {filteredDoctorChats.length > 0 ? (
                filteredDoctorChats.map(chat => (
                  <div
                    key={chat.id}
                    className="bg-white rounded-[15px] p-4 shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleChatClick(chat.id)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                            {chat.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {chat.unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#00C389] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Dr. {chat.name}</h3>
                          <span className="text-xs text-gray-500">
                            {chat.time}
                          </span>
                        </div>
                        <p className={`text-sm mt-0.5 line-clamp-1 ${chat.unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                          {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[15px] p-6 text-center shadow-lg">
                  <div className="w-16 h-16 bg-[#004953]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-[#00C389]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#004953] mb-1">No Doctor Conversations</h3>
                  <p className="text-gray-500 mb-4">You don't have any conversations with other doctors yet.</p>
                  <Button 
                    onClick={() => setDialogOpen(true)} 
                    className="bg-[#00C389] hover:bg-[#00A070] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create New Chat
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Create Chat Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white rounded-[15px]">
            <DialogHeader>
              <DialogTitle className="text-[#004953]">Create New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {selectedDoctors.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Doctors</label>
                <div className="bg-gray-50 rounded-lg p-2 max-h-[200px] overflow-y-auto">
                  {availableDoctors.length > 0 ? (
                    availableDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md"
                      >
                        <Checkbox
                          checked={selectedDoctors.includes(doctor.id)}
                          onCheckedChange={() => handleDoctorSelect(doctor.id)}
                          id={doctor.id}
                          className="data-[state=checked]:bg-[#00C389] data-[state=checked]:border-[#00C389]"
                        />
                        <label htmlFor={doctor.id} className="flex flex-1 items-center cursor-pointer">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-[#004953]/10 text-[#004953]">
                              {doctor.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr. {doctor.name}</p>
                            <p className="text-xs text-gray-500">{doctor.specialty}</p>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No other doctors available</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedDoctors([]);
                  setGroupName("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={createChatRoom} 
                className="bg-[#00C389] hover:bg-[#00A070] text-white ml-2"
                disabled={selectedDoctors.length === 0}
              >
                Create Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <BottomNavigation />
    </div>
  );
}

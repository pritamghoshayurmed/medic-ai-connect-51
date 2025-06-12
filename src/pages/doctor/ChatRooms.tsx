import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Search, Plus, Users, MessageSquare } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
      // For simplicity, we'll implement only 1:1 chats for now
      // Group chat would require a more complex data model
      if (selectedDoctors.length === 1) {
        const doctorId = selectedDoctors[0];
        
        // Check if there are any existing messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${user.id})`)
          .limit(1);
        
        if (error) throw error;
        
        // Send an initial message if this is the first conversation
        if (!data || data.length === 0) {
          const { error: sendError } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: doctorId,
              content: 'Hello, I would like to discuss a case with you.',
              read: false,
              timestamp: new Date().toISOString()
            });
          
          if (sendError) throw sendError;
        }
        
        // Navigate to the chat
        navigate(`/doctor/chat/${doctorId}`);
      }
      
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create chat room",
        variant: "destructive"
      });
    } finally {
      setDialogOpen(false);
      setSelectedDoctors([]);
      setGroupName("");
    }
  };

  return (
    <div className="pb-24 min-h-screen" style={{background: 'linear-gradient(135deg, #005A7A, #002838)'}}>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Chat Rooms</h1>
            <p className="text-white text-opacity-90">Connect with patients and colleagues</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Search and New Chat */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-60 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder:text-white placeholder:text-opacity-60"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white bg-opacity-95 backdrop-blur-sm">
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
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createChatRoom}>
                  {selectedDoctors.length === 1 ? "Start Chat" : "Create Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white bg-opacity-10 backdrop-blur-sm">
            <TabsTrigger 
              value="patients"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger 
              value="doctors"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-teal-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Doctors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredPatientChats.length > 0 ? (
              <div className="space-y-2">
                {filteredPatientChats.map((chat) => (
                  <Card 
                    key={chat.id}
                    className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-20 transition-colors"
                    onClick={() => navigate(`/doctor/chat/${chat.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{chat.name}</h3>
                          {chat.lastMessage && (
                            <p className="text-sm text-white text-opacity-80 line-clamp-1">
                              {chat.lastMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {chat.time && (
                            <p className="text-xs text-white text-opacity-60">{chat.time}</p>
                          )}
                          {chat.unread > 0 && (
                            <span className="inline-block px-2 py-1 bg-teal-500 text-white text-xs rounded-full mt-1">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                <p className="text-white text-opacity-80">No patient chats found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="doctors">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredDoctorChats.length > 0 ? (
              <div className="space-y-2">
                {filteredDoctorChats.map((chat) => (
                  <Card 
                    key={chat.id}
                    className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-20 transition-colors"
                    onClick={() => navigate(`/doctor/chat/${chat.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{chat.name}</h3>
                          {chat.lastMessage && (
                            <p className="text-sm text-white text-opacity-80 line-clamp-1">
                              {chat.lastMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {chat.time && (
                            <p className="text-xs text-white text-opacity-60">{chat.time}</p>
                          )}
                          {chat.unread > 0 && (
                            <span className="inline-block px-2 py-1 bg-teal-500 text-white text-xs rounded-full mt-1">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
                <p className="text-white text-opacity-80">No doctor chats found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
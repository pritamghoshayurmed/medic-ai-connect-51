import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Users, Plus, UserPlus, Video, X, UserCircle } from 'lucide-react';
import { askMedicalQuestion } from '@/services/doctorAiService';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  getCurrentDoctor, 
  getAvailableDoctors, 
  getOnlineDoctors,
  sendInvitation,
  createCollaboration,
  addMessageToCollaboration,
  generateCollaborationAIResponse,
  Doctor
} from "@/services/collaborationService";
import { 
  User, Bot, Clock, Stethoscope, Globe, Clock5, BrainCircuit
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'doctor';
  content: string;
  timestamp: Date;
  doctorName?: string;
  doctorAvatar?: string;
  isLoading?: boolean;
  isAI?: boolean;
  isError?: boolean;
}

interface MedicalQAChatProps {
  userName?: string;
  userAvatar?: string;
  analysisId?: string;
}

export default function MedicalQAChat({ 
  userName = 'Dr. User', 
  userAvatar,
  analysisId
}: MedicalQAChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: analysisId 
        ? "Welcome to the medical discussion. You can ask questions about the analysis or invite other doctors to collaborate."
        : "How can I assist with your medical questions today?",
      timestamp: new Date(),
      isAI: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [collaborators, setCollaborators] = useState<Doctor[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborationId, setCollaborationId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mock data for available doctors
  const availableDoctors = getAvailableDoctors();
  const onlineDoctors = getOnlineDoctors();
  const currentDoctor = getCurrentDoctor();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      doctorName: userName
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      if (isCollaborating && collaborationId) {
        // If in collaboration mode, add message to collaboration
        addMessageToCollaboration(collaborationId, input);
        
        // Simulate responses from other doctors if they are collaborating
        if (collaborators.length > 0 && Math.random() > 0.5) {
          // Pick a random collaborator to respond
          const randomDoctor = collaborators[Math.floor(Math.random() * collaborators.length)];
          
          // Add a slight delay to make it seem more realistic
          setTimeout(() => {
            generateCollaborationAIResponse(collaborationId, input)
              .then(response => {
                if (response) {
                  setMessages(prev => [
                    ...prev, 
                    {
                      id: response.id,
                      role: 'doctor',
                      content: response.content,
                      timestamp: new Date(response.timestamp),
                      doctorName: randomDoctor.name,
                      doctorAvatar: randomDoctor.avatar
                    }
                  ]);
                }
              })
              .catch(console.error);
          }, 2000 + Math.random() * 2000);
        }
      } else {
        // Use AI for responses when not collaborating with doctors
        const response = await askMedicalQuestion(input);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error asking question:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'I apologize, but I encountered an error while processing your question. Please try again later.'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error(error.message || 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteDoctor = (doctor: Doctor) => {
    if (collaborators.some(c => c.id === doctor.id)) {
      toast.info(`${doctor.name} is already a collaborator`);
      return;
    }
    
    // Add doctor to collaborators
    setCollaborators(prev => [...prev, doctor]);
    
    // If this is the first collaborator, create a collaboration
    if (!isCollaborating) {
      const collaboration = createCollaboration(
        analysisId || "general-consultation",
        [currentDoctor, doctor]
      );
      setCollaborationId(collaboration.id);
      setIsCollaborating(true);
      
      // Add system message about collaboration
      setMessages(prev => [
        ...prev, 
        {
          id: `collab-${Date.now()}`,
          role: 'assistant',
          content: `You've started a collaboration with ${doctor.name}. You can now discuss the case together.`,
          timestamp: new Date()
        }
      ]);
    } else {
      // Add system message about new collaborator
      setMessages(prev => [
        ...prev, 
        {
          id: `collab-${Date.now()}`,
          role: 'assistant',
          content: `${doctor.name} has joined the collaboration.`,
          timestamp: new Date()
        }
      ]);
    }
    
    // Send invitation (in a real app, this would trigger a notification)
    if (analysisId) {
      sendInvitation(doctor, analysisId, "Please join this case discussion");
    }
    
    // Close dialog
    setIsInviteDialogOpen(false);
    toast.success(`Invited ${doctor.name} to collaborate`);
  };

  const startCollaboration = () => {
    if (collaborators.length === 0) {
      toast.error('Please invite at least one doctor to collaborate');
      return;
    }
    
    setIsCollaborating(true);
    setIsInviteDialogOpen(false);
    
    // Add system message about starting collaboration
    setMessages(prev => [
      ...prev, 
      {
        id: `collab-start-${Date.now()}`,
        role: 'assistant',
        content: `Collaboration session started with ${collaborators.map(d => d.name).join(', ')}.`,
        timestamp: new Date()
      }
    ]);
  };

  const endCollaboration = () => {
    setIsCollaborating(false);
    setCollaborationId(null);
    setCollaborators([]);
    
    // Add system message about ending collaboration
    setMessages(prev => [
      ...prev, 
      {
        id: `collab-end-${Date.now()}`,
        role: 'assistant',
        content: "You've ended the collaboration session.",
        timestamp: new Date()
      }
    ]);
    
    toast.info("Collaboration session ended");
  };

  const getAvatarForMessage = (message: Message) => {
    if (message.role === 'user') {
      return userAvatar || '/avatars/default-user.png';
    } else if (message.role === 'doctor' && message.doctorAvatar) {
      return message.doctorAvatar;
    } else {
      return '/ai-assistant.png';
    }
  };

  const getInitialsForMessage = (message: Message) => {
    if (message.role === 'user') {
      return userName[0];
    } else if (message.role === 'doctor' && message.doctorName) {
      const names = message.doctorName.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    } else {
      return 'AI';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary/10 p-2 flex justify-between items-center">
        <div className="flex items-center">
          <UserCircle className="h-5 w-5 mr-1 text-primary" />
          <span className="text-sm font-medium">{userName}</span>
        </div>
        <div className="flex gap-1">
          {isCollaborating && (
            <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">Collaborating ({collaborators.length})</span>
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Actions</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs" 
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-2" />
                  Invite Doctors
                </Button>
                {isCollaborating ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={endCollaboration}
                  >
                    <X className="h-3 w-3 mr-2" />
                    End Collaboration
                  </Button>
                ) : collaborators.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-xs"
                    onClick={startCollaboration}
                  >
                    <Users className="h-3 w-3 mr-2" />
                    Start Collaboration
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Video className="h-3 w-3 mr-2" />
                  Start Video Consultation
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className={`${message.role === 'user' ? 'ml-2' : 'mr-2'} h-8 w-8`}>
                <AvatarImage src={getAvatarForMessage(message)} />
                <AvatarFallback>{getInitialsForMessage(message)}</AvatarFallback>
              </Avatar>
              
              <Card className={`${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.role === 'doctor'
                    ? 'bg-blue-100'
                    : 'bg-muted'
              }`}>
                <CardContent className="p-3">
                  {message.doctorName && message.role === 'doctor' && (
                    <p className="text-xs font-medium text-blue-600 mb-1">{message.doctorName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isCollaborating ? "Collaborate with other doctors..." : "Ask a medical question..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* Invite Doctors Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Doctors to Collaborate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="online">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online">Online Now</TabsTrigger>
                <TabsTrigger value="all">All Doctors</TabsTrigger>
              </TabsList>
              <TabsContent value="online" className="mt-4">
                <div className="space-y-2">
                  {onlineDoctors.length > 0 ? (
                    onlineDoctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={doctor.avatar} />
                            <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center">
                              {doctor.name}
                              <Badge className="ml-2 bg-green-500 h-2 w-2 p-0 rounded-full" />
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              {doctor.specialty}
                            </div>
                            {doctor.hospital && (
                              <div className="text-xs text-gray-400 flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                {doctor.hospital}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleInviteDoctor(doctor)}
                          >
                            Invite
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No doctors currently online</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="all" className="mt-4">
                <div className="space-y-2">
                  {availableDoctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={doctor.avatar} />
                          <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center">
                            {doctor.name}
                            <Badge 
                              className={`ml-2 h-2 w-2 p-0 rounded-full ${
                                doctor.status === 'online' ? 'bg-green-500' : 
                                doctor.status === 'busy' ? 'bg-amber-500' : 
                                'bg-gray-300'
                              }`} 
                            />
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Stethoscope className="h-3 w-3 mr-1" />
                            {doctor.specialty}
                          </div>
                          {doctor.hospital && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {doctor.hospital}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleInviteDoctor(doctor)}
                          disabled={doctor.status === 'offline'}
                        >
                          Invite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={startCollaboration} disabled={collaborators.length === 0}>
                Start Collaboration ({collaborators.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
import { v4 as uuidv4 } from 'uuid';

// Types for collaboration
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital?: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
}

export interface Invitation {
  id: string;
  analysisId: string;
  fromDoctor: Doctor;
  toDoctor: Doctor;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface Collaboration {
  id: string;
  analysisId: string;
  title: string;
  participants: Doctor[];
  messages: CollaborationMessage[];
  startTime: string;
  active: boolean;
}

export interface CollaborationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  attachments?: string[];
  isAI?: boolean;
}

// Mock data for doctors
const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    hospital: 'Memorial Hospital',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah',
    status: 'online'
  },
  {
    id: 'doc-2',
    name: 'Dr. James Chen',
    specialty: 'Neurology',
    hospital: 'University Medical Center',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=James',
    status: 'online'
  },
  {
    id: 'doc-3',
    name: 'Dr. Maria Rodriguez',
    specialty: 'Radiology',
    hospital: 'City General Hospital',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Maria',
    status: 'busy'
  },
  {
    id: 'doc-4',
    name: 'Dr. Robert Kim',
    specialty: 'Oncology',
    hospital: 'Cancer Treatment Center',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Robert',
    status: 'offline'
  },
  {
    id: 'doc-5',
    name: 'Dr. Emily Patel',
    specialty: 'Pediatric Radiology',
    hospital: 'Children\'s Hospital',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Emily',
    status: 'online'
  }
];

// Mock user doctor (current user)
export const getCurrentDoctor = (): Doctor => {
  return {
    id: 'user-doc',
    name: 'Dr. User',
    specialty: 'General Medicine',
    hospital: 'Your Hospital',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=User',
    status: 'online'
  };
};

// Get all available doctors
export const getAvailableDoctors = (): Doctor[] => {
  // In a real app, this would filter out the current user
  return mockDoctors.filter(doc => doc.id !== 'user-doc');
};

// Get doctors by specialty
export const getDoctorsBySpecialty = (specialty: string): Doctor[] => {
  return mockDoctors.filter(doc => doc.specialty.toLowerCase().includes(specialty.toLowerCase()));
};

// Get online doctors
export const getOnlineDoctors = (): Doctor[] => {
  return mockDoctors.filter(doc => doc.status === 'online');
};

// Local storage keys
const INVITATIONS_KEY = 'doctor_collaboration_invitations';
const COLLABORATIONS_KEY = 'doctor_collaborations';

// Get all invitations
export const getInvitations = (): Invitation[] => {
  const stored = localStorage.getItem(INVITATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Send invitation to a doctor
export const sendInvitation = (toDoctor: Doctor, analysisId: string, message: string): Invitation => {
  const invitations = getInvitations();
  
  const newInvitation: Invitation = {
    id: uuidv4(),
    analysisId,
    fromDoctor: getCurrentDoctor(),
    toDoctor,
    message,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  
  const updatedInvitations = [...invitations, newInvitation];
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(updatedInvitations));
  
  return newInvitation;
};

// Update invitation status
export const updateInvitationStatus = (invitationId: string, status: 'accepted' | 'declined'): Invitation | null => {
  const invitations = getInvitations();
  const invitation = invitations.find(inv => inv.id === invitationId);
  
  if (!invitation) {
    return null;
  }
  
  invitation.status = status;
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  
  // If accepted, create a new collaboration
  if (status === 'accepted') {
    createCollaboration(invitation.analysisId, [invitation.fromDoctor, invitation.toDoctor]);
  }
  
  return invitation;
};

// Get all collaborations
export const getCollaborations = (): Collaboration[] => {
  const stored = localStorage.getItem(COLLABORATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Get a specific collaboration
export const getCollaboration = (collaborationId: string): Collaboration | null => {
  const collaborations = getCollaborations();
  return collaborations.find(collab => collab.id === collaborationId) || null;
};

// Get collaborations for an analysis
export const getCollaborationsForAnalysis = (analysisId: string): Collaboration[] => {
  const collaborations = getCollaborations();
  return collaborations.filter(collab => collab.analysisId === analysisId);
};

// Create a new collaboration
export const createCollaboration = (analysisId: string, participants: Doctor[]): Collaboration => {
  const collaborations = getCollaborations();
  
  const newCollaboration: Collaboration = {
    id: uuidv4(),
    analysisId,
    title: `Collaboration on Analysis #${analysisId.substring(0, 8)}`,
    participants,
    messages: [],
    startTime: new Date().toISOString(),
    active: true
  };
  
  const updatedCollaborations = [...collaborations, newCollaboration];
  localStorage.setItem(COLLABORATIONS_KEY, JSON.stringify(updatedCollaborations));
  
  return newCollaboration;
};

// Add a message to a collaboration
export const addMessageToCollaboration = (
  collaborationId: string, 
  content: string, 
  senderId: string = 'user-doc',
  isAI: boolean = false
): CollaborationMessage | null => {
  const collaborations = getCollaborations();
  const collaboration = collaborations.find(collab => collab.id === collaborationId);
  
  if (!collaboration) {
    return null;
  }
  
  const sender = senderId === 'user-doc' 
    ? getCurrentDoctor() 
    : collaboration.participants.find(p => p.id === senderId) || getCurrentDoctor();
  
  const newMessage: CollaborationMessage = {
    id: uuidv4(),
    senderId,
    senderName: sender.name,
    senderAvatar: sender.avatar,
    content,
    timestamp: new Date().toISOString(),
    isAI
  };
  
  collaboration.messages.push(newMessage);
  localStorage.setItem(COLLABORATIONS_KEY, JSON.stringify(collaborations));
  
  return newMessage;
};

// End a collaboration
export const endCollaboration = (collaborationId: string): boolean => {
  const collaborations = getCollaborations();
  const collaboration = collaborations.find(collab => collab.id === collaborationId);
  
  if (!collaboration) {
    return false;
  }
  
  collaboration.active = false;
  localStorage.setItem(COLLABORATIONS_KEY, JSON.stringify(collaborations));
  
  return true;
};

// Generate AI response for collaboration
export const generateCollaborationAIResponse = async (
  collaborationId: string, 
  message: string
): Promise<CollaborationMessage | null> => {
  // In a real implementation, this would call an AI service
  // For now, we'll simulate a response
  
  // Add a delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const responses = [
    "Based on these findings, I would recommend additional imaging studies to confirm the diagnosis.",
    "The image shows signs consistent with early-stage inflammatory changes. I've seen similar patterns in cases of autoimmune disorders.",
    "Looking at the density variations in this region, we should consider consulting with a specialist in infectious diseases.",
    "This appears to be a textbook case. The literature suggests a conservative treatment approach would be most appropriate here.",
    "Have you considered alternative diagnoses? The pattern here could also be indicative of a more rare condition that presents similarly.",
    "I've reviewed the latest research and there's a new treatment protocol that might be applicable in this case.",
    "The findings are interesting but inconclusive. We should order additional tests focusing on these specific areas.",
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return addMessageToCollaboration(
    collaborationId,
    randomResponse,
    'doc-ai', // AI doctor ID
    true
  );
}; 
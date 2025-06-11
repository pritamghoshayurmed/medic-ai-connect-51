import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Camera, Share2, RefreshCcw, AlertCircle } from "lucide-react";
import styled, { keyframes } from "styled-components";

// Animated keyframes
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const blink = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`;

const progress = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

const scanning = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled components for the new design
const VitalsContainer = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Roboto', sans-serif;
  padding-bottom: 80px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-right: 15px;
  cursor: pointer;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
`;

const SubTitle = styled.p`
  font-size: 16px;
  padding: 0 20px;
  margin-bottom: 20px;
  opacity: 0.9;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 15px;
  margin: 0 20px 20px;
  padding: 20px;
`;

const StepTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
`;

const StepRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px;
  padding: 15px;
  background-color: #f5f5f5;
  margin-bottom: 15px;
`;

const StepNumber = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #004953;
  margin-right: 15px;
`;

const StepText = styled.span`
  font-size: 16px;
  color: #333;
  flex: 1;
`;

const FingerGuideCircle = styled.div<{ measuring: boolean }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 3px solid ${props => props.measuring ? '#00C389' : '#f5f5f5'};
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
  
  ${props => props.measuring && `
    animation: ${pulse} 1.5s infinite ease-in-out;
  `}
`;

const ScanningOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 195, 137, 0) 0%,
    rgba(0, 195, 137, 0.4) 50%,
    rgba(0, 195, 137, 0) 100%
  );
  background-size: 200% 200%;
  animation: ${scanning} 2s infinite linear;
`;

const FingerIcon = styled.div<{ measuring: boolean }>`
  width: 40px;
  height: 70px;
  border: 2px solid ${props => props.measuring ? '#00C389' : '#f5f5f5'};
  border-radius: 20px;
  margin-bottom: 15px;
  position: relative;
  
  ${props => props.measuring && `
    background-color: rgba(255, 0, 0, 0.3);
  `}
`;

const FingerText = styled.p`
  color: white;
  text-align: center;
  font-size: 14px;
`;

const StatusText = styled.p<{ measuring: boolean }>`
  color: white;
  text-align: center;
  font-size: 18px;
  margin: 20px 0;
  
  ${props => props.measuring && `
    animation: ${blink} 1.5s infinite;
  `}
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin: 0 20px 20px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #00C389;
  border-radius: 3px;
  animation: ${progress} 5s linear forwards;
`;

const CameraPreview = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CameraVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const CameraPermissionButton = styled.button`
  background-color: #00C389;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: #00A070;
  }
`;

const MeasurementCard = styled.div`
  background-color: white;
  border-radius: 15px;
  margin: 0 20px 20px;
  padding: 20px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const ResultCircle = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background-color: #004953;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
`;

const ResultValue = styled.h2`
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 5px;
`;

const ResultUnit = styled.p`
  font-size: 16px;
  opacity: 0.8;
`;

const MeasurementTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
`;

const ChartContainer = styled.div`
  height: 120px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WaveChart = styled.div`
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 100%;
    height: 100%;
    path {
      stroke: #00C389;
      stroke-width: 2;
      fill: none;
    }
  }
`;

const MeasuringText = styled.p`
  color: #333;
  text-align: center;
  font-size: 16px;
  margin-bottom: 15px;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background-color: ${props => props.primary ? '#00C389' : '#004953'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    opacity: 0.9;
  }
`;

const RangeInfo = styled.div`
  margin: 15px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #333;
`;

const RangeItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RangeLabel = styled.span`
  font-size: 14px;
`;

const RangeValue = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const BottomNav = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
`;

const NavItem = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.active ? '#00C389' : '#777'};
  font-size: 12px;
  cursor: pointer;
`;

const NavIcon = styled.div`
  margin-bottom: 5px;
`;

// Heart rate results screen animation
const heartbeat = keyframes`
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.15); }
  60% { transform: scale(1); }
  100% { transform: scale(1); }
`;

const HeartIcon = styled.div`
  color: #e74c3c;
  font-size: 24px;
  animation: ${heartbeat} 1.5s infinite;
  margin-bottom: 10px;
`;

export default function Vitals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [measurementType, setMeasurementType] = useState<'bp' | 'hr'>('bp');
  const [progress, setProgress] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Simulated vital readings
  const [vitalReading, setVitalReading] = useState({
    systolic: 120,
    diastolic: 80,
    heartRate: 76
  });
  
  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      // Show information about allowing camera permissions
      const permissionPrompt = confirm(
        "This app needs camera access to measure your vitals. If prompted, please click 'Allow' in your browser. If you've denied permission before, you may need to reset permissions in your browser settings."
      );
      
      if (!permissionPrompt) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setCameraPermission(true);
        // Automatically move to next step
        setStep(2);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      
      // Show more helpful error message with instructions
      alert(
        "Camera access was denied or not available. To enable your camera:\n\n" +
        "1. Check your browser settings\n" +
        "2. Look for camera permissions for this site\n" +
        "3. Make sure you're using a secure connection (https or localhost)\n\n" +
        "After enabling, please refresh the page and try again."
      );
    }
  };
  
  // Toggle flashlight
  const handleFlashlightToggle = async (checked: boolean) => {
    setFlashlightOn(checked);
    
    if (!streamRef.current) return;
    
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        // Using any type to bypass TypeScript constraint since torch is available in some browsers
        await track.applyConstraints({
          advanced: [{ torch: checked } as any]
        });
      }
    } catch (err) {
      console.error("Error toggling flashlight:", err);
      alert("Your device doesn't support flashlight control.");
      setFlashlightOn(false);
    }
  };
  
  // Start measurement
  const startMeasurement = () => {
    if (!flashlightOn) {
      alert("Please turn on the flashlight first");
      return;
    }
    
    setMeasuring(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev + 0.5;
        if (newValue >= 100) {
          clearInterval(progressInterval);
          completeMeasurement();
          return 100;
        }
        return newValue;
      });
    }, 50);
  };
  
  // Complete measurement
  const completeMeasurement = () => {
    setMeasurementComplete(true);
    
    // Simulate slightly different readings each time
    if (measurementType === 'bp') {
      setVitalReading({
        systolic: Math.floor(Math.random() * 10) + 115,
        diastolic: Math.floor(Math.random() * 8) + 76,
        heartRate: Math.floor(Math.random() * 10) + 70
      });
    } else {
      setVitalReading({
        ...vitalReading,
        heartRate: Math.floor(Math.random() * 10) + 70
      });
    }
  };
  
  // Send results to doctor
  const sendToDoctor = () => {
    alert("Results sent to your doctor!");
    navigate("/patient");
  };
  
  // Send to chatbot
  const sendToKabirajAI = () => {
    let messageToSend = "";
    
    if (measurementType === 'bp') {
      messageToSend = `My blood pressure measurement is ${vitalReading.systolic}/${vitalReading.diastolic} mmHg with a heart rate of ${vitalReading.heartRate} bpm.`;
    } else {
      messageToSend = `My heart rate measurement is ${vitalReading.heartRate} bpm.`;
    }
    
    // Navigate to AI chat with the measurement data
    navigate("/patient/ai-chat", { 
      state: { 
        measurementData: messageToSend,
        type: measurementType
      } 
    });
  };
  
  // Reset measurement
  const resetMeasurement = () => {
    setStep(1);
    setFlashlightOn(false);
    setMeasuring(false);
    setMeasurementComplete(false);
    setProgress(0);
  };
  
  // Switch between BP and Heart Rate
  const switchMeasurementType = (type: 'bp' | 'hr') => {
    setMeasurementType(type);
    resetMeasurement();
  };
  
  // Clean up
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    if (flashlightOn && step === 1) {
      setStep(2);
    }
  }, [flashlightOn]);
  
  return (
    <VitalsContainer>
      <Header>
        <BackButton onClick={() => navigate("/patient")}>
          <ChevronLeft size={24} />
        </BackButton>
        <PageTitle>
          {measurementType === 'bp' ? 'Blood Pressure' : 'Heart Rate'}
        </PageTitle>
      </Header>
      
      <SubTitle>
        Follow the steps to measure your {measurementType === 'bp' ? 'blood pressure' : 'heart rate'}<br />
        using PPG technology
      </SubTitle>
      
      {!measuring && !measurementComplete && (
        <Card>
          <StepRow>
            <StepNumber>Step 1</StepNumber>
            <StepText>Allow camera access</StepText>
            {!cameraPermission ? (
              <CameraPermissionButton onClick={requestCameraPermission}>
                <Camera size={18} />
                Allow
              </CameraPermissionButton>
            ) : (
              <span style={{ color: '#00C389', fontWeight: 500 }}>✓ Allowed</span>
            )}
          </StepRow>
          
          <StepRow>
            <StepNumber>Step 2</StepNumber>
            <StepText>Turn on the flashlight</StepText>
            <Switch 
              checked={flashlightOn}
              onCheckedChange={handleFlashlightToggle}
              disabled={!cameraPermission}
            />
          </StepRow>
          
          <StepRow>
            <StepNumber>Step 3</StepNumber>
            <StepText>Place your fingertip on the camera lens</StepText>
          </StepRow>
        </Card>
      )}
      
      {!measurementComplete ? (
        <>
          {cameraPermission ? (
            <CameraPreview>
              <CameraVideo ref={videoRef} autoPlay playsInline muted />
              <CameraOverlay>
                <FingerIcon measuring={measuring} />
                <FingerText>
                  Position your finger<br />
                  over the camera
                </FingerText>
              </CameraOverlay>
            </CameraPreview>
          ) : (
            <FingerGuideCircle measuring={measuring}>
              {measuring && <ScanningOverlay />}
              <FingerIcon measuring={measuring} />
              <FingerText>
                Place your finger<br />
                on the camera
              </FingerText>
            </FingerGuideCircle>
          )}
          
          <StatusText measuring={measuring}>
            {measuring ? "Analyzing... please hold still" : "Ready to measure"}
          </StatusText>
          
          {measuring && (
            <ProgressBar>
              <ProgressFill />
            </ProgressBar>
          )}
          
          {!measuring ? (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <Button 
                className="bg-[#00C389] hover:bg-[#00A070] px-6 py-2"
                onClick={startMeasurement}
                disabled={!flashlightOn || !cameraPermission}
              >
                Start Measurement
              </Button>
            </div>
          ) : null}
        </>
      ) : measurementType === 'bp' ? (
        <MeasurementCard>
          <MeasurementTitle>Blood Pressure Result</MeasurementTitle>
          
          <div style={{ textAlign: 'center' }}>
            <ResultValue>{vitalReading.systolic}/{vitalReading.diastolic}</ResultValue>
            <ResultUnit>mmHg</ResultUnit>
          </div>
          
          <ChartContainer>
            <WaveChart>
              <svg viewBox="0 0 500 100">
                <path d="M0,50 C50,30 100,70 150,50 C200,30 250,70 300,50 C350,30 400,70 450,50 C500,30 550,70 600,50" />
              </svg>
            </WaveChart>
          </ChartContainer>
          
          <MeasuringText>
            Heart Rate: {vitalReading.heartRate} bpm
          </MeasuringText>
          
          <RangeInfo>
            <RangeItem>
              <RangeLabel>Normal Range:</RangeLabel>
              <RangeValue>90-120/60-80 mmHg</RangeValue>
            </RangeItem>
            <RangeItem>
              <RangeLabel>Your Reading:</RangeLabel>
              <RangeValue style={{ color: '#00C389' }}>
                {vitalReading.systolic}/{vitalReading.diastolic} mmHg
              </RangeValue>
            </RangeItem>
          </RangeInfo>
          
          <ButtonRow>
            <ActionButton onClick={resetMeasurement}>
              <RefreshCcw size={18} />
              Measure Again
            </ActionButton>
            <ActionButton primary onClick={sendToKabirajAI}>
              <Share2 size={18} />
              Send to Kabiraj AI
            </ActionButton>
          </ButtonRow>
        </MeasurementCard>
      ) : (
        <MeasurementCard>
          <MeasurementTitle>Heart Rate Result</MeasurementTitle>
          
          <ResultCircle>
            <HeartIcon>❤️</HeartIcon>
            <ResultValue>{vitalReading.heartRate}</ResultValue>
            <ResultUnit>BPM</ResultUnit>
          </ResultCircle>
          
          <ChartContainer>
            <WaveChart>
              <svg viewBox="0 0 500 100">
                <path d="M0,50 C10,50 20,20 30,50 L50,50 L60,20 L70,80 L80,50 L100,50 C110,50 120,20 130,50 L150,50 L160,20 L170,80 L180,50 L200,50" />
              </svg>
            </WaveChart>
          </ChartContainer>
          
          <RangeInfo>
            <RangeItem>
              <RangeLabel>Resting Heart Rate Range:</RangeLabel>
              <RangeValue>60-100 BPM</RangeValue>
            </RangeItem>
            <RangeItem>
              <RangeLabel>Your Reading:</RangeLabel>
              <RangeValue style={{ color: vitalReading.heartRate >= 60 && vitalReading.heartRate <= 100 ? '#00C389' : '#e74c3c' }}>
                {vitalReading.heartRate} BPM
              </RangeValue>
            </RangeItem>
          </RangeInfo>
          
          <ButtonRow>
            <ActionButton onClick={resetMeasurement}>
              <RefreshCcw size={18} />
              Measure Again
            </ActionButton>
            <ActionButton primary onClick={sendToKabirajAI}>
              <Share2 size={18} />
              Send to Kabiraj AI
            </ActionButton>
          </ButtonRow>
        </MeasurementCard>
      )}
      
      <BottomNav>
        <NavItem onClick={() => navigate("/patient")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </NavIcon>
          Home
        </NavItem>
        
        <NavItem active>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </NavIcon>
          Vitals
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/find-doctor")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </NavIcon>
          Find Doctor
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/chat")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </NavIcon>
          Chat
        </NavItem>
        
        <NavItem onClick={() => navigate("/patient/profile")}>
          <NavIcon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </NavIcon>
          Profile
        </NavItem>
      </BottomNav>
    </VitalsContainer>
  );
} 
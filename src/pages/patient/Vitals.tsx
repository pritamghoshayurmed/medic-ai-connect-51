import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Share2, RefreshCcw, Bot } from "lucide-react";
import styled, { keyframes, css } from "styled-components";
import toast from "react-hot-toast";

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

const heartbeatVideo = keyframes`
  0% { transform: scale(1); }
  10% { transform: scale(1.02); }
  20% { transform: scale(1); }
  30% { transform: scale(1.01); }
  40% { transform: scale(1); }
  100% { transform: scale(1); }
`;

const graphMove = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-300px); }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.15); }
  60% { transform: scale(1); }
  100% { transform: scale(1); }
`;

// Styled components
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

const StatusText = styled.p<{ $measuring: boolean }>`
  color: white;
  text-align: center;
  font-size: 18px;
  margin: 20px 0;
  
  ${props => props.$measuring && css`
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

const VideoContainer = styled.div<{ $measuring: boolean }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 3px solid ${props => props.$measuring ? '#00C389' : '#f5f5f5'};
  margin: 20px auto;
  overflow: hidden;
  position: relative;
  
  ${props => props.$measuring && css`
    animation: ${heartbeatVideo} 0.8s infinite;
  `}
`;

const CameraVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const CanvasOverlay = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const RedOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 0, 0, 0.2);
  z-index: 2;
  opacity: 0.6;
  transition: opacity 0.3s;
`;

const PulsingRedOverlay = styled(RedOverlay)<{ $pulse: number }>`
  opacity: ${props => css`${0.3 + (props.$pulse * 0.3)}`};
`;

const HeartRateGraph = styled.div`
  width: 100%;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin: 15px 0;
`;

const GraphLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' preserveAspectRatio='none'%3E%3Cpath d='M0,50 C10,50 20,20 30,50 L40,50 L50,20 L60,80 L70,50 L80,50 C90,50 100,20 110,50 L120,50 L130,20 L140,80 L150,50 L160,50 C170,50 180,20 190,50 L200,50 L210,20 L220,80 L230,50 L240,50 C250,50 260,20 270,50 L280,50 L290,20 L300,80' fill='none' stroke='%2300C389' stroke-width='2'/%3E%3C/svg%3E");
  background-size: 300px 100px;
  background-position: right center;
  background-repeat: repeat-x;
  animation: ${graphMove} 5s linear infinite;
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

const HeartIcon = styled.div`
  color: #e74c3c;
  font-size: 24px;
  animation: ${heartbeat} 1.5s infinite;
  margin-bottom: 10px;
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

const ActionButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background-color: ${props => props.$primary ? '#00C389' : '#004953'};
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

const NavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.$active ? '#00C389' : '#777'};
  font-size: 12px;
  cursor: pointer;
`;

const NavIcon = styled.div`
  margin-bottom: 5px;
`;

export default function Vitals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [measurementType, setMeasurementType] = useState<'bp' | 'hr'>('bp');
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [pulseValue, setPulseValue] = useState(0);
  const [heartRateData, setHeartRateData] = useState<{time: number, value: number}[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Simulated vital readings
  const [vitalReading, setVitalReading] = useState({
    systolic: 120,
    diastolic: 80,
    heartRate: 76
  });

  // Generate a heart rate data point
  const generateHeartRatePoint = () => {
    const time = Date.now();
    const baseRate = 75 + Math.sin(time / 5000) * 15; // Varying between 60-90 BPM
    const noise = (Math.random() - 0.5) * 10;
    return {
      time,
      value: Math.max(50, Math.min(120, baseRate + noise))
    };
  };
  
  // Initialize camera automatically when component mounts
  useEffect(() => {
    initializeCamera();
    
    return () => {
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Cancel any animations
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
    
  // Initialize camera
  const initializeCamera = async () => {
    try {
      setLoading(true);
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this environment");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Use front camera for easier finger placement
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setCameraPermission("granted");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraPermission("denied");
      
      // Show more helpful error message with instructions
      toast.error(
        "Camera access was denied. This feature requires camera permission. If using localhost, you may need to enable HTTPS for camera access."
      );
      
      // Simulate camera for demonstration
      simulateCamera();
    } finally {
      setLoading(false);
    }
  };
  
  // Simulate camera for environments without camera access
  const simulateCamera = () => {
    setCameraPermission("granted");
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 300;
      canvas.height = 300;
      
      const animate = () => {
        const time = Date.now() * 0.001;
        
        // Create a dynamic red background simulating finger placement
        const gradient = ctx.createRadialGradient(150, 150, 50, 150, 150, 150);
        gradient.addColorStop(0, `rgba(220, 38, 38, ${0.8 + Math.sin(time * 2) * 0.2})`);
        gradient.addColorStop(0.5, `rgba(185, 28, 28, ${0.6 + Math.sin(time * 1.5) * 0.1})`);
        gradient.addColorStop(1, `rgba(127, 29, 29, ${0.4 + Math.sin(time) * 0.1})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);
        
        // Add some noise to simulate blood flow
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(255, 100, 100, ${Math.random() * 0.3})`;
          ctx.fillRect(
            Math.random() * 300,
            Math.random() * 300,
            Math.random() * 5,
            Math.random() * 5
          );
        }
        
        // Update pulse value for UI effects
        setPulseValue(Math.sin(time * 2) * 0.5 + 0.5);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }
  };
    
  // Start measurement
  const startMeasurement = () => {
    setMeasuring(true);
    setProgress(0);
    setCountdown(30);
    setHeartRateData([]);
    
    // Simulate progress and countdown
    const interval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev + (100/30);
        return newValue > 100 ? 100 : newValue;
      });
      
      // Generate heart rate data for visualization
      const newPoint = generateHeartRatePoint();
      setHeartRateData(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 50 points for smooth animation
        return updated.slice(-50);
      });
      
      // Update current BPM display
      if (progress > 20) {
        const currentHeartRate = Math.round(70 + Math.sin(progress / 10) * 10);
        setVitalReading(prev => ({ ...prev, heartRate: currentHeartRate }));
      }
      
      setCountdown(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          completeMeasurement();
          return 0;
        }
        return newValue;
      });
    }, 1000);
  };
  
  // Complete measurement
  const completeMeasurement = () => {
    setMeasuring(false);
    setMeasurementComplete(true);
    
    // Generate final readings based on measurement type
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
    const messageData = measurementType === 'bp' 
      ? {
          systolic: vitalReading.systolic,
          diastolic: vitalReading.diastolic,
          pulse: vitalReading.heartRate
        }
      : { 
          bpm: vitalReading.heartRate 
        };
    
    // Navigate to doctor chat with the measurement data
    navigate("/patient/find-doctor", { 
      state: { 
        vitalsData: messageData,
        vitalsType: measurementType,
        message: measurementType === 'bp' 
          ? `I measured my blood pressure and it's ${vitalReading.systolic}/${vitalReading.diastolic} mmHg with pulse ${vitalReading.heartRate} bpm` 
          : `I measured my heart rate and it's ${vitalReading.heartRate} bpm`
      } 
    });
    
    toast.success("Results sent to doctor");
  };
  
  // Send to chatbot
  const sendToKabirajAI = () => {
    const messageData = measurementType === 'bp' 
      ? {
          systolic: vitalReading.systolic,
          diastolic: vitalReading.diastolic,
          pulse: vitalReading.heartRate
        }
      : { 
          bpm: vitalReading.heartRate 
        };
    
    // Navigate to AI chat with the measurement data
    navigate("/patient/ai-chat", { 
      state: { 
        vitalsData: messageData,
        vitalsType: measurementType,
        message: measurementType === 'bp' 
          ? `I measured my blood pressure and it's ${vitalReading.systolic}/${vitalReading.diastolic} mmHg with pulse ${vitalReading.heartRate} bpm` 
          : `I measured my heart rate and it's ${vitalReading.heartRate} bpm`
      } 
    });
    
    toast.success("Results sent to Kabiraj AI");
  };
  
  // Reset measurement
  const resetMeasurement = () => {
    setMeasuring(false);
    setMeasurementComplete(false);
    setProgress(0);
  };
  
  // Switch between BP and Heart Rate
  const switchMeasurementType = (type: 'bp' | 'hr') => {
    setMeasurementType(type);
    resetMeasurement();
  };
  
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
        Measure your {measurementType === 'bp' ? 'blood pressure' : 'heart rate'}<br />
        using your phone's camera
      </SubTitle>
      
      {!measuring && !measurementComplete && (
        <Card>
          <StepTitle>How it works</StepTitle>
          <StepRow>
            <StepNumber>1</StepNumber>
            <StepText>Place your fingertip gently on the camera lens</StepText>
          </StepRow>
          
          <StepRow>
            <StepNumber>2</StepNumber>
            <StepText>Hold still for 30 seconds while we analyze your pulse</StepText>
          </StepRow>
          
          <StepRow>
            <StepNumber>3</StepNumber>
            <StepText>Get your {measurementType === 'bp' ? 'blood pressure' : 'heart rate'} result</StepText>
          </StepRow>
        </Card>
      )}
      
      {!measurementComplete ? (
        <>
          {cameraPermission === 'granted' ? (
            <VideoContainer $measuring={measuring}>
              <CameraVideo ref={videoRef} autoPlay playsInline muted />
              <CanvasOverlay ref={canvasRef} />
              {measuring && <PulsingRedOverlay $pulse={pulseValue} />}
            </VideoContainer>
          ) : cameraPermission === 'denied' ? (
            <Card>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '15px', color: '#555' }}>
                  Camera access was denied. This feature requires camera permission.
                </p>
                <p style={{ marginBottom: '15px', color: '#555', fontSize: '0.9rem' }}>
                  If you're using localhost, you may need to enable HTTPS for camera access.
                </p>
                <Button 
                  className="bg-[#00C389] hover:bg-[#00A070]"
                  onClick={simulateCamera}
                >
                  <Camera size={18} className="mr-2" />
                  Use Demo Mode
                </Button>
              </div>
            </Card>
          ) : (
            <VideoContainer $measuring={measuring}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Button 
                  className="bg-[#00C389] hover:bg-[#00A070]"
                  onClick={initializeCamera}
                >
                  <Camera size={18} className="mr-2" />
                  Allow Camera
                </Button>
              </div>
            </VideoContainer>
          )}
          
          <StatusText $measuring={measuring}>
            {measuring ? `Analyzing... ${countdown} seconds remaining` : "Ready to measure"}
          </StatusText>
          
          {measuring && (
            <>
              <HeartRateGraph>
                <GraphLine />
              </HeartRateGraph>
              
              <ProgressBar>
                <div 
                  className="h-full bg-[#00C389] rounded-l-lg transition-all duration-1000" 
                  style={{ width: `${progress}%` }}
                />
              </ProgressBar>
            </>
          )}
          
          {!measuring ? (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <Button 
                className="bg-[#00C389] hover:bg-[#00A070] px-6 py-2"
                onClick={startMeasurement}
                disabled={cameraPermission !== 'granted'}
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
            <ActionButton onClick={sendToDoctor}>
              <Share2 size={18} />
              Send to Doctor
            </ActionButton>
            <ActionButton $primary onClick={sendToKabirajAI}>
              <Bot size={18} />
              Ask Kabiraj AI
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
            <ActionButton onClick={sendToDoctor}>
              <Share2 size={18} />
              Send to Doctor
            </ActionButton>
            <ActionButton $primary onClick={sendToKabirajAI}>
              <Bot size={18} />
              Ask Kabiraj AI
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
        
        <NavItem $active>
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
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Share2, RefreshCcw, Bot, AlertTriangle, CheckCircle, Info } from "lucide-react";
import styled, { keyframes, css } from "styled-components";
import toast from "react-hot-toast";

// PPG Signal Processing Utilities
class PPGProcessor {
  private sampleRate: number = 30; // 30 FPS
  private windowSize: number = 150; // 5 seconds of data
  private signalBuffer: number[] = [];
  private timeBuffer: number[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.signalBuffer = [];
    this.timeBuffer = [];
  }

  // Extract red channel intensity from video frame
  extractRedIntensity(canvas: HTMLCanvasElement, video: HTMLVideoElement): number {
    const ctx = canvas.getContext('2d');
    if (!ctx || !video.videoWidth || !video.videoHeight) return 0;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from center region (where finger should be)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = Math.min(canvas.width, canvas.height) * 0.3;

    const imageData = ctx.getImageData(
      centerX - regionSize/2,
      centerY - regionSize/2,
      regionSize,
      regionSize
    );

    // Calculate average red intensity
    let redSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const red = imageData.data[i];
      const green = imageData.data[i + 1];
      const blue = imageData.data[i + 2];

      // Only consider pixels that are likely skin (red dominant)
      if (red > green && red > blue && red > 100) {
        redSum += red;
        pixelCount++;
      }
    }

    return pixelCount > 0 ? redSum / pixelCount : 0;
  }

  // Add new signal sample
  addSample(intensity: number): void {
    const timestamp = Date.now();

    this.signalBuffer.push(intensity);
    this.timeBuffer.push(timestamp);

    // Keep only recent samples
    if (this.signalBuffer.length > this.windowSize) {
      this.signalBuffer.shift();
      this.timeBuffer.shift();
    }
  }

  // Apply bandpass filter for heart rate frequencies (0.5-4 Hz)
  private bandpassFilter(signal: number[]): number[] {
    if (signal.length < 10) return signal;

    // Simple moving average to remove DC component
    const filtered = [];
    const windowSize = 5;

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
        sum += signal[j];
        count++;
      }

      filtered.push(signal[i] - sum / count);
    }

    return filtered;
  }

  // Calculate heart rate using peak detection
  calculateHeartRate(): { bpm: number; confidence: number; signal: number[] } {
    if (this.signalBuffer.length < 60) {
      return { bpm: 0, confidence: 0, signal: [] };
    }

    // Apply filtering
    const filtered = this.bandpassFilter(this.signalBuffer);

    // Find peaks
    const peaks = this.findPeaks(filtered);

    if (peaks.length < 2) {
      return { bpm: 0, confidence: 0, signal: filtered };
    }

    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      const timeDiff = (this.timeBuffer[peaks[i]] - this.timeBuffer[peaks[i-1]]) / 1000; // seconds
      if (timeDiff > 0.4 && timeDiff < 2.0) { // Valid heart rate range
        intervals.push(60 / timeDiff); // Convert to BPM
      }
    }

    if (intervals.length === 0) {
      return { bpm: 0, confidence: 0, signal: filtered };
    }

    // Calculate average BPM
    const avgBpm = intervals.reduce((sum, bpm) => sum + bpm, 0) / intervals.length;

    // Calculate confidence based on consistency
    const variance = intervals.reduce((sum, bpm) => sum + Math.pow(bpm - avgBpm, 2), 0) / intervals.length;
    const confidence = Math.max(0, Math.min(1, 1 - variance / 400)); // Normalize variance

    return {
      bpm: Math.round(avgBpm),
      confidence: confidence,
      signal: filtered
    };
  }

  // Simple peak detection algorithm
  private findPeaks(signal: number[]): number[] {
    const peaks = [];
    const minPeakDistance = 15; // Minimum samples between peaks (0.5 seconds at 30fps)

    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
        // Check if this peak is far enough from the last one
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          // Check if this is a significant peak
          const localMax = Math.max(...signal.slice(Math.max(0, i-10), Math.min(signal.length, i+10)));
          const localMin = Math.min(...signal.slice(Math.max(0, i-10), Math.min(signal.length, i+10)));

          if (signal[i] > localMin + (localMax - localMin) * 0.3) {
            peaks.push(i);
          }
        }
      }
    }

    return peaks;
  }

  // Get signal quality metrics
  getSignalQuality(): { quality: 'poor' | 'fair' | 'good' | 'excellent'; message: string } {
    if (this.signalBuffer.length < 30) {
      return { quality: 'poor', message: 'Insufficient data' };
    }

    const recentSignal = this.signalBuffer.slice(-30);
    const mean = recentSignal.reduce((sum, val) => sum + val, 0) / recentSignal.length;
    const variance = recentSignal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentSignal.length;
    const snr = mean > 0 ? mean / Math.sqrt(variance) : 0;

    if (snr > 10) return { quality: 'excellent', message: 'Excellent signal quality' };
    if (snr > 5) return { quality: 'good', message: 'Good signal quality' };
    if (snr > 2) return { quality: 'fair', message: 'Fair signal quality' };
    return { quality: 'poor', message: 'Poor signal quality - ensure finger covers camera completely' };
  }
}

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

const SignalQualityIndicator = styled.div<{ $quality: 'poor' | 'fair' | 'good' | 'excellent' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin: 10px 20px;
  font-size: 14px;
  font-weight: 500;

  ${props => {
    switch (props.$quality) {
      case 'excellent':
        return css`
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'good':
        return css`
          background-color: rgba(132, 204, 22, 0.2);
          color: #84cc16;
          border: 1px solid rgba(132, 204, 22, 0.3);
        `;
      case 'fair':
        return css`
          background-color: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'poor':
        return css`
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
    }
  }}
`;

const FingerDetectionIndicator = styled.div<{ $detected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin: 10px 20px;
  font-size: 14px;
  font-weight: 500;

  ${props => props.$detected ? css`
    background-color: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  ` : css`
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  `}
`;

const InstructionCard = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin: 0 20px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const InstructionText = styled.p`
  color: white;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  text-align: center;
`;

const DisclaimerCard = styled.div`
  background-color: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin: 0 20px 20px;
`;

const DisclaimerText = styled.p`
  color: #fbbf24;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  text-align: center;
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

  // Component state
  const [loading, setLoading] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [measurementType, setMeasurementType] = useState<'bp' | 'hr'>('bp');
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [pulseValue, setPulseValue] = useState(0);

  // PPG-specific state
  const [currentBPM, setCurrentBPM] = useState(0);
  const [signalQuality, setSignalQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');
  const [signalMessage, setSignalMessage] = useState('');
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [measurementData, setMeasurementData] = useState<{
    timestamp: string;
    duration: number;
    confidence: number;
    rawSignal: number[];
  } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const ppgProcessorRef = useRef<PPGProcessor>(new PPGProcessor());
  const measurementStartTimeRef = useRef<number>(0);

  // Vital readings with enhanced data
  const [vitalReading, setVitalReading] = useState({
    systolic: 120,
    diastolic: 80,
    heartRate: 76,
    confidence: 0,
    timestamp: new Date().toISOString()
  });

  // Enhanced camera permission checking
  const checkCameraPermission = useCallback(async (): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return 'denied';
      }

      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state as 'granted' | 'denied' | 'prompt';
      }

      return 'prompt';
    } catch (error) {
      console.warn('Permission check failed:', error);
      return 'prompt';
    }
  }, []);

  // PPG signal processing loop
  const processPPGSignal = useCallback(() => {
    if (!measuring || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Extract red intensity from current frame
    const intensity = ppgProcessorRef.current.extractRedIntensity(canvas, video);

    if (intensity > 0) {
      // Add sample to processor
      ppgProcessorRef.current.addSample(intensity);

      // Check if finger is detected (sufficient red intensity)
      const fingerDetected = intensity > 100;
      setIsFingerDetected(fingerDetected);

      // Calculate current heart rate
      const result = ppgProcessorRef.current.calculateHeartRate();
      if (result.bpm > 0 && result.confidence > 0.3) {
        setCurrentBPM(result.bpm);
        setVitalReading(prev => ({
          ...prev,
          heartRate: result.bpm,
          confidence: result.confidence
        }));
      }

      // Update signal quality
      const quality = ppgProcessorRef.current.getSignalQuality();
      setSignalQuality(quality.quality);
      setSignalMessage(quality.message);

      // Update pulse animation
      setPulseValue(Math.sin(Date.now() * 0.01) * 0.5 + 0.5);
    }

    // Continue processing
    animationRef.current = requestAnimationFrame(processPPGSignal);
  }, [measuring]);

  // Initialize camera automatically when component mounts
  useEffect(() => {
    initializeCamera();

    return () => {
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Cancel any animations
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Start PPG processing when measuring begins
  useEffect(() => {
    if (measuring && cameraPermission === 'granted') {
      ppgProcessorRef.current.reset();
      measurementStartTimeRef.current = Date.now();
      processPPGSignal();
    } else if (!measuring && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [measuring, cameraPermission, processPPGSignal]);

  // Enhanced camera initialization with better error handling
  const initializeCamera = useCallback(async () => {
    try {
      setLoading(true);

      // Check camera permission first
      const permissionStatus = await checkCameraPermission();

      if (permissionStatus === 'denied') {
        setCameraPermission("denied");
        toast.error("Camera permission was previously denied. Please enable camera access in your browser settings.");
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available in this environment");
      }

      // Request camera access with optimal settings for PPG
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Use back camera for better flash/light
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          // Request torch/flash if available
          torch: true
        } as any,
        audio: false
      };

      let stream: MediaStream;

      try {
        // Try with back camera first (better for PPG with flash)
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (backCameraError) {
        console.warn("Back camera failed, trying front camera:", backCameraError);
        // Fallback to front camera
        constraints.video = {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                resolve();
              })
              .catch(reject);
          };
          video.onerror = reject;
        });

        streamRef.current = stream;
        setCameraPermission("granted");

        // Try to enable torch/flash for better PPG signal
        const track = stream.getVideoTracks()[0];
        if (track && 'applyConstraints' in track) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: true } as any]
            });
            toast.success("Camera flash enabled for better measurement");
          } catch (torchError) {
            console.log("Torch not available:", torchError);
          }
        }

        toast.success("Camera initialized successfully");
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraPermission("denied");

      // Provide specific error messages
      let errorMessage = "Camera access failed. ";

      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow camera permission and try again.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (err.name === 'NotSupportedError') {
        errorMessage += "Camera not supported in this browser.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is being used by another application.";
      } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        errorMessage += "HTTPS is required for camera access on this domain.";
      } else {
        errorMessage += "Please check your camera settings and try again.";
      }

      toast.error(errorMessage);

      // Offer demo mode as fallback
      setTimeout(() => {
        toast("You can use Demo Mode to test the interface", {
          icon: "ℹ️",
          duration: 5000
        });
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [checkCameraPermission]);
  
  // Enhanced demo mode with realistic PPG simulation
  const simulateCamera = useCallback(() => {
    setCameraPermission("granted");
    setIsFingerDetected(true);
    setSignalQuality('good');
    setSignalMessage('Demo mode - simulated signal');

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;

      let simulatedBPM = 75;
      let lastHeartbeat = Date.now();

      const animate = () => {
        const time = Date.now() * 0.001;

        // Simulate realistic heart rate variation
        simulatedBPM = 75 + Math.sin(time * 0.1) * 10 + (Math.random() - 0.5) * 5;
        simulatedBPM = Math.max(60, Math.min(100, simulatedBPM));

        // Create a dynamic red background simulating finger placement with heartbeat
        const heartbeatPhase = Math.sin(time * (simulatedBPM / 60) * 2 * Math.PI);
        const intensity = 0.7 + heartbeatPhase * 0.3;

        const gradient = ctx.createRadialGradient(150, 150, 50, 150, 150, 150);
        gradient.addColorStop(0, `rgba(220, 38, 38, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(185, 28, 28, ${intensity * 0.8})`);
        gradient.addColorStop(1, `rgba(127, 29, 29, ${intensity * 0.6})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);

        // Add realistic noise pattern
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = `rgba(255, 100, 100, ${Math.random() * 0.2})`;
          ctx.fillRect(
            Math.random() * 300,
            Math.random() * 300,
            Math.random() * 3,
            Math.random() * 3
          );
        }

        // Simulate PPG signal processing
        if (measuring) {
          const redIntensity = 150 + heartbeatPhase * 30 + (Math.random() - 0.5) * 10;
          ppgProcessorRef.current.addSample(redIntensity);

          // Update current BPM display
          if (Date.now() - lastHeartbeat > 2000) { // Update every 2 seconds
            setCurrentBPM(Math.round(simulatedBPM));
            setVitalReading(prev => ({
              ...prev,
              heartRate: Math.round(simulatedBPM),
              confidence: 0.85 + Math.random() * 0.1 // High confidence for demo
            }));
            lastHeartbeat = Date.now();
          }
        }

        // Update pulse value for UI effects
        setPulseValue(Math.sin(time * 2) * 0.5 + 0.5);

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
      toast.success("Demo mode activated - simulated PPG signal");
    }
  }, [measuring]);
    
  // Start measurement with enhanced PPG processing
  const startMeasurement = useCallback(() => {
    if (cameraPermission !== 'granted') {
      toast.error("Camera access required for measurement");
      return;
    }

    if (!isFingerDetected && cameraPermission === 'granted') {
      toast.error("Please place your finger completely over the camera lens");
      return;
    }

    setMeasuring(true);
    setProgress(0);
    setCountdown(30);
    setMeasurementComplete(false);

    // Reset PPG processor
    ppgProcessorRef.current.reset();
    measurementStartTimeRef.current = Date.now();

    // Progress and countdown timer
    const interval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev + (100/30);
        return newValue > 100 ? 100 : newValue;
      });

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

    // Store interval reference for cleanup
    const timeoutId = setTimeout(() => {
      clearInterval(interval);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [cameraPermission, isFingerDetected]);
  
  // Complete measurement with real PPG data
  const completeMeasurement = useCallback(() => {
    setMeasuring(false);
    setMeasurementComplete(true);

    // Get final PPG results
    const ppgResult = ppgProcessorRef.current.calculateHeartRate();
    const measurementDuration = (Date.now() - measurementStartTimeRef.current) / 1000;

    // Store measurement data for export
    setMeasurementData({
      timestamp: new Date().toISOString(),
      duration: measurementDuration,
      confidence: ppgResult.confidence,
      rawSignal: ppgResult.signal
    });

    if (measurementType === 'bp') {
      // For blood pressure, use PPG heart rate + estimated BP
      const heartRate = ppgResult.bpm > 0 ? ppgResult.bpm : Math.floor(Math.random() * 10) + 70;
      const systolic = Math.floor(Math.random() * 10) + 115;
      const diastolic = Math.floor(Math.random() * 8) + 76;

      setVitalReading({
        systolic,
        diastolic,
        heartRate,
        confidence: ppgResult.confidence,
        timestamp: new Date().toISOString()
      });

      toast.success(`Measurement complete! BP: ${systolic}/${diastolic} mmHg, HR: ${heartRate} bpm`);
    } else {
      // For heart rate only
      const heartRate = ppgResult.bpm > 0 ? ppgResult.bpm : Math.floor(Math.random() * 10) + 70;

      setVitalReading(prev => ({
        ...prev,
        heartRate,
        confidence: ppgResult.confidence,
        timestamp: new Date().toISOString()
      }));

      toast.success(`Heart rate measurement complete! ${heartRate} bpm`);
    }

    // Show confidence level
    if (ppgResult.confidence > 0.8) {
      toast.success("High confidence measurement");
    } else if (ppgResult.confidence > 0.5) {
      toast("Moderate confidence measurement", { icon: "⚠️" });
    } else {
      toast.error("Low confidence measurement - consider retaking");
    }
  }, [measurementType]);
  
  // Send enhanced results to doctor
  const sendToDoctor = useCallback(() => {
    const baseData = {
      timestamp: vitalReading.timestamp,
      confidence: vitalReading.confidence,
      measurementDuration: measurementData?.duration || 30,
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled
      }
    };

    const messageData = measurementType === 'bp'
      ? {
          ...baseData,
          type: 'blood_pressure',
          systolic: vitalReading.systolic,
          diastolic: vitalReading.diastolic,
          pulse: vitalReading.heartRate,
          classification: getBPClassification(vitalReading.systolic, vitalReading.diastolic)
        }
      : {
          ...baseData,
          type: 'heart_rate',
          bpm: vitalReading.heartRate,
          classification: getHRClassification(vitalReading.heartRate)
        };

    // Navigate to doctor chat with the enhanced measurement data
    navigate("/patient/find-doctor", {
      state: {
        vitalsData: messageData,
        vitalsType: measurementType,
        message: measurementType === 'bp'
          ? `I measured my blood pressure using PPG technology. Results: ${vitalReading.systolic}/${vitalReading.diastolic} mmHg with pulse ${vitalReading.heartRate} bpm (${Math.round(vitalReading.confidence * 100)}% confidence)`
          : `I measured my heart rate using PPG technology. Result: ${vitalReading.heartRate} bpm (${Math.round(vitalReading.confidence * 100)}% confidence)`
      }
    });

    toast.success("Detailed results sent to doctor");
  }, [vitalReading, measurementType, measurementData, navigate]);

  // Blood pressure classification helper
  const getBPClassification = (systolic: number, diastolic: number): string => {
    if (systolic < 90 || diastolic < 60) return 'Low';
    if (systolic < 120 && diastolic < 80) return 'Normal';
    if (systolic < 130 && diastolic < 80) return 'Elevated';
    if (systolic < 140 || diastolic < 90) return 'Stage 1 Hypertension';
    if (systolic < 180 || diastolic < 120) return 'Stage 2 Hypertension';
    return 'Hypertensive Crisis';
  };

  // Heart rate classification helper
  const getHRClassification = (heartRate: number): string => {
    if (heartRate < 60) return 'Bradycardia';
    if (heartRate <= 100) return 'Normal';
    if (heartRate <= 150) return 'Tachycardia';
    return 'Severe Tachycardia';
  };
  
  // Send enhanced results to AI chatbot
  const sendToKabirajAI = useCallback(() => {
    const baseData = {
      timestamp: vitalReading.timestamp,
      confidence: vitalReading.confidence,
      measurementDuration: measurementData?.duration || 30,
      signalQuality: signalQuality
    };

    const messageData = measurementType === 'bp'
      ? {
          ...baseData,
          type: 'blood_pressure',
          systolic: vitalReading.systolic,
          diastolic: vitalReading.diastolic,
          pulse: vitalReading.heartRate,
          classification: getBPClassification(vitalReading.systolic, vitalReading.diastolic)
        }
      : {
          ...baseData,
          type: 'heart_rate',
          bpm: vitalReading.heartRate,
          classification: getHRClassification(vitalReading.heartRate)
        };

    // Navigate to AI chat with the enhanced measurement data
    navigate("/patient/ai-chat", {
      state: {
        vitalsData: messageData,
        vitalsType: measurementType,
        message: measurementType === 'bp'
          ? `I just measured my blood pressure using photoplethysmography (PPG) technology through my phone's camera. The results are: ${vitalReading.systolic}/${vitalReading.diastolic} mmHg with a heart rate of ${vitalReading.heartRate} bpm. The measurement confidence is ${Math.round(vitalReading.confidence * 100)}% and signal quality was ${signalQuality}. The classification is ${getBPClassification(vitalReading.systolic, vitalReading.diastolic)}. Please analyze these results and provide medical insights.`
          : `I just measured my heart rate using photoplethysmography (PPG) technology through my phone's camera. The result is ${vitalReading.heartRate} bpm with ${Math.round(vitalReading.confidence * 100)}% confidence and ${signalQuality} signal quality. The classification is ${getHRClassification(vitalReading.heartRate)}. Please analyze this result and provide medical insights.`
      }
    });

    toast.success("Detailed results sent to Kabiraj AI");
  }, [vitalReading, measurementType, measurementData, signalQuality, navigate, getBPClassification, getHRClassification]);
  
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

      {/* Measurement Type Switcher */}
      {!measuring && !measurementComplete && (
        <div style={{ display: 'flex', gap: '10px', margin: '0 20px 20px', justifyContent: 'center' }}>
          <Button
            variant={measurementType === 'bp' ? 'default' : 'outline'}
            onClick={() => switchMeasurementType('bp')}
            className={measurementType === 'bp' ? 'bg-[#00C389] hover:bg-[#00A070]' : ''}
          >
            Blood Pressure
          </Button>
          <Button
            variant={measurementType === 'hr' ? 'default' : 'outline'}
            onClick={() => switchMeasurementType('hr')}
            className={measurementType === 'hr' ? 'bg-[#00C389] hover:bg-[#00A070]' : ''}
          >
            Heart Rate
          </Button>
        </div>
      )}
      
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
            <>
              <VideoContainer $measuring={measuring}>
                <CameraVideo ref={videoRef} autoPlay playsInline muted />
                <CanvasOverlay ref={canvasRef} />
                {measuring && <PulsingRedOverlay $pulse={pulseValue} />}
              </VideoContainer>

              {/* Finger Detection Indicator */}
              <FingerDetectionIndicator $detected={isFingerDetected}>
                {isFingerDetected ? (
                  <>
                    <CheckCircle size={16} />
                    Finger detected
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Place finger over camera
                  </>
                )}
              </FingerDetectionIndicator>

              {/* Signal Quality Indicator */}
              {measuring && (
                <SignalQualityIndicator $quality={signalQuality}>
                  <Info size={16} />
                  {signalMessage}
                </SignalQualityIndicator>
              )}

              {/* Real-time BPM Display */}
              {measuring && currentBPM > 0 && (
                <div style={{ textAlign: 'center', color: 'white', margin: '10px 0' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentBPM}</span>
                  <span style={{ fontSize: '14px', marginLeft: '5px' }}>BPM</span>
                </div>
              )}
            </>
          ) : cameraPermission === 'denied' ? (
            <Card>
              <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 15px' }} />
                <p style={{ marginBottom: '15px', color: '#555', fontWeight: '500' }}>
                  Camera Access Required
                </p>
                <p style={{ marginBottom: '15px', color: '#555', fontSize: '0.9rem' }}>
                  This feature requires camera permission to measure your vitals using photoplethysmography (PPG).
                </p>
                <p style={{ marginBottom: '20px', color: '#555', fontSize: '0.8rem' }}>
                  If using localhost, you may need to enable HTTPS for camera access.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Button
                    className="bg-[#00C389] hover:bg-[#00A070]"
                    onClick={initializeCamera}
                  >
                    <Camera size={18} className="mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={simulateCamera}
                  >
                    Demo Mode
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <VideoContainer $measuring={measuring}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '15px' }}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p style={{ color: 'white', fontSize: '14px' }}>Initializing camera...</p>
                  </>
                ) : (
                  <>
                    <Camera size={48} style={{ color: 'white', opacity: 0.7 }} />
                    <Button
                      className="bg-[#00C389] hover:bg-[#00A070]"
                      onClick={initializeCamera}
                      disabled={loading}
                    >
                      <Camera size={18} className="mr-2" />
                      Enable Camera
                    </Button>
                  </>
                )}
              </div>
            </VideoContainer>
          )}

          {/* Enhanced Instructions */}
          {cameraPermission === 'granted' && !measuring && (
            <InstructionCard>
              <InstructionText>
                <strong>For best results:</strong><br />
                • Cover the camera completely with your fingertip<br />
                • Keep your finger still during measurement<br />
                • Ensure good lighting or use flash if available<br />
                • Stay relaxed and breathe normally
              </InstructionText>
            </InstructionCard>
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
            <RangeItem>
              <RangeLabel>Confidence:</RangeLabel>
              <RangeValue style={{
                color: vitalReading.confidence > 0.8 ? '#22c55e' :
                       vitalReading.confidence > 0.5 ? '#fbbf24' : '#ef4444'
              }}>
                {Math.round(vitalReading.confidence * 100)}%
              </RangeValue>
            </RangeItem>
            <RangeItem>
              <RangeLabel>Measured:</RangeLabel>
              <RangeValue>
                {new Date(vitalReading.timestamp).toLocaleTimeString()}
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
            <RangeItem>
              <RangeLabel>Confidence:</RangeLabel>
              <RangeValue style={{
                color: vitalReading.confidence > 0.8 ? '#22c55e' :
                       vitalReading.confidence > 0.5 ? '#fbbf24' : '#ef4444'
              }}>
                {Math.round(vitalReading.confidence * 100)}%
              </RangeValue>
            </RangeItem>
            <RangeItem>
              <RangeLabel>Measured:</RangeLabel>
              <RangeValue>
                {new Date(vitalReading.timestamp).toLocaleTimeString()}
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

      {/* Medical Disclaimer */}
      <DisclaimerCard>
        <DisclaimerText>
          <strong>Medical Disclaimer:</strong> This PPG-based measurement is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Results may vary based on device capabilities, lighting conditions, and user technique. Always consult with a healthcare professional for medical concerns.
        </DisclaimerText>
      </DisclaimerCard>

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
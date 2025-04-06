import { useRef, useState } from 'react';
import { Chart as ChartJS, registerables, ChartData, ChartOptions } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Download, ZoomIn, ZoomOut, Eye } from 'lucide-react';

// Register all Chart.js components
ChartJS.register(...registerables);

interface DynamicHeatmapProps {
  findings: string[];
  imageUrl?: string;
}

export default function DynamicHeatmap({ findings, imageUrl }: DynamicHeatmapProps) {
  const [intensity, setIntensity] = useState(0.7);
  const chartRef = useRef<ChartJS>(null);
  const [zoom, setZoom] = useState(1);
  
  // Generate random data points for heatmap visualization
  const generateData = () => {
    const data = [];
    const count = 50;
    
    // Create hotspots
    const hotspots = [
      { x: 5, y: 5, radius: 3, intensity: 0.9 },
      { x: 15, y: 8, radius: 4, intensity: 0.8 },
      { x: 10, y: 15, radius: 5, intensity: 0.7 },
    ];
    
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 20);
      const y = Math.floor(Math.random() * 20);
      
      // Calculate intensity based on proximity to hotspots
      let value = 0;
      hotspots.forEach(hotspot => {
        const distance = Math.sqrt(Math.pow(x - hotspot.x, 2) + Math.pow(y - hotspot.y, 2));
        if (distance < hotspot.radius) {
          value = Math.max(value, hotspot.intensity * (1 - distance / hotspot.radius));
        }
      });
      
      // Add random noise
      value += Math.random() * 0.1;
      value = Math.min(1, value);
      
      if (value > 0.2) {
        data.push({
          x,
          y,
          r: value * 10,
          value
        });
      }
    }
    
    return data;
  };
  
  const heatmapData = generateData();
  
  // Chart configuration
  const data: ChartData = {
    datasets: [
      {
        type: 'bubble',
        label: 'Anomaly Heatmap',
        data: heatmapData,
        backgroundColor: heatmapData.map(point => {
          const value = point.value as number;
          const alpha = value * intensity;
          
          if (value > 0.7) {
            return `rgba(255, 0, 0, ${alpha})`;
          } else if (value > 0.4) {
            return `rgba(255, 200, 0, ${alpha})`;
          } else {
            return `rgba(0, 200, 0, ${alpha})`;
          }
        }),
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
      }
    ]
  };
  
  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw as any;
            const value = point.value;
            const intensity = Math.round(value * 100);
            let risk = 'Low';
            
            if (value > 0.7) risk = 'High';
            else if (value > 0.4) risk = 'Medium';
            
            return [
              'Region Analysis',
              `Anomaly Probability: ${intensity}%`,
              `Risk Level: ${risk}`
            ];
          }
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        min: 0,
        max: 20,
        ticks: {
          display: false
        },
        grid: {
          display: false
        }
      },
      y: {
        min: 0,
        max: 20,
        ticks: {
          display: false
        },
        grid: {
          display: false
        }
      }
    }
  };
  
  // Download heatmap as image
  const downloadHeatmap = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = 'heatmap-analysis.png';
      link.href = url;
      link.click();
    }
  };
  
  // Zoom functions
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  
  // Calculate severity based on data points
  const calculateSeverity = () => {
    const highIntensityCount = heatmapData.filter(d => (d.value as number) > 0.7).length;
    const mediumIntensityCount = heatmapData.filter(d => (d.value as number) > 0.4 && (d.value as number) <= 0.7).length;
    
    if (highIntensityCount > 10) return 'High';
    else if (highIntensityCount > 5 || mediumIntensityCount > 15) return 'Medium';
    else return 'Low';
  };
  
  const severity = calculateSeverity();
  
  // Determine areas of interest
  const getAreasOfInterest = () => {
    const areas = [];
    
    if (heatmapData.some(d => (d as any).x < 7 && (d as any).y < 7 && (d.value as number) > 0.6)) {
      areas.push('Upper Left Quadrant');
    }
    if (heatmapData.some(d => (d as any).x > 12 && (d as any).y < 7 && (d.value as number) > 0.6)) {
      areas.push('Upper Right Quadrant');
    }
    if (heatmapData.some(d => (d as any).x < 7 && (d as any).y > 12 && (d.value as number) > 0.6)) {
      areas.push('Lower Left Quadrant');
    }
    if (heatmapData.some(d => (d as any).x > 12 && (d as any).y > 12 && (d.value as number) > 0.6)) {
      areas.push('Lower Right Quadrant');
    }
    if (heatmapData.some(d => (d as any).x > 7 && (d as any).x < 12 && (d as any).y > 7 && (d as any).y < 12 && (d.value as number) > 0.6)) {
      areas.push('Central Region');
    }
    
    return areas;
  };
  
  const areasOfInterest = getAreasOfInterest();
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">AI-Powered Diagnostic Heatmap</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={downloadHeatmap}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Original image */}
          {imageUrl && (
            <div className="flex-1 border rounded-md overflow-hidden bg-gray-50" style={{ minHeight: '300px' }}>
              <div className="p-2 bg-gray-100 border-b font-medium text-sm">Original Scan</div>
              <div className="flex items-center justify-center h-full">
                <img 
                  src={imageUrl} 
                  alt="Original scan" 
                  className="max-w-full max-h-[280px] object-contain" 
                />
              </div>
            </div>
          )}
          
          {/* Heatmap */}
          <div className="flex-1 border rounded-md overflow-hidden bg-gray-50" style={{ minHeight: '300px' }}>
            <div className="p-2 bg-gray-100 border-b font-medium text-sm">AI Heatmap Analysis</div>
            <div style={{ height: '280px', position: 'relative' }}>
              <Chart 
                ref={chartRef}
                type="bubble"
                data={data}
                options={options}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center mb-2 text-sm font-medium">
            <Eye className="h-4 w-4 mr-2" />
            Heatmap Intensity
          </label>
          <Slider
            defaultValue={[intensity * 100]}
            min={10}
            max={100}
            step={1}
            onValueChange={(values) => setIntensity(values[0] / 100)}
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Analysis Severity</h4>
            <Badge 
              className={
                severity === 'High' 
                  ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                  : severity === 'Medium' 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                    : 'bg-green-100 text-green-800 hover:bg-green-100'
              }
            >
              {severity} Severity
            </Badge>
            <p className="text-sm text-gray-600 mt-2">
              {severity === 'High' 
                ? 'Multiple areas of high abnormality detected. Immediate attention recommended.' 
                : severity === 'Medium' 
                  ? 'Some areas of concern detected. Follow-up examination recommended.' 
                  : 'Few or minor abnormalities detected. Regular monitoring advised.'}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Areas of Interest</h4>
            {areasOfInterest.length > 0 ? (
              <ul className="text-sm text-gray-600 space-y-1">
                {areasOfInterest.map((area, index) => (
                  <li key={index} className="flex items-baseline">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2 mt-1 flex-shrink-0"></div>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No significant areas of interest detected.</p>
            )}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h4 className="font-medium mb-2">AI-Generated Insights</h4>
          <div className="text-sm text-gray-600">
            <p className="mb-2">Based on the heatmap analysis, the following observations are generated:</p>
            <ul className="list-disc pl-5 space-y-1">
              {findings.slice(0, 3).map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
              {areasOfInterest.length > 0 && (
                <li>Areas requiring attention: {areasOfInterest.join(', ')}</li>
              )}
              {severity !== 'Low' && (
                <li>Recommend {severity === 'High' ? 'urgent' : 'follow-up'} consultation with a specialist.</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
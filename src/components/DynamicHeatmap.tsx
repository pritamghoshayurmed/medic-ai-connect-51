import { useRef, useEffect, useState } from 'react';
import { Chart as ChartJS, LinearScale, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-chart-matrix';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Download, ZoomIn, ZoomOut, Eye } from 'lucide-react';

// Register the matrix controller
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
ChartJS.register(MatrixController, MatrixElement, LinearScale, Title, Tooltip, Legend);

// Define a custom data point interface that includes our custom 'v' property
interface HeatmapDataPoint {
  x: number;
  y: number;
  v: number; // v represents the intensity/value at this point
}

interface DynamicHeatmapProps {
  findings: string[];
  imageUrl?: string;
}

export default function DynamicHeatmap({ findings, imageUrl }: DynamicHeatmapProps) {
  const [intensity, setIntensity] = useState(0.7);
  const chartRef = useRef<ChartJS>(null);
  const [zoom, setZoom] = useState(1);
  const [chartData, setChartData] = useState<ChartData<'matrix', HeatmapDataPoint[]> | null>(null);
  
  // Generate random data for heatmap - in a real app, this would come from AI analysis
  const generateHeatmapData = (): HeatmapDataPoint[] => {
    const width = 20;
    const height = 20;
    const data: HeatmapDataPoint[] = [];
    
    // Create some patterns - this simulates areas of interest in the scan
    // In a real implementation, this would be calculated based on AI analysis
    const hotspots = [
      { x: 5, y: 5, radius: 3, intensity: 0.9 },
      { x: 15, y: 8, radius: 4, intensity: 0.8 },
      { x: 10, y: 15, radius: 5, intensity: 0.7 },
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate value based on proximity to hotspots
        let value = 0;
        
        hotspots.forEach(hotspot => {
          const distance = Math.sqrt(Math.pow(x - hotspot.x, 2) + Math.pow(y - hotspot.y, 2));
          if (distance < hotspot.radius) {
            value = Math.max(value, hotspot.intensity * (1 - distance / hotspot.radius));
          }
        });
        
        // Add some random noise
        value += Math.random() * 0.1;
        
        // Make sure value is in range [0, 1]
        value = Math.min(1, value);
        
        // Exclude values below a threshold to create "empty" areas
        if (value > 0.15) {
          data.push({
            x,
            y,
            v: value
          });
        }
      }
    }
    
    return data;
  };
  
  // Initialize chart data when component mounts
  useEffect(() => {
    const data: ChartData<'matrix', HeatmapDataPoint[]> = {
      datasets: [
        {
          label: 'Diagnostic Heatmap',
          data: generateHeatmapData(),
          backgroundColor(context) {
            const value = (context.dataset.data[context.dataIndex] as HeatmapDataPoint).v;
            const alpha = value * intensity;
            
            // Red for high values, yellow for medium, green for low
            if (value > 0.7) {
              return `rgba(255, 0, 0, ${alpha})`;
            } else if (value > 0.4) {
              return `rgba(255, 255, 0, ${alpha})`;
            } else {
              return `rgba(0, 255, 0, ${alpha})`;
            }
          },
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          width: ({ chart }) => (chart.chartArea || {}).width / 20 * zoom,
          height: ({ chart }) => (chart.chartArea || {}).height / 20 * zoom,
        }
      ]
    };
    
    setChartData(data);
  }, [intensity, zoom]);
  
  const options: ChartOptions<'matrix'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title() {
            return 'Region Analysis';
          },
          label(context) {
            const value = (context.dataset.data[context.dataIndex] as HeatmapDataPoint).v;
            const intensity = Math.round(value * 100);
            let risk = 'Low';
            
            if (value > 0.7) {
              risk = 'High';
            } else if (value > 0.4) {
              risk = 'Medium';
            }
            
            return [
              `Anomaly Probability: ${intensity}%`,
              `Risk Level: ${risk}`,
              `Region: (${(context.dataset.data[context.dataIndex] as HeatmapDataPoint).x}, ${(context.dataset.data[context.dataIndex] as HeatmapDataPoint).y})`
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
        type: 'linear',
        offset: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        min: 0,
        max: 20
      },
      y: {
        type: 'linear',
        offset: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        min: 0,
        max: 20
      }
    }
  };
  
  // Function to download the heatmap as an image
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
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Function to calculate severity based on heatmap data
  const calculateSeverity = () => {
    const highIntensityCount = chartData?.datasets[0].data.filter(d => d.v > 0.7).length || 0;
    const mediumIntensityCount = chartData?.datasets[0].data.filter(d => d.v > 0.4 && d.v <= 0.7).length || 0;
    
    if (highIntensityCount > 10) {
      return 'High';
    } else if (highIntensityCount > 5 || mediumIntensityCount > 15) {
      return 'Medium';
    } else {
      return 'Low';
    }
  };
  
  const severity = calculateSeverity();
  
  // Determine areas of interest based on the heatmap
  const getAreasOfInterest = () => {
    const areas = [];
    
    if (chartData?.datasets[0].data.some(d => d.x < 7 && d.y < 7 && d.v > 0.6)) {
      areas.push('Upper Left Quadrant');
    }
    if (chartData?.datasets[0].data.some(d => d.x > 12 && d.y < 7 && d.v > 0.6)) {
      areas.push('Upper Right Quadrant');
    }
    if (chartData?.datasets[0].data.some(d => d.x < 7 && d.y > 12 && d.v > 0.6)) {
      areas.push('Lower Left Quadrant');
    }
    if (chartData?.datasets[0].data.some(d => d.x > 12 && d.y > 12 && d.v > 0.6)) {
      areas.push('Lower Right Quadrant');
    }
    if (chartData?.datasets[0].data.some(d => d.x > 7 && d.x < 12 && d.y > 7 && d.y < 12 && d.v > 0.6)) {
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
              {chartData ? (
                <Chart 
                  ref={chartRef}
                  type="matrix"
                  data={chartData}
                  options={options}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Loading heatmap visualization...</p>
                </div>
              )}
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
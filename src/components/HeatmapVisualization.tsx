import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Download, Info } from "lucide-react";
import { Slider } from "./ui/slider";
import { generateHeatmap } from "@/services/doctorAiService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import DynamicHeatmap from "./DynamicHeatmap";

interface HeatmapVisualizationProps {
  analysisId: string;
  imageUrl: string;
  findings: string[];
}

export default function HeatmapVisualization({ 
  analysisId,
  imageUrl,
  findings
}: HeatmapVisualizationProps) {
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("original");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [useAdvancedHeatmap, setUseAdvancedHeatmap] = useState(true);
  
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Generate heatmap on component mount
  useEffect(() => {
    const loadHeatmap = async () => {
      if (!useAdvancedHeatmap) {
        setLoading(true);
        try {
          // In a real implementation, we would upload the original image
          // For this demo, we'll use the mock function that returns a placeholder
          const heatmap = await generateHeatmap(analysisId, new File([], "placeholder.jpg"));
          setHeatmapUrl(heatmap);
        } catch (error) {
          console.error("Error generating heatmap:", error);
          setError("Failed to generate heatmap visualization");
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadHeatmap();
  }, [analysisId, useAdvancedHeatmap]);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };
  
  const handleReset = () => {
    setZoom(100);
    setOpacity(50);
  };
  
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = activeTab === "original" ? imageUrl : (heatmapUrl || imageUrl);
    link.download = `${activeTab === "original" ? "original" : "heatmap"}-analysis-${analysisId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Regions of interest based on findings
  const regions = [
    { name: "Upper Right Quadrant", probability: 0.87, findings: findings.filter((_, i) => i % 3 === 0) },
    { name: "Lower Left Quadrant", probability: 0.65, findings: findings.filter((_, i) => i % 3 === 1) },
    { name: "Central Region", probability: 0.92, findings: findings.filter((_, i) => i % 3 === 2) },
  ];
  
  return useAdvancedHeatmap ? (
    <DynamicHeatmap findings={findings} imageUrl={imageUrl} />
  ) : (
    <Card className="w-full overflow-hidden mb-6">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center p-3 border-b">
            <TabsList>
              <TabsTrigger value="original">Original Image</TabsTrigger>
              <TabsTrigger value="heatmap" disabled={!heatmapUrl || loading}>
                Heatmap Analysis
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      disabled={activeTab !== "heatmap" || !heatmapUrl}
                    >
                      {showHeatmap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Heatmap Visibility</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download Image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <TabsContent value="original" className="mt-0">
            <div 
              ref={imageRef}
              className="relative overflow-hidden bg-black/10 flex items-center justify-center"
              style={{ height: "350px" }}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Original scan" 
                  className="object-contain max-h-full"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              ) : (
                <div className="text-center py-10">
                  <p>No image available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="heatmap" className="mt-0">
            <div 
              ref={imageRef}
              className="relative overflow-hidden bg-black/10 flex items-center justify-center"
              style={{ height: "350px" }}
            >
              {loading ? (
                <div className="text-center py-10">
                  <p className="animate-pulse">Generating heatmap visualization...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <img 
                    src={imageUrl} 
                    alt="Original scan" 
                    className="object-contain max-h-full absolute"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                  
                  {heatmapUrl && showHeatmap && (
                    <img 
                      src={heatmapUrl} 
                      alt="Heatmap visualization" 
                      className="object-contain max-h-full absolute mix-blend-multiply"
                      style={{ 
                        transform: `scale(${zoom / 100})`,
                        opacity: opacity / 100 
                      }}
                    />
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center mb-2">
                <Eye className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Heatmap Opacity</span>
              </div>
              <Slider
                defaultValue={[opacity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => setOpacity(values[0])}
                disabled={!showHeatmap || !heatmapUrl}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-4 border-t">
          <div className="flex items-center mb-3">
            <Info className="h-4 w-4 mr-2" />
            <h4 className="font-medium">Regions of Interest</h4>
          </div>
          
          <div className="space-y-3">
            {regions.map((region, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{region.name}</span>
                    <Badge variant={region.probability > 0.8 ? "destructive" : "outline"}>
                      {Math.round(region.probability * 100)}% Confidence
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <ul className="list-disc list-inside">
                    {region.findings.map((finding, i) => (
                      <li key={i} className="line-clamp-1">{finding}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setUseAdvancedHeatmap(!useAdvancedHeatmap)}
            className="w-full"
          >
            Switch to {useAdvancedHeatmap ? "Basic" : "Advanced"} Heatmap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
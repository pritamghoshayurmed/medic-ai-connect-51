import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Share2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database,
  FileText,
  TrendingUp,
  Activity,
  Stethoscope,
  Pill,
  Calendar
} from 'lucide-react';
import { StructuredDiagnosisResponse } from '@/types/diagnosis';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';

interface StructuredDiagnosisDisplayProps {
  diagnosis: StructuredDiagnosisResponse;
  onExport: () => void;
  onShare: () => void;
  onStartChat: () => void;
  className?: string;
}

export const StructuredDiagnosisDisplay: React.FC<StructuredDiagnosisDisplayProps> = ({
  diagnosis,
  onExport,
  onShare,
  onStartChat,
  className
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'immediate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className={cn("bg-white shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Enhanced Diagnosis Report
            </CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Generated: {formatTimestamp(diagnosis.timestamp)}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {/* Emergency Flags */}
            {diagnosis.emergencyFlags && diagnosis.emergencyFlags.length > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Emergency Flags:</strong> {diagnosis.emergencyFlags.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Overall Confidence</span>
              </div>
              <Badge className={cn("px-3 py-1", getConfidenceColor(diagnosis.confidenceScore))}>
                {diagnosis.confidenceScore}%
              </Badge>
            </div>

            {/* Executive Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Executive Summary
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <MarkdownRenderer 
                  content={diagnosis.executiveSummary} 
                  variant="medical"
                  className="text-blue-900"
                />
              </div>
            </div>

            {/* Data Sources Used */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </h3>
              <div className="flex flex-wrap gap-2">
                {diagnosis.dataSourcesUsed.map((source, index) => (
                  <Badge key={index} variant="outline" className="bg-white">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Stethoscope className="h-4 w-4 mr-2" />
                Differential Diagnosis
              </h3>
              <div className="space-y-3">
                {diagnosis.differentialDiagnoses.map((dx, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{dx.condition}</h4>
                        <div className="flex space-x-2">
                          <Badge className={getConfidenceColor(dx.probability)}>
                            {dx.probability}% probability
                          </Badge>
                          <Badge variant="outline">
                            {dx.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <MarkdownRenderer 
                        content={dx.reasoning} 
                        variant="compact"
                        className="text-gray-700"
                      />
                      {dx.riskFactors && dx.riskFactors.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-600">Risk Factors: </span>
                          <span className="text-sm text-gray-700">{dx.riskFactors.join(', ')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {/* Recommended Tests */}
            {diagnosis.recommendedTests.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Recommended Tests
                </h3>
                <div className="space-y-2">
                  {diagnosis.recommendedTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{test.testName}</div>
                        <MarkdownRenderer 
                          content={test.reasoning} 
                          variant="compact"
                          className="text-gray-600 mt-1"
                        />
                      </div>
                      <Badge className={getPriorityColor(test.priority)}>
                        {test.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatment Recommendations */}
            {diagnosis.treatmentRecommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Pill className="h-4 w-4 mr-2" />
                  Treatment Recommendations
                </h3>
                <div className="space-y-2">
                  {diagnosis.treatmentRecommendations.map((treatment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{treatment.treatment}</div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{treatment.type}</Badge>
                          <Badge className={getPriorityColor(treatment.priority)}>
                            {treatment.priority}
                          </Badge>
                        </div>
                      </div>
                      {treatment.dosage && (
                        <div className="text-sm text-gray-600">
                          <strong>Dosage:</strong> {treatment.dosage}
                        </div>
                      )}
                      {treatment.duration && (
                        <div className="text-sm text-gray-600">
                          <strong>Duration:</strong> {treatment.duration}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Recommendations */}
            {diagnosis.followUpRecommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Follow-up Recommendations
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <ul className="space-y-1">
                    {diagnosis.followUpRecommendations.map((recommendation, index) => (
                      <li key={index} className="text-blue-900">
                        <MarkdownRenderer 
                          content={`• ${recommendation}`} 
                          variant="compact"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Supporting Evidence */}
            {diagnosis.supportingEvidence.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Supporting Evidence</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {diagnosis.supportingEvidence.map((evidence, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{evidence.source}</Badge>
                            <div className="flex space-x-1">
                              <Badge className="text-xs bg-green-100 text-green-800">
                                {evidence.confidence}% confidence
                              </Badge>
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                {evidence.relevance}% relevance
                              </Badge>
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{evidence.title}</h4>
                          <MarkdownRenderer 
                            content={evidence.content} 
                            variant="compact"
                            className="text-gray-700"
                          />
                          {evidence.citation && (
                            <div className="mt-2 text-xs text-gray-500 italic">
                              {evidence.citation}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Limitations */}
            {diagnosis.limitations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Analysis Limitations</h3>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <ul className="space-y-1">
                      {diagnosis.limitations.map((limitation, index) => (
                        <li key={index}>
                          <MarkdownRenderer 
                            content={`• ${limitation}`} 
                            variant="compact"
                          />
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button
            onClick={onStartChat}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            Discuss with AI Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StructuredDiagnosisDisplay;

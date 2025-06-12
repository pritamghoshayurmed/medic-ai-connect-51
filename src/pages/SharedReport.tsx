import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Lock, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle,
  Download,
  Eye,
  Clock
} from 'lucide-react';
import { StructuredDiagnosisResponse, DiagnosisReportMetadata } from '@/types/diagnosis';
import StructuredDiagnosisDisplay from '@/components/StructuredDiagnosisDisplay';
import { reportExportService } from '@/services/reportExportService';
import { toast } from 'sonner';

interface SharedReportData {
  reportId: string;
  diagnosis: StructuredDiagnosisResponse;
  metadata: DiagnosisReportMetadata;
  options: any;
  createdAt: string;
  expiresAt: string;
  accessLevel: string;
  requireLogin: boolean;
}

export default function SharedReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);

  useEffect(() => {
    loadSharedReport();
  }, [reportId]);

  const loadSharedReport = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!reportId) {
        setError('Invalid report link');
        return;
      }

      // In a real implementation, this would fetch from a secure server
      // For demo purposes, we'll check localStorage
      const storedData = localStorage.getItem(`shared_report_${reportId}`);
      
      if (!storedData) {
        setError('Report not found or has expired');
        return;
      }

      const data: SharedReportData = JSON.parse(storedData);
      
      // Check if report has expired
      const now = new Date();
      const expirationDate = new Date(data.expiresAt);
      
      if (now > expirationDate) {
        setError('This report link has expired');
        return;
      }

      setReportData(data);
      
      // Check if authentication is required
      if (data.requireLogin) {
        setShowAccessForm(true);
      } else {
        setIsAuthenticated(true);
      }

    } catch (error) {
      console.error('Error loading shared report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSubmit = () => {
    if (!reportData) return;

    // In a real implementation, this would validate against the server
    // For demo purposes, we'll accept any 6-character code
    if (accessCode.length >= 6) {
      setIsAuthenticated(true);
      setShowAccessForm(false);
      toast.success('Access granted');
    } else {
      toast.error('Invalid access code');
    }
  };

  const handleExport = async () => {
    if (!reportData) return;

    try {
      await reportExportService.exportReport(
        reportData.diagnosis,
        reportData.metadata,
        { format: 'pdf', template: 'standard', includeImages: false, includeReferences: true, includeMetadata: true }
      );
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'comment': return 'bg-green-100 text-green-800';
      case 'edit': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Report</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAccessForm && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This report requires an access code to view. Please enter the code provided by the sharing doctor.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Access Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAccessCodeSubmit} className="flex-1">
                Access Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Shared Medical Report</h1>
                <p className="text-sm text-gray-600">Report ID: {reportId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getAccessLevelColor(reportData.accessLevel)}>
                <Eye className="h-3 w-3 mr-1" />
                {reportData.accessLevel} access
              </Badge>
              {reportData.accessLevel === 'view' && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Report Metadata */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">Generated</p>
                  <p className="text-gray-600">{formatDate(reportData.diagnosis.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">Shared by</p>
                  <p className="text-gray-600">{reportData.metadata.doctorInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">Expires</p>
                  <p className="text-gray-600">{formatDate(reportData.expiresAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis Report */}
        <StructuredDiagnosisDisplay
          diagnosis={reportData.diagnosis}
          onExport={handleExport}
          onShare={() => toast.info('This is a shared report')}
          onStartChat={() => toast.info('Chat not available for shared reports')}
          className="bg-white"
        />

        {/* Disclaimer */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Medical Disclaimer:</strong> {reportData.metadata.disclaimer}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

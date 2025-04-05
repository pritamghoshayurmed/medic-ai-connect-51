import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function PageErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;
  let statusText = 'Server Error';

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    statusText = error.statusText;
    errorMessage = error.data?.message || `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Determine if it's a 404 Not Found
  const isNotFound = statusCode === 404;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className={`${isNotFound ? 'bg-yellow-50' : 'bg-red-50'} p-6`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 ${isNotFound ? 'text-yellow-500' : 'text-red-500'}`} />
            <div>
              <h1 className="text-2xl font-bold">
                {isNotFound ? 'Page Not Found' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 mt-1">{statusText}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <p className="text-gray-700">
            {isNotFound 
              ? "The page you're looking for doesn't exist or has been moved."
              : errorMessage}
          </p>
          
          {!isNotFound && (
            <details className="text-xs text-gray-500 mt-4">
              <summary>Error details</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
                {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-4 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button 
            as={Link}
            to="/"
            className="flex items-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
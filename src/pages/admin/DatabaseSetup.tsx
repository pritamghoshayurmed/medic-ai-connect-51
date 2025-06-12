import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { runDatabaseSetup } from '@/utils/runDatabaseSetup';
import { initializeAIChatHistoryTable } from '@/utils/databaseInit';

export default function DatabaseSetup() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRunSetup = async () => {
    setIsRunning(true);
    setStatus('running');
    setLogs([]);
    
    try {
      addLog('Starting database setup...');
      
      // Override console.log to capture logs
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };
      
      console.error = (...args) => {
        addLog(`ERROR: ${args.join(' ')}`);
        originalError(...args);
      };
      
      console.warn = (...args) => {
        addLog(`WARNING: ${args.join(' ')}`);
        originalWarn(...args);
      };
      
      const result = await runDatabaseSetup();
      
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      
      if (result) {
        addLog('Database setup completed successfully!');
        setStatus('success');
      } else {
        addLog('Database setup failed!');
        setStatus('error');
      }
    } catch (error) {
      addLog(`Database setup error: ${error}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleInitAIChat = async () => {
    setIsRunning(true);
    addLog('Initializing AI Chat History table...');
    
    try {
      await initializeAIChatHistoryTable();
      addLog('AI Chat History table initialized successfully!');
    } catch (error) {
      addLog(`AI Chat initialization error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>
            Initialize and setup the database tables and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleRunSetup} 
              disabled={isRunning}
              variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'default'}
            >
              {isRunning ? 'Running Setup...' : 'Run Database Setup'}
            </Button>
            
            <Button 
              onClick={handleInitAIChat} 
              disabled={isRunning}
              variant="outline"
            >
              Initialize AI Chat Table
            </Button>
          </div>
          
          {status === 'success' && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              ✅ Database setup completed successfully!
            </div>
          )}
          
          {status === 'error' && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              ❌ Database setup failed. Check the logs below.
            </div>
          )}
          
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Setup Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {logs.join('\n')}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

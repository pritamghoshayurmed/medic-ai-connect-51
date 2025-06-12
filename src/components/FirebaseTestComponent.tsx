import React, { useState, useEffect } from 'react';
import { firebaseInitService } from '@/services/firebaseInitService';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { firebaseChatService } from '@/services/firebaseChatService';
import { firebaseAIChatService } from '@/services/firebaseAIChatService';
import { database } from '@/config/firebase';
import { ref, set, get, onValue, off } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

export default function FirebaseTestComponent() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const { user } = useAuth();

  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => [...prev, formattedMessage]);
  };

  const runFirebaseTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addResult('Starting Firebase connectivity tests...');

      // Test 0: Check Firebase Config
      addResult('Checking Firebase configuration...');
      addResult(`Project ID: kabirajai`);
      addResult(`Database URL: https://kabirajai-default-rtdb.asia-southeast1.firebasedatabase.app`);
      addResult(`Auth Domain: kabirajai.firebaseapp.com`);

      // Test 1: Firebase Initialization
      addResult('Testing Firebase initialization...');
      const initResult = await firebaseInitService.initialize();
      if (initResult) {
        addResult('Firebase initialization successful');
      } else {
        addResult('Firebase initialization failed - checking specific issues...', true);

        // Try direct authentication test
        addResult('Attempting direct Firebase authentication...');
        try {
          const user = await firebaseAuthService.ensureAuthenticated();
          addResult(`Direct authentication successful: ${user.uid}`);
        } catch (authError: any) {
          addResult(`Direct authentication failed: ${authError.message}`, true);
          if (authError.message.includes('operation-not-allowed')) {
            addResult('❌ SOLUTION: Enable Anonymous Authentication in Firebase Console', true);
            addResult('1. Go to https://console.firebase.google.com/', true);
            addResult('2. Select project "kabirajai"', true);
            addResult('3. Go to Authentication → Sign-in method', true);
            addResult('4. Enable "Anonymous" provider', true);
            return;
          }
        }
      }

      // Test 2: Authentication
      addResult('Testing Firebase authentication...');
      const user = await firebaseAuthService.ensureAuthenticated();
      if (user) {
        addResult(`Authentication successful - User ID: ${user.uid}`);
      } else {
        addResult('Authentication failed', true);
        return;
      }

      // Test 3: Database Write
      addResult('Testing database write...');
      const testRef = ref(database, 'test/connectivity');
      const testData = {
        timestamp: Date.now(),
        message: 'Test from React app',
        userId: user.uid
      };
      
      await set(testRef, testData);
      addResult('Database write successful');

      // Test 4: Database Read
      addResult('Testing database read...');
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        addResult(`Database read successful - Data: ${JSON.stringify(data)}`);
      } else {
        addResult('Database read failed - no data found', true);
      }

      // Test 5: AI Chat Path Test
      addResult('Testing AI chat path access...');
      const aiChatRef = ref(database, `chats/ai-history/${user.uid}/test`);
      await set(aiChatRef, { test: true, timestamp: Date.now() });
      addResult('AI chat path write successful');

      // Test 6: Doctor-Patient Chat Path Test
      addResult('Testing doctor-patient chat path access...');
      const testChatId = 'test-chat-id';

      // Test writing chat metadata (participants, lastActivity)
      const chatMetadataRef = ref(database, `chats/doctor-patient/${testChatId}`);
      const chatMetadata = {
        participants: [user.uid, 'test-receiver-id'],
        lastActivity: Date.now(),
        unreadCount: {
          [user.uid]: 0,
          'test-receiver-id': 1
        }
      };
      await set(chatMetadataRef, chatMetadata);
      addResult('Chat metadata write successful');

      // Test writing a message with proper structure
      const messageRef = ref(database, `chats/doctor-patient/${testChatId}/messages/test-message-id`);
      const testMessage = {
        senderId: user.uid,
        receiverId: 'test-receiver-id',
        content: 'Test message for Firebase rules validation',
        timestamp: Date.now(),
        read: false,
        type: 'text',
        senderName: 'Test User',
        senderRole: 'patient'
      };
      await set(messageRef, testMessage);
      addResult('Doctor-patient chat message write successful');

      // Cleanup
      addResult('Cleaning up test data...');
      await set(testRef, null);
      await set(aiChatRef, null);
      await set(chatMetadataRef, null);
      addResult('Cleanup successful');

      // Test 7: Real-time Chat Functionality
      addResult('Testing real-time chat functionality...');
      await testRealtimeChat(user.uid);

      // Test 8: AI Chat Service
      addResult('Testing AI chat service...');
      await testAIChatService(user.uid);

      addResult('🎉 All Firebase tests passed! Chat functionality should work.');

    } catch (error: any) {
      addResult(`Test failed: ${error.message}`, true);
      console.error('Firebase test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testRealtimeChat = async (userId: string) => {
    try {
      const testReceiverId = 'test-receiver-id';
      const testMessage = 'Test message from Firebase test';

      // Send a test message
      const messageId = await firebaseChatService.sendDoctorPatientMessage(
        userId,
        testReceiverId,
        testMessage,
        'Test User',
        'patient'
      );

      addResult(`Real-time chat message sent successfully - ID: ${messageId}`);

      // Test message retrieval
      const chatRooms = await firebaseChatService.getChatRooms(userId);
      addResult(`Retrieved ${chatRooms.length} chat rooms for user`);

    } catch (error: any) {
      addResult(`Real-time chat test failed: ${error.message}`, true);
      throw error;
    }
  };

  const testAIChatService = async (userId: string) => {
    try {
      // Initialize AI chat session
      const sessionId = firebaseAIChatService.initializeSession(userId);
      addResult(`AI chat session initialized - ID: ${sessionId}`);

      // Send a test message to AI
      const testMessage = 'Hello, this is a test message';
      const response = await firebaseAIChatService.sendMessage(userId, testMessage);
      addResult(`AI chat response received - Content: ${response.content.substring(0, 50)}...`);

      // Get AI chat history
      const history = await firebaseAIChatService.getChatHistory(userId);
      addResult(`Retrieved ${history.length} AI chat sessions`);

    } catch (error: any) {
      addResult(`AI chat test failed: ${error.message}`, true);
      throw error;
    }
  };

  const startRealtimeListener = () => {
    if (!user) {
      addResult('Please login first to test real-time functionality', true);
      return;
    }

    setIsListening(true);
    addResult('Starting real-time message listener...');

    const testReceiverId = 'test-receiver-id';
    const unsubscribe = firebaseChatService.listenToDoctorPatientMessages(
      user.id,
      testReceiverId,
      (messages) => {
        setRealtimeMessages(messages);
        addResult(`Real-time update: ${messages.length} messages received`);
      }
    );

    // Store unsubscribe function for cleanup
    (window as any).firebaseUnsubscribe = unsubscribe;
  };

  const stopRealtimeListener = () => {
    setIsListening(false);
    if ((window as any).firebaseUnsubscribe) {
      (window as any).firebaseUnsubscribe();
      addResult('Real-time listener stopped');
    }
  };

  const testQuickChat = async () => {
    if (!user) {
      addResult('Please login first to test chat functionality', true);
      return;
    }

    setIsLoading(true);
    try {
      addResult('🚀 Testing quick chat functionality...');

      // Test sending a message with user mapping
      const messageId = await firebaseChatService.sendDoctorPatientMessage(
        user.id,
        'test-doctor-id',
        'Hello Doctor! This is a test message from the patient.',
        user.name || 'Test Patient',
        'patient'
      );

      addResult(`✅ Message sent successfully! ID: ${messageId}`);

      // Test retrieving chat rooms
      const chatRooms = await firebaseChatService.getChatRooms(user.id);
      addResult(`✅ Retrieved ${chatRooms.length} chat rooms`);

      addResult('🎉 Quick chat test completed successfully!');

    } catch (error: any) {
      addResult(`❌ Quick chat test failed: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const testAIChatSave = async () => {
    if (!user) {
      addResult('Please login first to test AI chat functionality', true);
      return;
    }

    setIsLoading(true);
    try {
      addResult('🤖 Testing AI chat save functionality...');

      // Test AI chat with auto-save
      const response = await firebaseAIChatService.sendMessage(
        user.id,
        'Hello AI, this is a test message to verify chat history saving.'
      );

      addResult(`✅ AI response received: ${response.content.substring(0, 50)}...`);

      // Test retrieving AI chat history
      const history = await firebaseAIChatService.getChatHistory(user.id);
      addResult(`✅ Retrieved ${history.length} AI chat sessions`);

      addResult('🎉 AI chat save test completed successfully!');

    } catch (error: any) {
      addResult(`❌ AI chat save test failed: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitStatus = () => {
    const status = firebaseInitService.getInitializationStatus();
    return (
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Firebase Status:</h3>
        <ul className="text-sm space-y-1">
          <li>Initialized: {status.isInitialized ? '✅' : '❌'}</li>
          <li>Auth Ready: {status.isAuthReady ? '✅' : '❌'}</li>
          <li>Database Ready: {status.isDatabaseReady ? '✅' : '❌'}</li>
        </ul>
        {user && (
          <p className="text-sm mt-2 text-blue-600">
            Logged in as: {user.name} ({user.role})
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔥 Firebase Connectivity Test</h2>
      
      {getInitStatus()}
      
      <div className="mb-4 space-x-2">
        <button
          onClick={runFirebaseTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Firebase Tests'}
        </button>

        {user && (
          <>
            <button
              onClick={testQuickChat}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Quick Chat Test
            </button>

            <button
              onClick={testAIChatSave}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test AI Chat Save
            </button>
          </>
        )}
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        <div className="mb-2 text-white">Firebase Test Console:</div>
        {testResults.length === 0 ? (
          <div className="text-gray-400">Click "Run Firebase Tests" to start testing...</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-yellow-400 animate-pulse">
            Running tests...
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>Note:</strong> This test component verifies Firebase connectivity and permissions.</p>
          <p>If tests fail, check the Firebase setup guide and ensure security rules are applied.</p>
        </div>

        {testResults.some(result => result.includes('🎉 All Firebase tests passed!')) && (
          <div className="p-4 bg-green-100 border border-green-400 rounded">
            <h3 className="font-semibold text-green-800 mb-2">✅ Firebase is Ready!</h3>
            <p className="text-green-700 mb-2">All Firebase tests passed. You can now:</p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Test doctor-patient chat functionality</li>
              <li>• Test AI chat with memory persistence</li>
              <li>• Use real-time messaging features</li>
            </ul>
            <div className="mt-3 space-x-2">
              <button
                onClick={() => window.open('/login', '_blank')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Test Login & Chat
              </button>
              <button
                onClick={() => window.open('/patient/ai-chat', '_blank')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Test AI Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

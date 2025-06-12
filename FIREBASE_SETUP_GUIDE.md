# 🔥 Firebase Realtime Database Setup Guide

## **CRITICAL: Apply These Security Rules First**

### **Step 1: Copy Security Rules to Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `kabirajai`
3. Navigate to **Realtime Database** → **Rules**
4. Replace the existing rules with this JSON:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "chats": {
      "doctor-patient": {
        "$chatId": {
          ".read": "auth != null",
          ".write": "auth != null",
          ".validate": "newData.hasChildren(['participants']) || data.exists()",
          "participants": {
            ".read": "auth != null",
            ".write": "auth != null",
            ".validate": "newData.isString()"
          },
          "messages": {
            "$messageId": {
              ".read": "auth != null",
              ".write": "auth != null",
              ".validate": "newData.hasChildren(['senderId', 'receiverId', 'content', 'timestamp'])",
              "senderId": {
                ".validate": "newData.isString()"
              },
              "receiverId": {
                ".validate": "newData.isString()"
              },
              "content": {
                ".validate": "newData.isString() && newData.val().length > 0"
              },
              "timestamp": {
                ".validate": "newData.isNumber()"
              },
              "read": {
                ".validate": "newData.isBoolean()"
              },
              "type": {
                ".validate": "newData.isString()"
              },
              "senderName": {
                ".validate": "newData.isString()"
              },
              "senderRole": {
                ".validate": "newData.isString() && (newData.val() == 'doctor' || newData.val() == 'patient')"
              }
            }
          },
          "lastMessage": {
            ".read": "auth != null",
            ".write": "auth != null"
          },
          "lastActivity": {
            ".read": "auth != null",
            ".write": "auth != null",
            ".validate": "newData.isNumber()"
          },
          "unreadCount": {
            "$userId": {
              ".read": "auth != null",
              ".write": "auth != null",
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        }
      },
      "ai-history": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null",
          "sessions": {
            "$sessionId": {
              ".read": "auth != null",
              ".write": "auth != null",
              ".validate": "newData.hasChildren(['userId', 'messages', 'summary', 'createdAt', 'updatedAt'])",
              "userId": {
                ".validate": "newData.isString()"
              },
              "messages": {
                ".read": "auth != null",
                ".write": "auth != null",
                "$messageId": {
                  ".read": "auth != null",
                  ".write": "auth != null",
                  ".validate": "newData.hasChildren(['role', 'content', 'timestamp'])",
                  "id": {
                    ".validate": "newData.isString()"
                  },
                  "role": {
                    ".validate": "newData.isString() && (newData.val() == 'user' || newData.val() == 'assistant')"
                  },
                  "content": {
                    ".validate": "newData.isString() && newData.val().length > 0"
                  },
                  "timestamp": {
                    ".validate": "newData.isNumber()"
                  }
                }
              },
              "conversationHistory": {
                ".read": "auth != null",
                ".write": "auth != null",
                "$index": {
                  ".read": "auth != null",
                  ".write": "auth != null"
                }
              },
              "summary": {
                ".validate": "newData.isString()"
              },
              "createdAt": {
                ".validate": "newData.isNumber()"
              },
              "updatedAt": {
                ".validate": "newData.isNumber()"
              }
            }
          }
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "online": {
          ".validate": "newData.isBoolean()"
        },
        "lastSeen": {
          ".validate": "newData.isNumber()"
        }
      }
    },
    "typing": {
      "$chatId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null",
          ".validate": "newData.isBoolean()"
        }
      }
    },
    "test": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

5. Click **Publish** to apply the rules

### **Step 2: Enable Anonymous Authentication**

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Anonymous** provider
3. Toggle **Enable** to ON
4. Click **Save**

### **Step 3: Verify Database Configuration**

1. Go to **Realtime Database** → **Data**
2. Verify the database URL matches: `https://kabirajai-default-rtdb.asia-southeast1.firebasedatabase.app`
3. The database should be empty initially

## **🔧 Troubleshooting Common Issues**

### **Issue 1: "PERMISSION_DENIED" Errors**

**Symptoms:**
- Chat saving fails
- Cannot read chat history
- Firebase operations fail

**Solutions:**
1. Verify security rules are applied correctly
2. Check that Anonymous Authentication is enabled
3. Ensure the user is authenticated before database operations

### **Issue 2: "Failed to authenticate with Firebase"**

**Symptoms:**
- Authentication errors in console
- Cannot initialize Firebase services

**Solutions:**
1. Check Firebase configuration in `src/config/firebase.ts`
2. Verify API key and project settings
3. Ensure network connectivity

### **Issue 3: Chat History Not Loading**

**Symptoms:**
- Empty chat history
- Loading spinner never stops

**Solutions:**
1. Check browser console for errors
2. Verify database rules allow read access
3. Check network tab for failed requests

## **🧪 Testing Firebase Setup**

### **Test 1: Authentication**
```javascript
// Open browser console and run:
import { firebaseInitService } from './src/services/firebaseInitService';
firebaseInitService.initialize().then(result => console.log('Firebase ready:', result));
```

### **Test 2: Database Write**
```javascript
// In browser console:
import { database } from './src/config/firebase';
import { ref, set } from 'firebase/database';
set(ref(database, 'test/write'), { timestamp: Date.now() });
```

### **Test 3: Database Read**
```javascript
// In browser console:
import { database } from './src/config/firebase';
import { ref, get } from 'firebase/database';
get(ref(database, 'test/write')).then(snapshot => console.log(snapshot.val()));
```

## **📊 Monitoring Firebase Usage**

1. Go to Firebase Console → **Usage and billing**
2. Monitor Realtime Database usage
3. Set up alerts for quota limits

## **🚀 Production Deployment**

### **Security Checklist:**
- [ ] Security rules applied and tested
- [ ] Anonymous auth enabled
- [ ] Database access restricted to authenticated users
- [ ] API keys secured (not exposed in client code)
- [ ] Usage monitoring set up

### **Performance Optimization:**
- [ ] Database queries optimized with proper indexing
- [ ] Connection pooling configured
- [ ] Error handling and retry logic implemented
- [ ] Offline support configured

## **📞 Support**

If issues persist:
1. Check Firebase Console logs
2. Review browser console errors
3. Test with Firebase emulator for development
4. Contact Firebase support for production issues

---

**Last Updated:** December 2024
**Firebase Project:** kabirajai
**Database Region:** asia-southeast1

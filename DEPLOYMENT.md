# 🚀 Kabiraj AI - Production Deployment Guide

This guide provides step-by-step instructions for deploying Kabiraj AI to production using Vercel.

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts & Services

Before deploying, ensure you have:

1. **GitHub Account** - Repository hosting
2. **Vercel Account** - Deployment platform ([Sign up](https://vercel.com))
3. **Supabase Project** - Database and authentication ([Sign up](https://supabase.com))
4. **Firebase Project** - Real-time chat and storage ([Create project](https://console.firebase.google.com))
5. **Google AI Studio** - Gemini API access ([Get API key](https://makersuite.google.com/app/apikey))

### ✅ Environment Variables

Prepare all required environment variables with production values:

```env
# Supabase (Production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Firebase (Production)
VITE_FIREBASE_API_KEY=your_production_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-production-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app/

# AI Services (Production)
VITE_GEMINI_API_KEY=your_production_gemini_key

# Application (Production)
VITE_APP_ENV=production
VITE_APP_URL=https://your-domain.vercel.app
```

---

## 🔧 Step 1: Repository Preparation

### 1.1 Clone and Setup
```bash
# Clone the repository
git clone https://github.com/pritamghoshayurmed/medic-ai-connect-51.git
cd medic-ai-connect-51

# Install dependencies
npm install

# Test local build
npm run build
```

### 1.2 Verify Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env

# Test with production environment
npm run dev
```

---

## 🌐 Step 2: Supabase Production Setup

### 2.1 Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and set project details:
   - **Name**: `kabiraj-ai-production`
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to your users

### 2.2 Configure Database
```sql
-- Run these SQL commands in Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table with role-based access
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR CHECK (role IN ('doctor', 'patient', 'admin')) NOT NULL DEFAULT 'patient',
  full_name VARCHAR,
  phone VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  medical_license VARCHAR, -- For doctors
  specialization VARCHAR, -- For doctors
  institution VARCHAR, -- For doctors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  appointment_type VARCHAR DEFAULT 'consultation',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.users(id),
  record_type VARCHAR NOT NULL, -- 'diagnosis', 'prescription', 'lab_result', etc.
  title VARCHAR NOT NULL,
  content JSONB,
  attachments TEXT[], -- URLs to files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnosis_reports table
CREATE TABLE public.diagnosis_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.users(id),
  patient_id UUID REFERENCES public.users(id),
  image_url TEXT,
  analysis_result JSONB,
  confidence_score INTEGER,
  ai_model_used VARCHAR,
  status VARCHAR DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Appointments: patients and doctors can see their appointments
CREATE POLICY "View own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

-- Medical records: patients can see their records, doctors can see records they created
CREATE POLICY "View medical records" ON public.medical_records
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_reports ENABLE ROW LEVEL SECURITY;
```

### 2.3 Configure Authentication
1. Go to Authentication → Settings
2. Configure Site URL: `https://your-domain.vercel.app`
3. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/login`

---

## 🔥 Step 3: Firebase Production Setup

### 3.1 Create Production Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Project name: `kabiraj-ai-production`
4. Enable Google Analytics (optional)

### 3.2 Configure Realtime Database
1. Go to Realtime Database → Create Database
2. Choose region: `asia-southeast1` (or closest to users)
3. Start in test mode, then apply these security rules:

```json
{
  "rules": {
    "chats": {
      "doctor-patient": {
        "$chatId": {
          ".read": "auth != null && (auth.uid == data.child('doctorId').val() || auth.uid == data.child('patientId').val())",
          ".write": "auth != null && (auth.uid == data.child('doctorId').val() || auth.uid == data.child('patientId').val())",
          "messages": {
            "$messageId": {
              ".validate": "newData.hasChildren(['senderId', 'message', 'timestamp', 'type'])"
            }
          }
        }
      },
      "ai-history": {
        "$userId": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": "auth != null && auth.uid == $userId",
          "sessions": {
            "$sessionId": {
              ".validate": "newData.hasChildren(['messages', 'createdAt'])"
            }
          }
        }
      }
    },
    "user-presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### 3.3 Configure Storage
1. Go to Storage → Get Started
2. Set up security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Medical images - only authenticated users
    match /medical-images/{userId}/{imageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile images
    match /profile-images/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Diagnosis reports - doctors and patients involved
    match /diagnosis-reports/{reportId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3.4 Configure Authentication
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Add authorized domains:
   - `your-domain.vercel.app`
   - `localhost` (for development)

---

## 🚀 Step 4: Vercel Deployment

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Login and Link Project
```bash
# Login to Vercel
vercel login

# Link project (run in project directory)
vercel link
```

### 4.3 Set Environment Variables
```bash
# Set production environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_FIREBASE_API_KEY production
vercel env add VITE_FIREBASE_AUTH_DOMAIN production
vercel env add VITE_FIREBASE_PROJECT_ID production
vercel env add VITE_FIREBASE_STORAGE_BUCKET production
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
vercel env add VITE_FIREBASE_APP_ID production
vercel env add VITE_FIREBASE_DATABASE_URL production
vercel env add VITE_GEMINI_API_KEY production
vercel env add VITE_APP_ENV production
vercel env add VITE_APP_URL production

# Or set them via Vercel Dashboard:
# 1. Go to your project dashboard
# 2. Settings → Environment Variables
# 3. Add each variable with production values
```

### 4.4 Deploy to Production
```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deployment is enabled)
git add .
git commit -m "feat: production deployment setup"
git push origin main
```

---

## ✅ Step 5: Post-Deployment Verification

### 5.1 Test Core Functionality
1. **Authentication**: Test login/register for both doctors and patients
2. **Database**: Verify user data is saved correctly
3. **Real-time Chat**: Test messaging between users
4. **AI Diagnosis**: Upload test medical image and verify analysis
5. **File Upload**: Test image upload to Firebase Storage

### 5.2 Performance Checks
```bash
# Test build performance
npm run build

# Check bundle size
npx vite-bundle-analyzer dist

# Test lighthouse scores
npx lighthouse https://your-domain.vercel.app --view
```

### 5.3 Security Verification
- [ ] HTTPS is enforced
- [ ] Security headers are present
- [ ] API keys are not exposed in client
- [ ] Database RLS policies are active
- [ ] Firebase security rules are applied

---

## 🔧 Step 6: Domain Configuration (Optional)

### 6.1 Custom Domain Setup
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update environment variables with new domain

### 6.2 Update Service Configurations
1. **Supabase**: Update Site URL and redirect URLs
2. **Firebase**: Add new domain to authorized domains
3. **Environment**: Update `VITE_APP_URL` to new domain

---

## 📊 Step 7: Monitoring & Analytics

### 7.1 Set Up Error Monitoring
```bash
# Install Sentry (optional)
npm install @sentry/react @sentry/vite-plugin

# Configure in vite.config.ts
```

### 7.2 Analytics Setup
1. **Vercel Analytics**: Enable in project settings
2. **Google Analytics**: Add tracking ID to environment variables
3. **Firebase Analytics**: Already configured with Firebase setup

---

## 🔄 Step 8: Continuous Deployment

### 8.1 GitHub Integration
1. Connect Vercel to your GitHub repository
2. Enable automatic deployments from main branch
3. Set up preview deployments for pull requests

### 8.2 Environment Management
- **Production**: `main` branch → production deployment
- **Staging**: `develop` branch → preview deployment
- **Development**: Local environment

---

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify environment variables
vercel env ls
```

#### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies
- Ensure database is accessible

#### Firebase Issues
- Verify Firebase configuration
- Check security rules
- Ensure services are enabled

#### API Key Issues
- Verify all environment variables are set
- Check API key permissions
- Ensure keys are for production use

---

## 📞 Support

If you encounter issues during deployment:

1. **Check Logs**: `vercel logs your-deployment-url`
2. **GitHub Issues**: [Report issues](https://github.com/pritamghoshayurmed/medic-ai-connect-51/issues)
3. **Documentation**: Refer to service-specific documentation
4. **Community**: Join our Discord for community support

---

## 🎉 Deployment Complete!

Your Kabiraj AI platform is now live in production! 

**Next Steps:**
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure backup procedures
4. Plan for scaling and updates
5. Train your team on the platform

**Production URL**: `https://your-domain.vercel.app`

---

<div align="center">

**🚀 Congratulations on your successful deployment!**

[🌐 Live Demo](https://medic-ai-connect-51.vercel.app) • [📚 Documentation](README.md) • [🐛 Report Issues](https://github.com/pritamghoshayurmed/medic-ai-connect-51/issues)

</div>

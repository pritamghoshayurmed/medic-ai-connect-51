# 🏥 Kabiraj AI - Advanced Medical Diagnosis Platform

<div align="center">

![Kabiraj AI Logo](https://img.shields.io/badge/Kabiraj%20AI-Medical%20Platform-blue?style=for-the-badge&logo=medical-cross)

**Revolutionizing Healthcare with AI-Powered Medical Diagnosis and Real-Time Collaboration**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://medic-ai-connect-51.vercel.app)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/pritamghoshayurmed/medic-ai-connect-51)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](package.json)

</div>

---

## 🌟 Overview

Kabiraj AI is a cutting-edge medical diagnosis platform that combines the power of artificial intelligence with real-time collaboration tools to enhance healthcare delivery. Built with modern web technologies and integrated with specialized medical AI models, it provides comprehensive diagnostic assistance for healthcare professionals while maintaining the highest standards of security and compliance.

### 🎯 Key Value Propositions

- **🤖 AI-Powered Diagnosis**: Leverages Google's MedGemma-3 specialist model for radiology-specific analysis
- **📊 Structured Medical Reports**: Generate professional diagnosis reports with export capabilities
- **💬 Real-Time Collaboration**: Seamless doctor-patient and doctor-doctor communication
- **🔒 HIPAA Compliant**: Enterprise-grade security and privacy protection
- **📱 Cross-Platform**: Responsive design for desktop, tablet, and mobile devices

---

## ✨ Features

### 👨‍⚕️ For Healthcare Professionals

#### 🔬 Enhanced Diagnosis Engine
- **Medical Image Analysis**: AI-powered analysis of X-rays, MRIs, CT scans, and other medical images
- **Multi-Source Integration**: Access to PubMed, ClinicalTrials.gov, and medical journals
- **Structured Diagnosis Reports**: Professional reports with confidence scoring and differential diagnosis
- **Heatmap Visualization**: Visual analysis overlays for better understanding of findings
- **Export & Share**: PDF/DOCX export with secure sharing capabilities

#### 👥 Patient Management
- **Real-Time Chat**: Secure doctor-patient communication with Firebase integration
- **Appointment Scheduling**: Comprehensive appointment management system
- **Medical History Tracking**: Complete patient record management
- **Collaboration Tools**: Multi-doctor consultation and case discussion

#### 📈 Analytics & Insights
- **Performance Metrics**: Track diagnosis accuracy and patient outcomes
- **Usage Analytics**: Monitor platform utilization and efficiency
- **Report Generation**: Automated reporting for administrative purposes

### 👤 For Patients

#### 🩺 AI Health Assistant
- **Symptom Analysis**: Intelligent symptom checker with medical guidance
- **Health Monitoring**: Track vitals, medications, and health metrics
- **Appointment Booking**: Easy scheduling with preferred healthcare providers
- **Medical Records**: Secure access to personal health information

#### 💊 Health Management
- **Medication Reminders**: Smart notification system for medication adherence
- **Health Vitals Tracking**: Monitor blood pressure, heart rate, and other vital signs
- **Doctor Communication**: Direct messaging with healthcare providers
- **Educational Resources**: Access to reliable health information and guidance

---

## 🛠️ Technology Stack

### Frontend Architecture
- **⚛️ React 18** - Modern React with hooks and concurrent features
- **📘 TypeScript** - Type-safe development with enhanced IDE support
- **🎨 Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **🧩 Shadcn/ui** - High-quality, accessible component library
- **⚡ Vite** - Next-generation frontend build tool for fast development

### Backend Services
- **🗄️ Supabase** - PostgreSQL database with real-time subscriptions and authentication
- **🔥 Firebase Realtime Database** - Real-time chat and messaging infrastructure
- **☁️ Firebase Storage** - Secure file storage for medical images and documents
- **🔐 Firebase Authentication** - Secure user authentication and authorization

### AI & Machine Learning
- **🧠 Google MedGemma-3** - Specialized medical AI model for radiology analysis
- **💎 Gemini API** - Advanced AI for general medical queries and analysis
- **📊 Multi-Modal AI** - Support for text, image, and structured data analysis

### Development & Deployment
- **🏗️ Google IDX** - Cloud-based development environment
- **🎨 Stitch Design System** - Consistent UI/UX design framework
- **🤖 Jules AI** - Automated bug detection and resolution
- **🚀 Vercel** - Serverless deployment platform with global CDN

### Additional Libraries & Tools
- **🧭 React Router** - Client-side routing and navigation
- **🔄 React Query** - Server state management and caching
- **🏪 Zustand** - Lightweight state management
- **📝 React Markdown** - Markdown rendering for medical reports
- **📄 jsPDF & docx** - Document generation and export
- **📊 Chart.js** - Data visualization and analytics

---

## 🚀 Unique Features & Differentiators

### 🎯 Specialized Medical AI Integration
- **MedGemma-3 Radiology Model**: Purpose-built for medical image analysis
- **Multi-Modal Analysis**: Combines image, text, and structured data
- **Confidence Scoring**: Transparent AI confidence levels for clinical decision-making
- **Evidence-Based Recommendations**: Citations from peer-reviewed medical literature

### 🔄 Real-Time Collaboration
- **Live Chat System**: Instant messaging with typing indicators and read receipts
- **Multi-Doctor Consultations**: Collaborative diagnosis and case discussions
- **Patient Engagement**: Direct doctor-patient communication channels
- **Cross-Platform Sync**: Seamless experience across all devices

### 📋 Professional Medical Reporting
- **Structured Diagnosis Format**: Standardized medical report templates
- **Export Capabilities**: PDF, DOCX, and JSON export options
- **Secure Sharing**: HIPAA-compliant report sharing with access controls
- **Version Control**: Track changes and maintain audit trails

### 🔒 Enterprise Security
- **Role-Based Access Control**: Granular permissions for doctors, patients, and administrators
- **Data Encryption**: End-to-end encryption for all sensitive medical data
- **HIPAA Compliance**: Full compliance with healthcare privacy regulations
- **Audit Logging**: Comprehensive activity tracking and monitoring

---

## 📋 Prerequisites

Before setting up Kabiraj AI, ensure you have the following:

### System Requirements
- **Node.js** 18.0 or higher
- **npm** 8.0 or higher (or **yarn** 1.22+)
- **Git** for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Required Accounts & API Keys
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Firebase Project** - [Create project](https://console.firebase.google.com)
- **Google AI Studio** - [Get Gemini API key](https://makersuite.google.com/app/apikey)
- **Vercel Account** (for deployment) - [Sign up here](https://vercel.com)

---

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/pritamghoshayurmed/medic-ai-connect-51.git
cd medic-ai-connect-51
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual configuration values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.asia-southeast1.firebasedatabase.app/

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Application Configuration
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

### 4. Database Setup

#### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations:
   ```sql
   -- Create users table with role-based access
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR UNIQUE NOT NULL,
     role VARCHAR CHECK (role IN ('doctor', 'patient', 'admin')) NOT NULL,
     full_name VARCHAR,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create appointments table
   CREATE TABLE appointments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     doctor_id UUID REFERENCES users(id),
     patient_id UUID REFERENCES users(id),
     appointment_date TIMESTAMP WITH TIME ZONE,
     status VARCHAR DEFAULT 'scheduled',
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

#### Firebase Setup
1. Create a Firebase project
2. Enable Realtime Database
3. Set up security rules:
   ```json
   {
     "rules": {
       "chats": {
         "doctor-patient": {
           "$chatId": {
             ".read": "auth != null",
             ".write": "auth != null"
           }
         },
         "ai-history": {
           "$userId": {
             ".read": "auth != null && auth.uid == $userId",
             ".write": "auth != null && auth.uid == $userId"
           }
         }
       }
     }
   }
   ```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

---

## 🌐 Environment Variables Guide

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-medical-app` |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL | `https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app/` |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_ENV` | Application environment | `development` |
| `VITE_MAX_FILE_SIZE` | Maximum file upload size (bytes) | `10485760` (10MB) |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` (30s) |

---

## 📚 API Documentation

### Authentication Endpoints

#### Login
```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "securepassword",
  "role": "doctor"
}
```

#### Register
```typescript
POST /auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securepassword",
  "role": "patient",
  "full_name": "John Doe"
}
```

### Medical Analysis APIs

#### Image Analysis
```typescript
POST /api/diagnosis/analyze
Content-Type: multipart/form-data

{
  "image": File,
  "patient_info": {
    "age": 35,
    "gender": "male",
    "medical_history": "No known allergies"
  },
  "data_sources": ["pubmed", "clinical_trials"],
  "additional_context": "Patient reports chest pain"
}
```

#### Generate Report
```typescript
POST /api/diagnosis/report
Content-Type: application/json

{
  "diagnosis_id": "uuid",
  "format": "pdf",
  "template": "detailed",
  "include_images": true
}
```

### Chat System Integration

#### Send Message
```typescript
POST /api/chat/send
Content-Type: application/json

{
  "chat_id": "doctor_patient_123",
  "message": "How are you feeling today?",
  "sender_id": "doctor_uuid",
  "message_type": "text"
}
```

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these guidelines:

### Code Style & Standards
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Use conventional commit messages
- Maintain 80%+ test coverage

### Pull Request Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request with detailed description

### Issue Reporting
- Use the provided issue templates
- Include steps to reproduce
- Provide environment details
- Add relevant screenshots or logs

---

## 📄 License & Legal

### MIT License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Medical Disclaimer
⚠️ **Important Medical Disclaimer**

Kabiraj AI is designed to assist healthcare professionals and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions.

### Privacy & Compliance
- **HIPAA Compliant**: All patient data is handled according to HIPAA regulations
- **Data Encryption**: End-to-end encryption for all sensitive information
- **Privacy Policy**: See [PRIVACY.md](PRIVACY.md) for detailed privacy practices
- **Terms of Service**: See [TERMS.md](TERMS.md) for usage terms

---

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)

#### 1. Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### 2. Environment Variables Setup

In your Vercel dashboard, add all environment variables from your `.env` file:

- Go to Project Settings → Environment Variables
- Add each variable with appropriate values for production
- Ensure all URLs use HTTPS in production

#### 3. Build Configuration

Vercel automatically detects Vite projects. Ensure your `vercel.json` is configured:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### Manual Deployment Steps

#### 1. Build for Production
```bash
npm run build
```

#### 2. Environment Setup
- Set all environment variables in your hosting platform
- Ensure Firebase and Supabase are configured for production
- Update CORS settings for your production domain

#### 3. Deploy Built Files
- Upload the `dist` folder to your hosting provider
- Configure your web server to serve the SPA correctly
- Set up HTTPS and security headers

### Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] Firebase security rules are configured
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is properly configured
- [ ] Domain is added to Firebase authorized domains
- [ ] CORS is configured for your domain
- [ ] Error monitoring is set up (Sentry, etc.)
- [ ] Analytics are configured
- [ ] Backup procedures are in place

---

<div align="center">

**Built with ❤️ for the healthcare community**

[🌐 Live Demo](https://medic-ai-connect-51.vercel.app) • [📧 Support](mailto:support@kabiraj-ai.com) • [📚 Documentation](https://docs.kabiraj-ai.com)

</div>

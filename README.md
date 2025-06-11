# Medic AI Connect

A modern healthcare platform connecting patients and doctors with AI-powered tools for diagnosis, appointment management, and communication.

## Features

- **Patient Dashboard:** Manage appointments, chat with doctors, set medication reminders
- **Doctor Dashboard:** View patient appointments, analytics, and use the AI diagnosis engine
- **AI Diagnosis Engine:** Analyze medical images using Google's Gemini API
- **Medical QA System:** Ask questions about medical reports and conditions
- **Appointment Management:** Schedule and manage appointments between patients and doctors
- **Secure Messaging:** Real-time chat between patients and healthcare providers

## Doctor AI Functionality

The platform integrates advanced Doctor AI capabilities including:

- **Medical Image Analysis:** Upload and analyze X-rays, CT scans, MRIs, and other medical images
- **Diagnostic Insights:** Get AI-powered analysis of medical images with severity assessment
- **Medical Report Generation:** Generate detailed reports from analysis results
- **QA System:** Ask questions about medical conditions and get AI-powered responses
- **Collaboration Tools:** Discuss analysis results with AI assistant

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Database:** Supabase
- **AI:** Google Gemini API (gemini-2.0-flash-lite model)
- **State Management:** React Context API, React Query
- **Authentication:** Supabase Auth

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (optional for full functionality)
- Google Gemini API key is already hardcoded for demo purposes

### Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/pritamghoshayurmed/kabirajai.git
   cd kabirajai
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to http://localhost:5173

### Environment Setup (Optional)

The app is preconfigured with a Gemini API key for demo purposes. If you want to use your own API key, create a `.env.local` file in the root directory:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

### Build for Production

```bash
npm run build
# or
yarn build
```

## Gemini API Implementation

This application uses the Gemini 2.0 Flash Lite model for AI functionality. The API is called directly using axios:

```typescript
// Example direct API call to Gemini
const response = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
  {
    contents: [{
      parts: [{ text: prompt }]
    }]
  },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── pages/           # Page components
│   ├── doctor/      # Doctor-specific pages
│   └── patient/     # Patient-specific pages
├── routes/          # Application routing
├── services/        # API service functions
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## Doctor AI Components

- `ImageUploader`: Drag-and-drop medical image upload component
- `AnalysisResults`: Displays medical image analysis with findings and recommendations
- `MedicalQAChat`: Interactive chat interface for medical questions
- `doctorAiService`: Service for handling image analysis and medical QA

## License

MIT

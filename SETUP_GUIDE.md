# Medic AI Connect - Setup Guide

This guide will help you set up and run the Medic AI Connect application on your local machine.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git installed

## Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/pritamghoshayurmed/kabirajai.git
   cd kabirajai
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**

   Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Application Structure

- **Patient Features:**
  - Dashboard with health metrics
  - Find and book appointments with doctors
  - Chat with healthcare providers
  - Track vitals and health data
  - AI assistant for medical questions

- **Doctor Features:**
  - Patient management dashboard
  - Appointment scheduling
  - AI-powered diagnosis engine
  - Medical image analysis
  - Secure messaging with patients

## Environment Variables (Optional)

If you need to use your own API keys, create a `.env.local` file in the root directory with:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build files will be in the `dist` directory.

## Pushing Changes to GitHub

After making changes to the code, you can push them to GitHub:

```bash
# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push
```

## Support

For any issues or questions, please open an issue on the GitHub repository:
https://github.com/pritamghoshayurmed/kabirajai/issues 
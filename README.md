# Engine Technician App | مركز تقني المحركات

A digital repair agreement and control panel for car service centers with AI-assisted VIN scanning and Arabic localization.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Google Gemini AI** - VIN scanning and image analysis
- **Supabase** - Backend and database (configured but not actively used in current version)
- **Vercel** - Deployment platform

## 📁 Project Structure

```
engine-technician-app/
├── src/
│   ├── app/                    # Main application
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── components/            # Reusable components
│   │   ├── layout/            # Layout components
│   │   │   └── ControlPanel.tsx
│   │   └── ui/                # UI components
│   │       └── SignaturePad.tsx
│   ├── config/                # Configuration
│   │   ├── constants.ts       # App constants
│   │   └── metadata.json      # App metadata
│   ├── features/              # Feature modules
│   │   └── agreements/        # Repair agreement feature
│   │       └── RepairAgreementForm.tsx
│   ├── lib/                   # Utilities
│   │   └── gemini.ts         # Gemini AI integration
│   ├── styles/               # Global styles
│   │   └── index.css
│   └── types/                # TypeScript types
│       └── index.ts
├── index.html                # HTML entry point
├── package.json              # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file is already configured with:
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Important:** Keep these credentials secure and do not commit them to public repositories.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## 🌐 Deployment

### Vercel Deployment

The app is already deployed at: https://engine-technician-app.vercel.app/

To deploy updates:

1. **Connect to GitHub:**
   - Push your code to the GitHub repository
   - Vercel automatically deploys on push to main branch

2. **Manual Deployment:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Environment Variables on Vercel:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add the same variables from `.env` file

## 📱 Features

- **Arabic RTL Interface** - Full right-to-left support
- **Repair Agreement Management** - Create and manage repair contracts
- **Digital Signatures** - Capture customer signatures
- **VIN Scanning** - AI-powered vehicle identification
- **Status Tracking** - Track repair status (New, In Progress, Completed, Delivered)
- **Print Support** - Print-optimized agreement forms
- **Local Storage** - Data persistence without backend
- **Responsive Design** - Works on desktop and mobile

## 🎨 Design Features

- **Tajawal Font** - Professional Arabic typography
- **Blue Primary Color** - Clean, professional appearance
- **RTL Layout** - Native Arabic reading direction
- **Print Optimization** - A4 format with proper margins

## 🔐 Security Notes

- API keys are exposed in the frontend (typical for client-side apps)
- Consider moving sensitive operations to a backend API
- The `.env` file should be added to `.gitignore` for production

## 📄 License

Private - Engine Technician Co.

---

**Last Updated:** January 2026

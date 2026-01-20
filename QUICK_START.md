# Quick Start Guide

## 🚀 Get Your App Running in 5 Minutes

### Step 1: Extract the Files
1. Download `engine-technician-app-reconstructed.zip`
2. Extract to: `C:\Users\user\Desktop\engine-technician-app`
3. Make sure all files are directly in the folder (not in a subfolder)

### Step 2: Install Dependencies
Open Command Prompt or PowerShell in the folder:
```bash
cd C:\Users\user\Desktop\engine-technician-app
npm install
```

**Or** double-click `setup-windows.bat` to run the automated setup.

### Step 3: Test Locally
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### Step 4: Push to GitHub
```bash
git add .
git commit -m "Reconstruct project with proper structure"
git push -f origin main
```

### Step 5: Verify Deployment
Wait 1-2 minutes, then check:
https://engine-technician-app.vercel.app/

---

## ✅ What to Check

Your app should have:
- ✅ Arabic RTL interface
- ✅ Blue "عقد جديد +" button (top left)
- ✅ Search bar with placeholder text
- ✅ Status filter dropdown
- ✅ "لوحة التحكم" header (top right)
- ✅ Clean white/gray design

---

## 🆘 Quick Troubleshooting

**Problem:** `npm: command not found`
- **Solution:** Install Node.js from https://nodejs.org/

**Problem:** Git push fails
- **Solution:** Run `git remote add origin https://github.com/SamiHegazi12/engine-technician-app.git` first

**Problem:** Vercel doesn't auto-deploy
- **Solution:** Check Vercel dashboard → Settings → Git → Ensure repository is connected

**Problem:** App shows errors
- **Solution:** Check browser console (F12) and verify environment variables in Vercel

---

## 📁 Project Structure Overview

```
engine-technician-app/
├── src/
│   ├── app/                    # Main app (App.tsx, main.tsx)
│   ├── components/             # UI components
│   ├── config/                 # Constants and settings
│   ├── features/agreements/    # Repair agreement form
│   ├── lib/                    # Utilities (Gemini AI)
│   ├── styles/                 # CSS
│   └── types/                  # TypeScript types
├── index.html                  # Entry HTML
├── package.json                # Dependencies
├── vite.config.ts             # Build config
└── .env                       # API keys (DO NOT COMMIT)
```

---

## 🔑 Important Files

| File | Purpose |
|------|---------|
| `package.json` | Lists all dependencies |
| `vite.config.ts` | Build and dev server settings |
| `tailwind.config.js` | Styling configuration |
| `.env` | API keys (Gemini, Supabase) |
| `src/app/App.tsx` | Main application logic |
| `src/app/main.tsx` | Entry point |

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **File Mapping:** See `FILE_MAPPING.md`

---

**Need Help?** Check the DEPLOYMENT_GUIDE.md for detailed troubleshooting.

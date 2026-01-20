# Deployment Guide

## Step-by-Step Instructions to Deploy Your Reconstructed App

### Prerequisites
- Git installed on your computer
- GitHub account access
- Vercel account (connected to your GitHub)

---

## Option 1: Push from Your Local Computer (Recommended)

### Step 1: Navigate to Your Desktop Folder
```bash
cd C:\Users\user\Desktop\engine-technician-app
```

### Step 2: Delete All Existing Files
Since you mentioned you already cleared everything, this step is done. But if there are any remaining files:
```bash
# Windows Command Prompt
del /Q *.*
rmdir /S /Q src

# Or in PowerShell
Remove-Item * -Recurse -Force
```

### Step 3: Copy the Reconstructed Files

You have two options:

**Option A: Download from this session**
1. Download the complete reconstructed project as a ZIP file (I'll provide this)
2. Extract to `C:\Users\user\Desktop\engine-technician-app`

**Option B: Manual file creation**
Use the FILE_MAPPING.md guide to place each file in the correct location.

### Step 4: Initialize Git (if not already done)
```bash
git init
git remote add origin https://github.com/SamiHegazi12/engine-technician-app.git
```

### Step 5: Stage and Commit All Files
```bash
git add .
git commit -m "Reconstruct project with proper structure"
```

### Step 6: Push to GitHub
```bash
# If the remote branch exists
git push -f origin main

# If you need to set upstream
git push -u origin main --force
```

**Note:** The `--force` flag is needed because we're replacing the entire repository structure.

---

## Option 2: Clone and Replace (Alternative)

### Step 1: Clone the Repository Fresh
```bash
cd C:\Users\user\Desktop
git clone https://github.com/SamiHegazi12/engine-technician-app.git engine-tech-fresh
cd engine-tech-fresh
```

### Step 2: Delete All Content (Keep .git)
```bash
# Windows PowerShell
Get-ChildItem -Exclude .git | Remove-Item -Recurse -Force
```

### Step 3: Copy Reconstructed Files
Copy all files from the reconstructed project (that I'll provide) into this folder.

### Step 4: Commit and Push
```bash
git add .
git commit -m "Reconstruct project with proper structure"
git push origin main
```

---

## Vercel Deployment

### Automatic Deployment (Recommended)
If your Vercel project is already connected to the GitHub repository:

1. **Push to GitHub** (using steps above)
2. **Vercel automatically deploys** within 1-2 minutes
3. **Check deployment status** at https://vercel.com/dashboard

### Manual Deployment
If automatic deployment doesn't work:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd C:\Users\user\Desktop\engine-technician-app
   vercel --prod
   ```

### Environment Variables on Vercel

Make sure these are set in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_GEMINI_API_KEY=AIzaSyBRaNBI2vfKB_4AdTAdPUtOEZwp902nhSk
VITE_SUPABASE_URL=https://uctwmdbmbaapbawpaywq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdHdtZGJtYmFhcGJhd3BheXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTk5NDgsImV4cCI6MjA4NDI5NTk0OH0.tuON4XP1bIBSU3kEW29gFdPAJUr1-JDGB5hsJwF5DAE
```

---

## Verification Checklist

After deployment, verify:

- ✅ App loads at https://engine-technician-app.vercel.app/
- ✅ Arabic text displays correctly (RTL)
- ✅ Blue "عقد جديد +" button appears
- ✅ Search bar and status filter work
- ✅ Can create new repair agreements
- ✅ Signature pad works
- ✅ Print functionality works

---

## Troubleshooting

### Build Fails on Vercel
- Check that all files are committed to GitHub
- Verify `package.json` has all dependencies
- Check Vercel build logs for specific errors

### App Doesn't Load
- Check browser console for errors
- Verify environment variables are set in Vercel
- Check that the build output is in `dist/` folder

### Design Looks Different
- Clear browser cache (Ctrl + F5)
- Check that Tailwind CSS is properly configured
- Verify Tajawal font is loading from Google Fonts

### API Errors
- Verify Gemini API key is valid
- Check Supabase credentials
- Look for CORS errors in browser console

---

## Need Help?

If you encounter issues:
1. Check the GitHub repository: https://github.com/SamiHegazi12/engine-technician-app
2. Check Vercel deployment logs
3. Review the README.md for additional information

---

**Last Updated:** January 2026

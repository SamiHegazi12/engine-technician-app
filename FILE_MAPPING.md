# File Mapping Guide

This document shows where each of your loose files should be placed in the proper project structure.

## Your Original Files → New Location

| Original File (Desktop) | New Location in Project |
|------------------------|-------------------------|
| `App.tsx` | `src/app/App.tsx` |
| `index.tsx` | `src/app/main.tsx` ⚠️ |
| `ControlPanel.tsx` | `src/components/layout/ControlPanel.tsx` |
| `SignaturePad.tsx` | `src/components/ui/SignaturePad.tsx` |
| `RepairAgreementForm.tsx` | `src/features/agreements/RepairAgreementForm.tsx` |
| `constants.tsx` | `src/config/constants.ts` ⚠️ |
| `types.ts` | `src/types/index.ts` |
| `geminiService.ts` | `src/lib/gemini.ts` ⚠️ |
| `metadata.json` | `src/config/metadata.json` |
| `index.html` | `index.html` (root) |

⚠️ **Note:** File names may have been adjusted for consistency:
- `index.tsx` → `main.tsx` (common convention for Vite entry point)
- `constants.tsx` → `constants.ts` (no JSX, so .ts extension)
- `geminiService.ts` → `gemini.ts` (shorter, cleaner name)

## Additional Files Created

These are essential configuration files that were missing from your desktop folder:

### Root Configuration Files
- `package.json` - NPM dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.node.json` - TypeScript config for Node files
- `.gitignore` - Git ignore rules
- `.env` - Environment variables (Supabase, Gemini API)
- `README.md` - Project documentation

### Additional Source Files
- `src/styles/index.css` - Global CSS with Tailwind imports

## File Organization Logic

```
src/
├── app/              → Main application entry points
├── components/       → Reusable UI components
│   ├── layout/      → Layout-level components (ControlPanel)
│   └── ui/          → Small UI components (SignaturePad)
├── config/          → Configuration and constants
├── features/        → Feature-based modules
│   └── agreements/  → Repair agreement feature
├── lib/             → Utility functions and services
├── styles/          → Global styles
└── types/           → TypeScript type definitions
```

## Why This Structure?

1. **Scalability** - Easy to add new features without cluttering
2. **Maintainability** - Clear separation of concerns
3. **Standard Practice** - Follows React/Vite conventions
4. **Team Collaboration** - Easy for other developers to understand
5. **Build Optimization** - Vite can efficiently bundle organized code

## Next Steps

1. ✅ All files have been properly organized
2. ✅ Configuration files created
3. ⏭️ Install dependencies: `npm install`
4. ⏭️ Test locally: `npm run dev`
5. ⏭️ Push to GitHub
6. ⏭️ Deploy to Vercel (automatic if connected to GitHub)

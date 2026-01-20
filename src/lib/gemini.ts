import { GoogleGenerativeAI } from "@google/generative-ai";

// DEBUG: Check if the key is loading
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("[Gemini Config] API Key Status:", apiKey ? "✅ Loaded" : "❌ MISSING (Check Vercel Env Vars)");

const genAI = new GoogleGenerativeAI(apiKey || "");

// List of models to try in order of preference (Fastest/Cheapest -> Most Capable)
const MODELS_TO_TRY = [
  "gemini-1.5-flash",       // Standard stable
  "gemini-1.5-flash-001",   // Specific version 001
  "gemini-1.5-flash-002",   // Specific version 002
  "gemini-1.5-flash-8b",    // High efficiency version
  "gemini-1.5-pro",         // More powerful, often has different quota
  "gemini-2.0-flash-exp"    // Experimental (sometimes free)
];

export const extractVehicleInfoFromImage = async (
  base64Image: string, 
  mimeType: string = "image/jpeg"
) => {
  const prompt = `
    You are an expert OCR system for vehicle documents. 
    Analyze the provided image and extract the following data into a JSON object.
    
    Fields to extract:
    - vin: 17-character VIN number (usually starts with letters/numbers)
    - brand: Car manufacturer (e.g., Toyota, Ford) - MUST BE IN ARABIC
    - model: Car model (e.g., Camry, F-150)
    - year: Manufacturing year (4 digits)
    - color: Car color - MUST BE IN ARABIC
    - plateNumbers: The numeric part of the license plate
    - plateLetters: The Arabic letters part of the license plate
    - customerName: Full name of the customer - MUST BE IN ARABIC
    - idNumber: National ID or Iqama number (10 digits)
    
    Rules:
    1. Return ONLY the raw JSON object. No markdown, no backticks, no extra text.
    2. If a field is not found or unreadable, use null.
    3. Translate English brand/color names to Arabic.
    4. Be very precise with the VIN and ID numbers.
  `;

  // Loop through models until one works
  for (const modelId of MODELS_TO_TRY) {
    try {
      console.log(`[Gemini] Attempting scan with model: ${modelId}...`);
      const model = genAI.getGenerativeModel({ model: modelId });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`[Gemini] Success with ${modelId}! Raw Response:`, text);

      // Clean potential markdown formatting
      const jsonStr = text.replace(/```json|```/g, "").trim();
      
      try {
        const data = JSON.parse(jsonStr);
        console.log("[Gemini] Parsed Data:", data);
        return data;
      } catch (e) {
        // Fallback: try to find JSON pattern if parsing fails
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw e;
      }

    } catch (error: any) {
      // Log failure but continue to next model
      console.warn(`[Gemini] Failed with ${modelId}:`, error.message || error);
      
      // If it's the last model and it failed, throw error or return null
      if (modelId === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
        console.error("[Gemini] All models failed.");
        if (error.message?.includes('429')) {
           alert("⚠️ Service Busy: All available AI models are currently busy or quota exceeded. Please try again later.");
        }
        return null;
      }
    }
  }
  return null;
};
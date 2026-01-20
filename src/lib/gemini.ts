import { GoogleGenerativeAI } from "@google/generative-ai";

// DEBUG: Check if the key is loading
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("[Gemini Config] API Key Status:", apiKey ? "✅ Loaded" : "❌ MISSING (Check Vercel Env Vars)");

// Note: We use the generic client. For 404 fixes, we will try specific API versions below.
const genAI = new GoogleGenerativeAI(apiKey || "");

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

  // UPDATED STRATEGY: 
  // 1. Try 'v1beta' (default) with standard models
  // 2. Try 'v1' (stable) if beta fails (Fixes 404s)
  // 3. Try legacy models (gemini-pro)
  const STRATEGIES = [
    { model: "gemini-2.0-flash", apiVersion: "v1beta" }, // Newest
    { model: "gemini-1.5-flash", apiVersion: "v1" },     // Stable v1 (Fixes 404)
    { model: "gemini-1.5-flash", apiVersion: "v1beta" }, // Beta
    { model: "gemini-pro", apiVersion: "v1" },           // Legacy (Most likely to work)
    { model: "gemini-1.5-flash-8b", apiVersion: "v1" }   // Efficiency
  ];

  for (const strategy of STRATEGIES) {
    try {
      console.log(`[Gemini] Attempting scan... Model: ${strategy.model} (API: ${strategy.apiVersion})`);
      
      // Get model with specific config
      const model = genAI.getGenerativeModel({ 
        model: strategy.model
      }, {
        apiVersion: strategy.apiVersion
      });

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
      
      console.log(`[Gemini] ✅ Success with ${strategy.model}!`);

      // Clean potential markdown formatting
      const jsonStr = text.replace(/```json|```/g, "").trim();
      
      try {
        const data = JSON.parse(jsonStr);
        console.log("[Gemini] Parsed Data:", data);
        return data;
      } catch (e) {
        // Fallback: try to find JSON pattern
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw e;
      }

    } catch (error: any) {
      console.warn(`[Gemini] Failed with ${strategy.model} (${strategy.apiVersion}):`, error.message || error);
      
      // If we are at the last strategy and it failed
      if (strategy === STRATEGIES[STRATEGIES.length - 1]) {
        console.error("[Gemini] All models failed.");
        
        if (error.message?.includes('429') || error.message?.includes('quota')) {
           alert("⚠️ تنبيه: تم تجاوز حد الاستخدام المجاني للذكاء الاصطناعي. يرجى تفعيل الفوترة في حساب Google Cloud أو المحاولة لاحقاً.");
        } else if (error.message?.includes('404')) {
           alert("⚠️ تنبيه: لا يمكن الوصول لنموذج الذكاء الاصطناعي في منطقتك حالياً.");
        }
        return null;
      }
    }
  }
  return null;
};
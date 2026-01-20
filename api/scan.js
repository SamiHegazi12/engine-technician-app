import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { base64Image, mimeType } = req.body;

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server API Key is missing" });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

    // DEFINING STRATEGIES: Model Name + API Version
    // By 2026, 'v1beta' often drops support for older models. We must try 'v1'.
    const strategies = [
      { model: "gemini-1.5-flash", apiVersion: "v1" },       // STABLE v1 (Best bet)
      { model: "gemini-1.5-flash-8b", apiVersion: "v1" },    // High efficiency v1
      { model: "gemini-2.0-flash", apiVersion: "v1beta" },   // Newest beta
      { model: "gemini-pro", apiVersion: "v1" }              // Legacy v1
    ];

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
      1. Return ONLY the raw JSON object. No markdown, no backticks.
      2. If a field is not found, use null.
      3. Translate English brand/color names to Arabic.
    `;

    // Loop through strategies
    let lastError = null;

    for (const strategy of strategies) {
      try {
        console.log(`[Server] Attempting: ${strategy.model} using ${strategy.apiVersion}...`);
        
        // Configure specific model and API version
        const model = genAI.getGenerativeModel(
          { model: strategy.model },
          { apiVersion: strategy.apiVersion }
        );

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType || "image/jpeg"
            }
          }
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log(`[Server] Success with ${strategy.model}!`);

        // Clean JSON
        const jsonStr = text.replace(/```json|```/g, "").trim();
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
        }

        return res.status(200).json(data);

      } catch (error) {
        console.warn(`[Server] Failed ${strategy.model}: ${error.message}`);
        lastError = error;
      }
    }

    // If all failed, return the error from the FIRST strategy (usually the most relevant one)
    // or the last one if they are all similar.
    throw lastError || new Error("All models failed to respond.");

  } catch (error) {
    console.error("Server Scan Final Error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal Server Error",
      details: "Check Vercel Function Logs for more info." 
    });
  }
}
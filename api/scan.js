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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Image, mimeType } = req.body;

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server API Key is missing. Check Vercel Env Vars." });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

    // LIST OF MODELS TO TRY (In order of priority)
    // 1. gemini-2.0-flash: The new standard (Should work on US Server)
    // 2. gemini-1.5-flash: The previous standard
    // 3. gemini-1.5-pro: Higher capability fallback
    // 4. gemini-pro: Legacy fallback
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-pro"
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

    // LOOP: Try models one by one
    let lastError = null;

    for (const modelId of modelsToTry) {
      try {
        console.log(`[Server] Attempting scan with model: ${modelId}`);
        const model = genAI.getGenerativeModel({ model: modelId });

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
        console.log(`[Server] Success with ${modelId}`);

        // Clean JSON
        const jsonStr = text.replace(/```json|```/g, "").trim();
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
        }

        // If we got here, it worked! Return immediately.
        return res.status(200).json(data);

      } catch (error) {
        console.warn(`[Server] Failed with ${modelId}: ${error.message}`);
        lastError = error;
        // Continue to next model...
      }
    }

    // If loop finishes without success
    throw lastError || new Error("All models failed.");

  } catch (error) {
    console.error("Server Scan Final Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. CORS Headers (Allow your app to talk to this function)
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
      throw new Error("Server API Key is missing");
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // Use the stable model that works in US/EU regions
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.error("Server Scan Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
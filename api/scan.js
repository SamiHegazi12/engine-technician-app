export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { base64Image } = req.body;

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server API Key is missing' });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    
    // CORRECTED MODEL ID:
    // This is the standard experimental free model on OpenRouter.
    const model = "google/gemini-2.0-flash-exp:free";

    console.log(`[Server] Requesting OpenRouter with model: ${model}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://engine-technician-app.vercel.app",
        "X-Title": "Engine Technician App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert OCR system for vehicle documents (Saudi Istimara). 
                Extract the following data into a raw JSON object:
                - vin: 17-character VIN number
                - brand: Car manufacturer (Arabic)
                - model: Car model
                - year: Manufacturing year (4 digits)
                - color: Car color (Arabic)
                - plateNumbers: Numeric part of plate
                - plateLetters: Arabic letters of plate
                - customerName: Full name (Arabic)
                - idNumber: National ID (10 digits)
                
                Rules: Return ONLY valid JSON. No markdown. If not found, use null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[OpenRouter Error] ${response.status}: ${errText}`);
        return res.status(response.status).json({ error: `Provider Error: ${errText}` });
    }

    const data = await response.json();
    
    // Check if we got a valid choice
    if (!data.choices || data.choices.length === 0) {
       console.error("[OpenRouter] No choices returned:", data);
       // Fallback logic: sometimes 'free' models are busy/empty.
       throw new Error("AI Provider returned no results (Model might be busy).");
    }

    const content = data.choices[0]?.message?.content;

    if (!content) {
        throw new Error("No content received from AI provider");
    }

    // Clean JSON string
    const jsonStr = content.replace(/```json|```/g, "").trim();
    
    let parsedData = null;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch(e) {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) parsedData = JSON.parse(match[0]);
    }

    if (parsedData) {
        return res.status(200).json(parsedData);
    } else {
        throw new Error("Failed to parse JSON response");
    }

  } catch (error) {
    console.error("Server Logic Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
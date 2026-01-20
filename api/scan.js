// NOTE: We removed "runtime: edge" to support larger payloads if needed.

export default async function handler(req, res) {
  // 1. CORS Setup
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Image, mimeType } = req.body;

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server API Key is missing' });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    
    // Models to try (Direct REST API)
    // Priority: 1.5-flash (Standard/Cheap) -> 1.5-pro (More capable)
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash"
    ];

    let lastError = null;

    for (const model of models) {
      console.log(`[Server] Trying ${model}...`);
      
      // Using 'v1beta' endpoint which is generally most available
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [
            { text: "Extract vehicle data: vin, brand (Arabic), model, year, color (Arabic), plateNumbers, plateLetters, customerName (Arabic), idNumber. Return raw JSON." },
            {
              inline_data: {
                mime_type: mimeType || "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          const jsonStr = text.replace(/```json|```/g, "").trim();
          let parsedData = null;
          try {
             parsedData = JSON.parse(jsonStr);
          } catch(e) {
             const match = jsonStr.match(/\{[\s\S]*\}/);
             if (match) parsedData = JSON.parse(match[0]);
          }
          
          if (parsedData) {
            return res.status(200).json(parsedData);
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[Server] Failed ${model}: ${response.status}`);
        lastError = { status: response.status, message: errText };
      }
    }

    return res.status(500).json({ 
      error: "All models failed", 
      details: lastError 
    });

  } catch (error) {
    console.error("Server Logic Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
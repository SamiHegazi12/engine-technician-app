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
    const { base64Image, mimeType } = req.body;

    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server API Key is missing' });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    
    // STRATEGY: 
    // 1. gemini-1.5-flash-8b: The "Nano" version. Extremely cheap/free, often bypasses main quota.
    // 2. gemini-1.5-flash-002: Specific stable version (sometimes works when "latest" fails).
    // 3. gemini-1.0-pro: The legacy model. Old but reliable for free tier.
    const models = [
      "gemini-1.5-flash-8b", 
      "gemini-1.5-flash-002",
      "gemini-1.0-pro"
    ];

    let errors = [];

    for (const model of models) {
      console.log(`[Server] Trying ${model}...`);
      
      // We try both v1beta and v1 endpoints for each model
      const versions = ['v1beta', 'v1'];
      
      for (const version of versions) {
         const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
         
         try {
            const payload = {
                contents: [{
                parts: [
                    { text: "Extract vehicle data JSON: vin, brand (Arabic), model, year, color (Arabic), plateNumbers, plateLetters, customerName (Arabic), idNumber." },
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
                errors.push(`${model} (${version}): ${response.status} - ${errText}`);
            }
         } catch (e) {
             errors.push(`${model} (${version}): Exception - ${e.message}`);
         }
      }
    }

    // If we reach here, EVERYTHING failed.
    return res.status(500).json({ 
      error: "All models failed", 
      details: errors 
    });

  } catch (error) {
    console.error("Server Logic Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
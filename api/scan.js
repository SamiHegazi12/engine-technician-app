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
    
    // UPDATED LIST OF FREE MODELS (Verified IDs)
    // The script will try them one by one.
    const models = [
      "google/gemini-2.0-flash-001",
      "google/gemini-1.5-flash",
      "google/gemini-1.5-pro",
      "google/gemini-2.0-flash-lite-preview-02-05:free",
      "meta-llama/llama-3.2-11b-vision-instruct:free",
      "qwen/qwen-2-vl-7b-instruct:free"
    ];

    let lastError = null;

    for (const model of models) {
      console.log(`[Server] Requesting OpenRouter: ${model}...`);

      try {
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

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          // Check if content exists and isn't empty
          if (content && content.length > 5) {
             console.log(`[Server] Success with ${model}`);
             
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
             }
          } else {
             console.warn(`[Server] Empty response from ${model}`);
          }
        } else {
          const errText = await response.text();
          console.warn(`[Server] Failed ${model}: ${response.status} - ${errText}`);
          lastError = { status: response.status, message: errText };
        }
      } catch (e) {
        console.warn(`[Server] Exception ${model}: ${e.message}`);
        lastError = { message: e.message };
      }
      
      // Delay 0.5 second before retrying next model
      await new Promise(r => setTimeout(r, 500));
    }

    // If all models fail
    return res.status(500).json({ 
      error: "All AI models are currently busy or unavailable.", 
      details: lastError 
    });

  } catch (error) {
    console.error("Server Logic Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

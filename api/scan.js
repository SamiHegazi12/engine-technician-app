export const config = {
  runtime: 'edge', // Use Edge Runtime for faster, cheaper execution
};

export default async function handler(req) {
  // 1. CORS Setup
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { base64Image, mimeType } = await req.json();

    if (!process.env.VITE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server API Key is missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;
    
    // STRATEGY: Try the newest model (2.0) first, then fallback to stable (1.5)
    // We use DIRECT REST endpoints to avoid SDK version mismatch.
    const models = [
      "gemini-2.0-flash", 
      "gemini-1.5-flash"
    ];

    let lastError = null;

    for (const model of models) {
      console.log(`[Server] Trying direct REST fetch for: ${model}...`);
      
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
        // Extract text from the REST response structure
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          // Clean JSON
          const jsonStr = text.replace(/```json|```/g, "").trim();
          let parsedData = null;
          try {
             parsedData = JSON.parse(jsonStr);
          } catch(e) {
             const match = jsonStr.match(/\{[\s\S]*\}/);
             if (match) parsedData = JSON.parse(match[0]);
          }
          
          if (parsedData) {
            return new Response(JSON.stringify(parsedData), {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[Server] Failed ${model}: ${response.status} - ${errText}`);
        lastError = { status: response.status, message: errText };
        
        // If Quota exceeded (429), no need to try other models usually, but we continue just in case.
      }
    }

    // If loop ends
    return new Response(JSON.stringify({ 
      error: "All models failed", 
      details: lastError 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
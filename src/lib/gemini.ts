export const extractVehicleInfoFromImage = async (
  base64Image: string, 
  mimeType: string = "image/jpeg"
) => {
  try {
    console.log("[Gemini] Sending image to Vercel Server Proxy...");

    // Call the serverless function we just created
    // Note: On localhost, this fails without 'vercel dev'. It works on the Live Site.
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        base64Image, 
        mimeType 
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[Gemini] Success from Server:", data);
    return data;

  } catch (error: any) {
    console.error("[Gemini] Scan Failed:", error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
    return null;
  }
};
export const extractVehicleInfoFromImage = async (
  base64Image: string, 
  mimeType: string = "image/jpeg"
) => {
  try {
    console.log("[Gemini] Sending image to Vercel Server (Edge)...");

    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Gemini] Server Error Details:", data);
      // Check for specific Google API errors passed back from server
      if (data.details?.message?.includes('429')) {
        alert("⚠️ تم تجاوز حد الاستخدام المجاني (Quota Exceeded). يرجى المحاولة لاحقاً.");
      } else if (data.details?.message?.includes('400')) {
        alert("⚠️ طلب غير صالح (Bad Request). قد تكون الصورة غير واضحة.");
      } else {
        alert("⚠️ فشل الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
      }
      return null;
    }

    console.log("[Gemini] Success:", data);
    return data;

  } catch (error: any) {
    console.error("[Gemini] Network Error:", error);
    return null;
  }
};
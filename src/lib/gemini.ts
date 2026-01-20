// Helper function to compress image before sending
const compressImage = async (base64Str: string, maxWidth = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Compress to JPEG
      const newDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(newDataUrl.split(',')[1]); // Return only base64 string
    };
  });
};

export const extractVehicleInfoFromImage = async (
  base64Image: string, 
  mimeType: string = "image/jpeg"
) => {
  try {
    console.log("[Gemini] Optimizing image size...");
    
    // 1. COMPRESS: Ensure image is under 1MB to avoid Server/Edge limits
    const compressedBase64 = await compressImage(base64Image);
    
    console.log("[Gemini] Sending optimized image to Vercel Server...");

    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        base64Image: compressedBase64, 
        mimeType: "image/jpeg" // Always convert to jpeg during compression
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 2. LOGGING: Print the FULL error object so we can see it
      console.error("[Gemini] Server Error:", JSON.stringify(data, null, 2));
      
      const msg = data.details?.message || data.error || "Unknown Error";
      
      if (msg.includes('429')) {
        alert("⚠️ تم تجاوز حد الاستخدام المجاني (Quota Exceeded).");
      } else if (msg.includes('404')) {
        alert("⚠️ نموذج الذكاء الاصطناعي غير متوفر (404).");
      } else {
        alert(`⚠️ فشل الاتصال: ${msg}`);
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
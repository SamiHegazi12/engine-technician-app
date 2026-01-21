export const extractVehicleInfoFromImage = async (base64Image: string) => {
  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to scan image');
    }

    return await response.json();
  } catch (error) {
    console.error("AI Scan Error:", error);
    throw error;
  }
};

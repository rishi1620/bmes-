export const generateStudyMaterial = async (prompt: string, fileContent?: string) => {
  try {
    const response = await fetch("/api/generate-study-material", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, fileContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate content.");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};

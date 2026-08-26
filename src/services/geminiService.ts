export type StudyMode = 'summary' | 'quiz' | 'concepts' | 'plan' | 'explain' | 'general';

export const generateStudyMaterial = async (
  prompt: string, 
  fileContent?: string, 
  mode: StudyMode = 'general',
  chatHistory: { role: string, parts: { text: string }[] }[] = []
) => {
  try {
    // 1. Attempt server-side API endpoint first (preferred secure approach)
    const response = await fetch("/api/gemini/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, fileContent, mode, chatHistory }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.text;
    }

    const errData = await response.json().catch(() => ({}));
    if (response.status === 503) {
      throw new Error(errData.error || "GEMINI_API_KEY is not configured on the server. Please set it in Settings.");
    }
    throw new Error(errData.error || "Failed to generate study material via server.");
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};

import { GoogleGenAI } from "@google/genai";

export const generateStudyMaterial = async (prompt: string, fileContent?: string) => {
  // Use a safer way to access process.env in browser environments
  const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in the environment.");
    throw new Error("AI service configuration missing. Please check your API key settings in the project dashboard.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const systemInstruction = `You are an expert academic assistant for Biomedical Engineering students (CUET BMES). 
    Your goal is to provide accurate, detailed, and easy-to-understand explanations, summaries, and study plans.
    Always maintain a professional, encouraging, and academic tone suitable for university-level students.
    If the user provides file content, base your response primarily on that content while incorporating your broader domain knowledge.
    Format the output in clean, well-structured Markdown.`;

    const contentText = fileContent 
      ? `File Content:\n${fileContent}\n\nUser Request: ${prompt}`
      : `User Request: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: contentText }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });
    
    if (!response.text) {
      console.warn("Gemini returned an empty response.");
      return "The AI assistant couldn't generate a response. Please try a different prompt.";
    }
    
    return response.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("API key")) {
      throw new Error("Invalid or missing API key. Please configure it in the settings.");
    }
    throw error;
  }
};

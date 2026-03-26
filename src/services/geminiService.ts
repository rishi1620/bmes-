import { GoogleGenAI } from "@google/genai";

export const generateStudyMaterial = async (prompt: string, fileContent?: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in the environment variables (VITE_GEMINI_API_KEY for Vercel).");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = "You are an expert academic assistant for Biomedical Engineering students (CUET BMES). Your goal is to provide accurate, detailed, and easy-to-understand explanations, summaries, and study plans. Always maintain a professional, encouraging, and academic tone suitable for university-level students. If the user provides file content, base your response primarily on that content while incorporating your broader domain knowledge. Format the output in clean, well-structured Markdown.";

    const contentText = fileContent 
      ? "File Content:\n" + fileContent + "\n\nUser Request: " + prompt
      : "User Request: " + prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: contentText }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};

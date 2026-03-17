import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateStudyMaterial = async (prompt: string, fileContent?: string) => {
  try {
    const systemInstruction = `You are an expert academic assistant for Biomedical Engineering students (CUET BMES). 
    Your goal is to provide accurate, detailed, and easy-to-understand explanations, summaries, and study plans.
    Always maintain a professional, encouraging, and academic tone suitable for university-level students.
    If the user provides file content, base your response primarily on that content while incorporating your broader domain knowledge.
    Format the output in clean, well-structured Markdown.`;

    const content = fileContent 
      ? `File Content:\n${fileContent}\n\nUser Request: ${prompt}`
      : `User Request: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: content,
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

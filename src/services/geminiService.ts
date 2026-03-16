import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateStudyMaterial = async (prompt: string) => {
  try {
    const model = genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert academic assistant for Biomedical Engineering students. 
      Generate a detailed study summary, key concepts, or a study plan based on the following request: ${prompt}.
      Format the output in clean Markdown.`,
    });
    
    const response = await model;
    return response.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};

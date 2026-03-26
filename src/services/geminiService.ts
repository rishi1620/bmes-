import { GoogleGenAI } from "@google/genai";

export type StudyMode = 'summary' | 'quiz' | 'concepts' | 'plan' | 'explain' | 'general';

export const generateStudyMaterial = async (prompt: string, fileContent?: string, mode: StudyMode = 'general') => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in the environment variables (VITE_GEMINI_API_KEY for Vercel).");
    }

    const ai = new GoogleGenAI({ apiKey });

    const modeInstructions: Record<StudyMode, string> = {
      summary: "Create a concise yet comprehensive summary of the provided material. Use bullet points for key takeaways and bold important terms.",
      quiz: "Generate a set of 5-10 multiple-choice or short-answer questions based on the material to test understanding. Include an answer key at the end.",
      concepts: "Identify and explain the core theoretical concepts and formulas found in the material. Provide real-world biomedical engineering examples where applicable.",
      plan: "Create a structured 1-week study schedule to master this topic. Break it down into daily goals and suggest specific sub-topics to focus on.",
      explain: "Explain the complex parts of this topic as if you were teaching a fellow student. Use analogies and simplify technical jargon without losing accuracy.",
      general: "Provide a helpful response based on the user's request and any provided material."
    };

    const systemInstruction = `You are an expert academic assistant for Biomedical Engineering students at CUET. 
    Your goal is to provide high-quality, university-level academic support. 
    Task: ${modeInstructions[mode]}
    Tone: Professional, academic, encouraging, and precise.
    Format: Use clean Markdown with clear headings, lists, and bold text for emphasis.
    Context: If file content is provided, prioritize it as the primary source of truth.`;

    const contentText = fileContent 
      ? "CONTEXT MATERIAL (PDF CONTENT):\n" + fileContent + "\n\nUSER SPECIFIC REQUEST: " + prompt
      : "USER REQUEST: " + prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: contentText }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating study material:", error);
    throw error;
  }
};

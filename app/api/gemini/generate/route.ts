import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { leadDetails } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an expert Loan Direct Selling Agent (DSA). Generate a personalized, highly persuasive, and professional script for a cold call or follow-up with the following lead. 
Focus on their specific profile, loan amount requested, and employment type. Keep it under 150 words. Be conversational, not a robot. Provide some tips on how to handle objections for this specific profile.

Lead Details:
${JSON.stringify(leadDetails, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

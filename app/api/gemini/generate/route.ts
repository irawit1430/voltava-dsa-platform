import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // Verify token using Firebase Identity Toolkit REST API
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadDetails, language = 'English', generateType = 'script', agentName = 'Agent' } = await req.json();
    
    // Security: Input validation and length limits to prevent Prompt Injection and DoS
    if (
      typeof language !== 'string' || language.length > 50 ||
      typeof generateType !== 'string' || generateType.length > 20 ||
      typeof agentName !== 'string' || agentName.length > 100 ||
      !leadDetails || typeof leadDetails !== 'object' || JSON.stringify(leadDetails).length > 5000
    ) {
      return NextResponse.json({ error: "Bad Request: Invalid input parameters" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let prompt = "";
    if (generateType === 'whatsapp') {
      prompt = `You are an expert Loan Direct Selling Agent (DSA). Your name is ${agentName}. Generate a short, highly persuasive, and professional WhatsApp follow-up message for the following lead. Include your name (${agentName}) in the introduction or sign-off.
The message MUST be written in ${language}. If the language is 'Hinglish', write Hindi words using English alphabets (e.g. "Namaste sir, aapka loan...").
Do NOT use markdown. Do NOT use placeholders. Keep it under 50 words. Be conversational.

Lead Details:
${JSON.stringify(leadDetails, null, 2)}`;
    } else {
      prompt = `You are an expert Loan Direct Selling Agent (DSA). Your name is ${agentName}. Generate a personalized, highly persuasive, and professional script for a cold call or follow-up with the following lead. Include your name (${agentName}) in the script's introduction.
Focus on their specific profile, loan amount requested, and employment type. Keep it under 150 words. Be conversational, not a robot.
The script MUST be written in ${language}. If the language is 'Hinglish', write Hindi words using English alphabets (e.g. "Namaste sir, main ${agentName} baat kar raha hoon LoanPro se...").
Also, provide 1 or 2 short tips on how to handle objections for this specific profile in ${language}.

Lead Details:
${JSON.stringify(leadDetails, null, 2)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Failed to generate script. Please try again later." }, { status: 500 });
  }
}

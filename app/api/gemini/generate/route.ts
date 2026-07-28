import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const fbApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${fbApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadDetails, language = 'English', generateType = 'script', agentName = 'Agent' } = await req.json();
    
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

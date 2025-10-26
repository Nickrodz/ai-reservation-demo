// src/elevenlabs.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

// Use your Agent ID
export async function askAgent(userInput, conversationHistory = []) {
  const url = `https://api.elevenlabs.io/v1/agents/${process.env.AGENT_ID}/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_LABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: userInput,
      history: conversationHistory, // optional if API supports
    }),
  });

  const data = await response.json();

  // data.response contains the agent’s reply as text
  return data.response;
}

// Optional: TTS conversion (if Agent doesn't return audio)
export async function getAISpeechResponse(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVEN_LABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!response.ok) {
    console.error("ElevenLabs TTS Error:", await response.text());
    return null;
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString("base64");
  return audioBase64;
}

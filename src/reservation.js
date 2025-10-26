// src/reservation.js
import twilio from "twilio";
import { askAgent, getAISpeechResponse } from "./elevenlabs.js";

const { VoiceResponse } = twilio.twiml;

// In-memory to track call context
const callContext = {};

// Fake availability per date
export const fakeAvailability = {
  "2025-10-25": ["7:30 PM", "8:00 PM", "9:00 PM"],
  "2025-10-26": ["6:00 PM", "7:00 PM", "8:30 PM"],
};

// In-memory reservations for demo
export const reservations = {};

// ------------------
// Incoming call handler
// ------------------
export async function handleIncomingCall(reqBody) {
  const response = new VoiceResponse();
  const callSid = reqBody.CallSid;

  // Initialize context for this call
  callContext[callSid] = {
    messages: [],
    reservation: {
      date: null,
      time: null,
      name: null,
      partySize: null,
    },
  };

  const gather = response.gather({
    input: "speech",
    action: "/voice/handle-gather",
    method: "POST",
    timeout: 5,
  });

  gather.say("Hi, this is Sammy speaking. How can I help you today?");

  return response.toString();
}

// ------------------
// Handle gathered speech
// ------------------
export async function handleGather(reqBody) {
  const callSid = reqBody.CallSid;
  const callerSpeech = reqBody.SpeechResult || "unknown";

  console.log(`Call ${callSid} said:`, callerSpeech);

  const context = callContext[callSid];
  const reservationObj = context.reservation;

  // Save user input in context
  context.messages.push({ role: "user", content: callerSpeech });

  // Determine which date to use for the demo
  let date = reservationObj.date || "2025-10-25"; // default for demo

  // Build demo prompt with fake availability
  const demoPrompt = `
You are Remy, a friendly restaurant reservation assistant.
This is a demo, available times today are: ${fakeAvailability[date].join(", ")}.
Stay on topic, gather the user's name, party size, date, and time.
If the user says something off-topic, politely redirect to making a reservation. 
Always ask the user for missing reservation information. 
Do not assume you have their name, time, or party size. 
If a field is missing, politely ask for it before confirming the reservation.
`;

  // Ask ElevenLabs Agent for AI response
  let aiText;
  try {
    aiText = await askAgent(
      `${demoPrompt}\nUser said: "${callerSpeech}"`,
      context.messages
    );
  } catch (err) {
    console.error("ElevenLabs Agent error:", err);
    aiText = "Sorry, I couldn't process that. Can you repeat?";
  }

  // Update context with AI response
  context.messages.push({ role: "assistant", content: aiText });

  if (aiText) {
    // Assign time if not set
    if (!reservationObj.time) {
      const matchedTime = fakeAvailability[date].find((t) =>
        aiText.includes(t)
      );
      if (matchedTime) reservationObj.time = matchedTime;
    }

    // Assign name if not set
    if (!reservationObj.name) {
      const nameMatch = aiText.match(/under (\w+)/i);
      if (nameMatch) reservationObj.name = nameMatch[1];
    }

    // Assign party size if not set
    if (!reservationObj.partySize) {
      const sizeMatch = aiText.match(/party of (\d+)/i);
      if (sizeMatch) reservationObj.partySize = parseInt(sizeMatch[1]);
    }
  }

  if (!aiText) {
    aiText = "Sorry, something went wrong. Can you repeat that?";
  }

  // Store reservation in memory once both time and name are set
  if (reservationObj.time && reservationObj.name && reservationObj.partySize) {
    if (!reservations[date]) reservations[date] = [];
    reservations[date].push({
      name: reservationObj.name,
      time: reservationObj.time,
      partySize: reservationObj.partySize,
    });
    console.log(
      `✅ Reservation stored: ${reservationObj.name} at ${reservationObj.time}`
    );
  }

  const response = new VoiceResponse();

  // Convert AI text to speech via ElevenLabs
  const aiAudio = await getAISpeechResponse(aiText);

  if (aiAudio) {
    // Demo fallback: Twilio <Play> normally needs a URL; using say() for now
    response.say(aiText);
  } else {
    response.say(aiText);
  }

  // End conversation if AI says goodbye
  if (aiText.toLowerCase().includes("goodbye")) {
    delete callContext[callSid];
  }

  return response.toString();
}

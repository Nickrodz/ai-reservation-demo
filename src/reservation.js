import twilio from "twilio";

const { VoiceResponse } = twilio.twiml;

export async function handleIncomingCall() {
  const response = new VoiceResponse();

  //simple demo conversation
  response.say("Hello! Welcome to the AI Reservation Demo.");
  response.say("What is your name?");

  //gather user inputs(digits) - for now we wont process it yet
  response.gather({
    input: "speech",
    action: "/voice/handle-gather", // future endpoint
    method: "POST",
    timeout: 5,
  });

  return response.toString();
}

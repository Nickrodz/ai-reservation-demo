import express from "express";
import dotenv from "dotenv";
import { handleIncomingCall, handleGather } from "./reservation.js";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio voice webhook
app.post("/voice", async (req, res) => {
  const twimlResponse = await handleIncomingCall(req.body);
  res.type("text/xml");
  res.send(twimlResponse);
});

// handle speech gahtered from twilio
app.post("/voice/handle-gather", async (req, res) => {
  const twimlResponse = await handleGather(req.body);
  res.type("text/xml");
  res.send(twimlResponse);
});

app.get("/", (req, res) => {
  res.send("AI Reservation Backend Running ✅");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

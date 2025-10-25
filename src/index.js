import express from "express";
import dotenv from "dotenv";
import { handleIncomingCall } from "./reservation.js";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio voice webhook
app.post("/voice", async (req, res) => {
  console.log("Incoming Call Data:", req.body);

  const twimlResponse = await handleIncomingCall(req.body);

  res.type("text/xml");
  res.send(twimlResponse);
});

app.get("/", (req, res) => {
  res.send("AI Reservation Backend Running ✅");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "https://abaselam2-arch.github.io";
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not configured.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "20kb" }));

const tutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many tutor requests. Please wait a minute and try again."
  }
});

app.use("/api/tutor", tutorLimiter);

const ALLOWED_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "General"
];

const ALLOWED_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced"
];

const ALLOWED_MODES = [
  "Explain",
  "Hint",
  "Practice",
  "Review"
];

const TUTOR_INSTRUCTIONS = `
You are SYNAPSE AI Tutor, an adaptive educational assistant.

Your goal is to help students understand concepts rather than simply giving
answers.

Teaching rules:

1. Be patient, encouraging, and clear.
2. Adapt explanations to the student's level.
3. Prefer short explanations followed by a question or small task.
4. Use the Socratic method whenever appropriate.
5. Do not immediately reveal a complete solution when the student can
   reasonably solve the next step.
6. Break difficult problems into smaller steps.
7. Correct mistakes gently and explain why they are mistakes.
8. Use examples when they improve understanding.
9. For mathematics and science, show important reasoning and calculations.
10. Never pretend that an answer is correct when it is not.
11. If the student's question is unclear, ask a clarifying question.
12. Keep responses focused on learning.
13. Do not request or expose passwords, API keys, financial credentials,
    or other sensitive information.
14. Do not claim to have performed actions outside this conversation.
15. Avoid unnecessary jargon.

Response style:

- Start directly with the useful teaching response.
- Use simple language.
- Use headings or numbered steps when helpful.
- End with a small question, check, or next step when appropriate.
`;

function isNonEmptyString(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function cleanHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-8)
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length <= 1200
    )
    .map((item) => ({
      role: item.role,
      content: item.content
    }));
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SYNAPSE AI Tutor",
    time: new Date().toISOString()
  });
});

app.post("/api/tutor", async (req, res) => {
  try {
    const {
      message,
      subject = "General",
      level = "Beginner",
      mode = "Explain",
      concept = "General",
      history = []
    } = req.body || {};

    if (!isNonEmptyString(message, 2000)) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be 2000 characters or fewer."
      });
    }

    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subject."
      });
    }

    if (!ALLOWED_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        error: "Invalid learning level."
      });
    }

    if (!ALLOWED_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutoring mode."
      });
    }

    const safeHistory = cleanHistory(history);

    const input = [
      {
        role: "user",
        content: `
Student context:
- Subject: ${subject}
- Level: ${level}
- Mode: ${mode}
- Concept: ${concept}

Conversation history:
${safeHistory
  .map(
    (item) =>
      `${item.role === "user" ? "Student" : "Tutor"}: ${item.content}`
  )
  .join("\n")}

Current student message:
${message}
`
      }
    ];

    const response = await openai.responses.create({
      model: MODEL,
      instructions: TUTOR_INSTRUCTIONS,
      input,
      store: false,
      max_output_tokens: 700
    });

    const answer =
      response.output_text?.trim() ||
      "I could not generate a response. Please try again.";

    return res.json({
      success: true,
      answer,
      model: MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Tutor error:", error);

    return res.status(500).json({
      success: false,
      error: "The AI tutor is temporarily unavailable. Please try again."
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SYNAPSE AI Tutor running on port ${PORT}`);
});

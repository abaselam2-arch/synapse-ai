import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  "https://abaselam2-arch.github.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
===========================================================
SYNAPSE FREE AI TUTOR
===========================================================

This version does NOT use OpenAI or any paid API.

It provides a local educational tutoring engine running
directly on the SYNAPSE backend.

===========================================================
*/

// ---------------------------------------------------------
// BASIC SECURITY
// ---------------------------------------------------------

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


// ---------------------------------------------------------
// RATE LIMIT
// ---------------------------------------------------------

const tutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error:
      "Too many tutor requests. Please wait a minute and try again."
  }
});

app.use("/api/tutor", tutorLimiter);


// ---------------------------------------------------------
// ALLOWED VALUES
// ---------------------------------------------------------

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


// ---------------------------------------------------------
// VALIDATION HELPERS
// ---------------------------------------------------------

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
    .slice(-10)
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length <= 1500
    )
    .map((item) => ({
      role: item.role,
      content: item.content
    }));
}


// ---------------------------------------------------------
// TEXT NORMALIZATION
// ---------------------------------------------------------

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s.+\-*/=()^%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ---------------------------------------------------------
// SUBJECT DETECTION
// ---------------------------------------------------------

function detectTopic(message, subject) {
  const text = normalize(message);

  const topics = {
    Mathematics: [
      "algebra",
      "equation",
      "linear",
      "quadratic",
      "fraction",
      "percentage",
      "percent",
      "ratio",
      "proportion",
      "geometry",
      "triangle",
      "circle",
      "area",
      "volume",
      "derivative",
      "calculus",
      "integral",
      "function",
      "matrix",
      "vector",
      "probability",
      "statistics",
      "logarithm",
      "exponent"
    ],

    Physics: [
      "force",
      "motion",
      "velocity",
      "speed",
      "acceleration",
      "newton",
      "energy",
      "work",
      "power",
      "momentum",
      "gravity",
      "electricity",
      "voltage",
      "current",
      "resistance",
      "circuit",
      "wave",
      "frequency",
      "pressure",
      "density",
      "mass"
    ],

    Chemistry: [
      "atom",
      "molecule",
      "element",
      "periodic",
      "bond",
      "ionic",
      "covalent",
      "acid",
      "base",
      "ph",
      "reaction",
      "oxidation",
      "reduction",
      "mole",
      "stoichiometry",
      "electron",
      "proton"
    ],

    Biology: [
      "cell",
      "dna",
      "rna",
      "gene",
      "mitosis",
      "meiosis",
      "photosynthesis",
      "respiration",
      "enzyme",
      "protein",
      "organ",
      "tissue",
      "ecosystem",
      "evolution",
      "bacteria",
      "virus",
      "genetics"
    ]
  };

  const list = topics[subject] || [];

  for (const topic of list) {
    if (text.includes(topic)) {
      return topic;
    }
  }

  return "general";
}


// ---------------------------------------------------------
// LEVEL INTRO
// ---------------------------------------------------------

function levelInstruction(level) {
  if (level === "Beginner") {
    return "I'll explain it from the fundamentals using simple language.";
  }

  if (level === "Intermediate") {
    return "I'll connect the concept to formulas, reasoning, and examples.";
  }

  return "I'll focus on deeper reasoning, relationships, and problem-solving.";
}


// ---------------------------------------------------------
// MATHEMATICS ENGINE
// ---------------------------------------------------------

function mathematicsTutor(message, level, mode) {
  const text = normalize(message);

  if (
    text.includes("quadratic") ||
    text.includes("quadratic equation")
  ) {
    return `
### Quadratic Equations

A quadratic equation usually has the form:

**ax² + bx + c = 0**

One important method is the quadratic formula:

**x = (-b ± √(b² - 4ac)) / 2a**

The expression:

**b² - 4ac**

is called the **discriminant**.

- If it is positive → two real solutions.
- If it is zero → one repeated real solution.
- If it is negative → no real solutions.

Example:

x² - 5x + 6 = 0

This factors as:

(x - 2)(x - 3) = 0

Therefore:

**x = 2 or x = 3**

${levelInstruction(level)}

**Check:** Can you identify a, b, and c in:

2x² + 7x + 3 = 0?
`;
  }

  if (
    text.includes("percentage") ||
    text.includes("percent")
  ) {
    return `
### Percentage

A percentage means "out of 100."

The basic formula is:

**Percentage = (part / whole) × 100**

Example:

If you score 45 out of 60:

(45 / 60) × 100 = **75%**

So your percentage is **75%**.

${levelInstruction(level)}

**Practice:** What percentage is 30 out of 50?
`;
  }

  if (
    text.includes("area") ||
    text.includes("triangle")
  ) {
    return `
### Triangle Area

The area of a triangle is:

**A = ½ × base × height**

Example:

Base = 10 m  
Height = 6 m

A = ½ × 10 × 6

A = **30 m²**

${levelInstruction(level)}

**Check:** What is the area of a triangle with base 8 m and height 5 m?
`;
  }

  if (
    text.includes("derivative") ||
    text.includes("calculus")
  ) {
    return `
### Derivatives

A derivative measures how quickly one quantity changes with respect to another.

For a simple power:

**d/dx (xⁿ) = n xⁿ⁻¹**

Example:

f(x) = x³

Therefore:

f'(x) = 3x²

So the derivative of x³ is **3x²**.

${levelInstruction(level)}

**Practice:** What is the derivative of x²?
`;
  }

  if (
    text.includes("fraction") ||
    text.includes("fractions")
  ) {
    return `
### Fractions

A fraction has two important parts:

**Numerator / Denominator**

Example:

3/4

- 3 is the numerator.
- 4 is the denominator.

For addition, fractions usually need a common denominator.

Example:

1/4 + 2/4 = 3/4

${levelInstruction(level)}

**Practice:** What is 1/5 + 2/5?
`;
  }

  if (mode === "Hint") {
    return `
### Mathematics Hint

Start by identifying:

1. What information is given?
2. What are you asked to find?
3. Which formula or mathematical relationship connects them?

Don't calculate everything immediately.

Try writing the known values first.

**Your turn:** What values are given in your problem?
`;
  }

  return `
### Mathematics Learning

Let's solve the problem step by step.

First identify:

1. **Known information**
2. **Unknown quantity**
3. **Relevant formula**
4. **Substitution**
5. **Final answer**

${levelInstruction(level)}

Send me the specific mathematics problem and I'll guide you through it step by step.

**Example:**  
"Explain how to solve 2x + 5 = 15."
`;
}


// ---------------------------------------------------------
// PHYSICS ENGINE
// ---------------------------------------------------------

function physicsTutor(message, level, mode) {
  const text = normalize(message);

  if (
    text.includes("force") ||
    text.includes("newton")
  ) {
    return `
### Force

Newton's second law states:

**F = ma**

where:

- F = force in newtons (N)
- m = mass in kilograms (kg)
- a = acceleration in m/s²

Example:

If:

m = 5 kg  
a = 2 m/s²

Then:

F = 5 × 2

**F = 10 N**

${levelInstruction(level)}

**Practice:** If a 10 kg object accelerates at 3 m/s², what force acts on it?
`;
  }

  if (
    text.includes("velocity") ||
    text.includes("speed") ||
    text.includes("motion")
  ) {
    return `
### Motion

Speed tells us how much distance an object travels per unit time.

**Speed = Distance / Time**

Velocity is similar but includes direction.

Example:

Distance = 100 m  
Time = 20 s

Speed = 100 / 20

**Speed = 5 m/s**

${levelInstruction(level)}

**Practice:** An object travels 200 m in 40 seconds. What is its speed?
`;
  }

  if (
    text.includes("energy") ||
    text.includes("kinetic")
  ) {
    return `
### Kinetic Energy

Kinetic energy is the energy an object has because of its motion.

The formula is:

**KE = ½mv²**

where:

m = mass  
v = velocity

Example:

m = 2 kg  
v = 3 m/s

KE = ½ × 2 × 3²

KE = **9 J**

${levelInstruction(level)}

**Check:** What happens to kinetic energy if velocity doubles?
`;
  }

  if (
    text.includes("voltage") ||
    text.includes("current") ||
    text.includes("resistance") ||
    text.includes("circuit")
  ) {
    return `
### Ohm's Law

Ohm's law connects voltage, current, and resistance:

**V = IR**

where:

- V = voltage
- I = current
- R = resistance

Example:

I = 2 A  
R = 5 Ω

V = 2 × 5

**V = 10 V**

${levelInstruction(level)}

**Practice:** If V = 12 V and R = 4 Ω, what is the current?
`;
  }

  return `
### Physics Learning

Physics connects mathematical relationships to physical phenomena.

A good approach is:

1. Identify the known quantities.
2. Identify the unknown.
3. Write the correct formula.
4. Substitute the values.
5. Check the units.
6. Interpret the answer physically.

${levelInstruction(level)}

Send me the specific physics question you are studying.

**Example:**  
"Explain Newton's second law."
`;
}


// ---------------------------------------------------------
// CHEMISTRY ENGINE
// ---------------------------------------------------------

function chemistryTutor(message, level, mode) {
  const text = normalize(message);

  if (
    text.includes("atom") ||
    text.includes("atomic")
  ) {
    return `
### Atoms

An atom is the basic unit of an element.

It contains:

- **Protons** → positive charge
- **Neutrons** → no charge
- **Electrons** → negative charge

Protons and neutrons are found in the nucleus.

Electrons occupy regions around the nucleus.

The atomic number equals the number of protons.

${levelInstruction(level)}

**Check:** If an atom has 6 protons, what is its atomic number?
`;
  }

  if (
    text.includes("ionic") ||
    text.includes("covalent") ||
    text.includes("bond")
  ) {
    return `
### Chemical Bonds

Two important types of chemical bonds are:

**Ionic bond**

Electrons are transferred between atoms.

This commonly occurs between metals and non-metals.

**Covalent bond**

Atoms share electrons.

This commonly occurs between non-metals.

Example:

NaCl contains an ionic bond.

H₂O contains covalent bonds.

${levelInstruction(level)}

**Question:** What is the main difference between electron transfer and electron sharing?
`;
  }

  if (
    text.includes("acid") ||
    text.includes("base") ||
    text.includes("ph")
  ) {
    return `
### Acids, Bases, and pH

The pH scale is commonly used to describe acidity and basicity.

- pH below 7 → acidic
- pH = 7 → neutral
- pH above 7 → basic/alkaline

For example:

Pure water is approximately neutral at pH 7 under standard conditions.

${levelInstruction(level)}

**Practice:** Is a solution with pH 3 acidic or basic?
`;
  }

  if (
    text.includes("mole") ||
    text.includes("molar")
  ) {
    return `
### The Mole

The mole is a counting unit used in chemistry.

One mole contains approximately:

**6.022 × 10²³ particles**

This number is called Avogadro's constant.

The relationship between amount of substance and mass is:

**n = m / M**

where:

n = number of moles  
m = mass  
M = molar mass

${levelInstruction(level)}

**Practice:** If a substance has mass 10 g and molar mass 5 g/mol, how many moles are present?
`;
  }

  return `
### Chemistry Learning

Chemistry explains matter and how substances interact.

A useful study sequence is:

1. Identify the substances.
2. Understand their particles.
3. Identify the chemical relationship.
4. Write the appropriate formula or equation.
5. Balance or calculate when necessary.
6. Interpret the result.

${levelInstruction(level)}

Send me the chemistry concept or problem you are studying.

**Example:**  
"Explain the difference between ionic and covalent bonds."
`;
}


// ---------------------------------------------------------
// BIOLOGY ENGINE
// ---------------------------------------------------------

function biologyTutor(message, level, mode) {
  const text = normalize(message);

  if (
    text.includes("cell") ||
    text.includes("cells")
  ) {
    return `
### The Cell

The cell is the basic structural and functional unit of life.

Important structures include:

**Nucleus**
- Contains genetic material.
- Helps control cellular activities.

**Cell membrane**
- Controls movement of substances into and out of the cell.

**Cytoplasm**
- Site of many cellular reactions.

Plant cells also contain structures such as:

**Chloroplasts**
- Important for photosynthesis.

**Cell wall**
- Provides structural support.

${levelInstruction(level)}

**Check:** Which cell structure contains most of the cell's DNA in a typical eukaryotic cell?
`;
  }

  if (
    text.includes("photosynthesis")
  ) {
    return `
### Photosynthesis

Photosynthesis allows plants and other photosynthetic organisms to convert light energy into chemical energy.

A simplified equation is:

**6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂**

Light energy drives the process.

The main pigment involved is chlorophyll.

Photosynthesis is important because it produces organic molecules that support food webs and releases oxygen.

${levelInstruction(level)}

**Question:** What energy source drives photosynthesis?
`;
  }

  if (
    text.includes("dna") ||
    text.includes("gene") ||
    text.includes("genetics")
  ) {
    return `
### DNA and Genes

DNA is the molecule that stores hereditary information.

A gene is a segment of DNA associated with a functional product or trait.

DNA contains four main bases:

- Adenine (A)
- Thymine (T)
- Cytosine (C)
- Guanine (G)

A pairs with T.

C pairs with G.

${levelInstruction(level)}

**Check:** Which base pairs with adenine in DNA?
`;
  }

  if (
    text.includes("mitosis") ||
    text.includes("meiosis")
  ) {
    return `
### Cell Division

**Mitosis**

Produces daughter cells used for growth, repair, and other functions.

The chromosome number is generally maintained in the daughter cells.

**Meiosis**

Produces cells involved in sexual reproduction and reduces chromosome number by half.

Meiosis also contributes to genetic variation.

${levelInstruction(level)}

**Question:** Which process reduces chromosome number by half: mitosis or meiosis?
`;
  }

  return `
### Biology Learning

Biology studies living systems.

A useful way to understand biology is to move from:

**Molecules → Cells → Tissues → Organs → Organ systems → Organisms → Ecosystems**

${levelInstruction(level)}

Send me the biology topic you want to study.

**Example:**  
"Explain photosynthesis."
`;
}


// ---------------------------------------------------------
// GENERAL TUTOR
// ---------------------------------------------------------

function generalTutor(message, level, mode, concept) {
  const text = normalize(message);

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return `
### Welcome to SYNAPSE

I'm your free SYNAPSE learning tutor.

I can help you study:

- Mathematics
- Physics
- Chemistry
- Biology
- General academic topics

Your current level is **${level}**.

${levelInstruction(level)}

What would you like to learn today?
`;
  }

  if (
    text.includes("study") ||
    text.includes("learn") ||
    text.includes("how can")
  ) {
    return `
### Study Strategy

Try the SYNAPSE learning cycle:

**1. Learn**
Understand the concept.

**2. Practice**
Solve a small problem.

**3. Explain**
Describe the idea in your own words.

**4. Review**
Find what you still don't understand.

**5. Repeat**
Practice the weak area again.

This creates an adaptive learning process instead of simply memorizing answers.

${levelInstruction(level)}

**Next step:** Tell me your subject and topic.
`;
  }

  if (mode === "Hint") {
    return `
### SYNAPSE Hint

Don't try to solve the entire problem at once.

Start with:

1. What do you already know?
2. What exactly are you being asked to find?
3. What concept is involved?
4. What is the first small step?

Your selected concept is:

**${concept}**

What part of the problem is confusing you?
`;
  }

  if (mode === "Practice") {
    return `
### Practice Mode

Let's practice actively.

I'll give you a question rather than immediately giving you the answer.

**Question:**

What is one important concept you are currently studying in ${concept}?

Write your answer in your own words.

Then I'll help you check it.
`;
  }

  if (mode === "Review") {
    return `
### Review Mode

For effective review, remember these three things:

**1. Definition**
What does the concept mean?

**2. Principle**
What rule or relationship controls it?

**3. Application**
How do you use it to solve a problem?

Tell me the concept you want to review and I'll guide you through these three stages.
`;
  }

  return `
### SYNAPSE Tutor

I can help you understand **${concept}**.

Instead of simply giving you an answer, I'll help you build the reasoning step by step.

Try asking:

- "Explain this concept."
- "Give me an example."
- "Give me a practice question."
- "Give me a hint."
- "Why is this answer correct?"
- "Explain it like I'm a beginner."

${levelInstruction(level)}

What would you like to learn?
`;
}


// ---------------------------------------------------------
// MAIN TUTOR ENGINE
// ---------------------------------------------------------

function generateTutorResponse({
  message,
  subject,
  level,
  mode,
  concept,
  history
}) {
  const topic = detectTopic(message, subject);

  /*
   * Use previous conversation context when possible.
   * This is not a large language model, but it allows the
   * tutor to respond more naturally to follow-up messages.
   */

  const previousAssistantMessage =
    [...history]
      .reverse()
      .find((item) => item.role === "assistant");

  if (
    message.length < 20 &&
    previousAssistantMessage
  ) {
    const short = normalize(message);

    if (
      short === "yes" ||
      short === "okay" ||
      short === "ok" ||
      short === "continue" ||
      short === "more"
    ) {
      return `
### Let's Continue

Good. Let's take the next step.

Your previous topic was:

**${concept}**

Try explaining the idea in your own words.

Then I'll help correct or improve your explanation.

**Remember:** understanding the reasoning is more important than memorizing the final answer.
`;
    }
  }

  if (subject === "Mathematics") {
    return mathematicsTutor(message, level, mode);
  }

  if (subject === "Physics") {
    return physicsTutor(message, level, mode);
  }

  if (subject === "Chemistry") {
    return chemistryTutor(message, level, mode);
  }

  if (subject === "Biology") {
    return biologyTutor(message, level, mode);
  }

  return generalTutor(
    message,
    level,
    mode,
    topic !== "general" ? topic : concept
  );
}


// ---------------------------------------------------------
// HEALTH ENDPOINT
// ---------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SYNAPSE Free AI Tutor",
    mode: "free-local-engine",
    ai_provider: "none",
    paid_api_required: false,
    time: new Date().toISOString()
  });
});


// ---------------------------------------------------------
// TUTOR ENDPOINT
// ---------------------------------------------------------

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

    // Validate message
    if (!isNonEmptyString(message, 2000)) {
      return res.status(400).json({
        success: false,
        error:
          "Message is required and must be 2000 characters or fewer."
      });
    }

    // Validate subject
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subject."
      });
    }

    // Validate level
    if (!ALLOWED_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        error: "Invalid learning level."
      });
    }

    // Validate mode
    if (!ALLOWED_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutoring mode."
      });
    }

    // Clean conversation history
    const safeHistory = cleanHistory(history);

    // Generate free tutor response
    const answer = generateTutorResponse({
      message: message.trim(),
      subject,
      level,
      mode,
      concept,
      history: safeHistory
    });

    return res.json({
      success: true,
      answer,
      model: "SYNAPSE-Free-Tutor-v1",
      provider: "SYNAPSE",
      paid_api_required: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Tutor error:", error);

    return res.status(500).json({
      success: false,
      error:
        "The SYNAPSE Free Tutor encountered an unexpected error."
    });
  }
});


// ---------------------------------------------------------
// STATIC FRONTEND
// ---------------------------------------------------------

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// ---------------------------------------------------------
// 404 HANDLER
// ---------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found."
  });
});


// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `SYNAPSE Free AI Tutor running on port ${PORT}`
  );

  console.log(
    `Paid OpenAI API required: NO`
  );

  console.log(
    `Frontend origin: ${FRONTEND_ORIGIN}`
  );
});

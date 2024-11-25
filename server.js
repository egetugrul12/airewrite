require("dotenv").config({ path: "/Users/gg/Desktop/rewrite-backend/secret.env" });
console.log("Loaded API Key:", process.env.OPENAI_API_KEY); // Log the API key to ensure it's loaded
const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Dynamic import for node-fetch

const app = express();
const PORT = 3000;

// Allow cross-origin requests
app.use(cors());
app.use(express.json());

// Test route to check if the server is running
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// Rewrite route to interact with OpenAI API
app.post("/rewrite", async (req, res) => {
  console.log("POST /rewrite called");
  console.log("Request body:", req.body);

  const userInput = req.body.text;
  const rewriteType = req.body.type; // Type of transformation: "longer", "shorter", etc.

  if (!userInput || !rewriteType) {
    console.error("Missing user input or rewrite type");
    return res.status(400).json({ error: "Input text and rewrite type are required" });
  }

  const apiKey = process.env.OPENAI_API_KEY; // Access the variable
console.log("API Key:", apiKey);


  const typePrompts = {
    longer: "Rewrite this text to be longer and more detailed:",
    shorter: "Rewrite this text to be shorter and more concise:",
    professional: "Rewrite this text in a professional tone:",
    nice: "Rewrite this text to sound kind and pleasant:",
    funny: "Rewrite this text to be humorous and entertaining:",
  };

  const prompt = typePrompts[rewriteType];
  if (!prompt) {
    console.error("Invalid rewrite type");
    return res.status(400).json({ error: "Invalid rewrite type" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userInput },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      return res.status(500).json({ error: `Error from OpenAI API. Status: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      const rewrittenText = data.choices[0].message.content.trim();
      console.log("Rewritten text:", rewrittenText);
      res.json({ rewrittenText });
    } else {
      console.error("Unexpected response format:", data);
      res.status(500).json({ error: "Unexpected response from OpenAI API." });
    }
  } catch (error) {
    console.error("Error during API call:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

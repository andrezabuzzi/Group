import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware with increased size limit for images
  app.use(express.json({ limit: "50mb" }));

  // API routes
  app.post("/api/analyze-marker", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Remove data:image/... base64 prefix if exists
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      };

      const textPart = {
        text: "Analyze this Audaces marker (risco) image. Extract these 3 exact values: 1) 'length' (Comprimento do risco): look for the text 'Comprimento: X cm' at the very bottom left status bar. Extract just the number X. 2) 'width' (Largura do risco): look for the text 'Largura: Y cm' right below Comprimento at the very bottom left. Extract just the number Y. 3) 'pieces' (Peças completas/Quantidade): Look at the title bar at the top right (e.g. '... - 3 - LARG 144...'). The number between dashes before LARG is the quantity of pieces (in this case 3). Return JSON with 'length', 'width' and 'pieces'. Return only the numeric strings (e.g., '561.56', '144', '3')."
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              length: { type: Type.STRING, description: "Total length of the marker in cm" },
              width: { type: Type.STRING, description: "Total width of the marker in cm" },
              pieces: { type: Type.STRING, description: "Total number of pieces" }
            },
            required: ["length", "width", "pieces"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        res.json(result);
      } else {
        res.status(500).json({ error: "Could not parse response from AI" });
      }

    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

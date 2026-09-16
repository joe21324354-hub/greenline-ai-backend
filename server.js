const express = require("express");
const multer = require("multer");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post(
  "/generate-design",
  upload.fields([
    { name: "spaceImage", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const spaceImage = req.files.spaceImage?.[0];
      const productImage = req.files.productImage?.[0];

      if (!spaceImage || !productImage) {
        return res.status(400).json({
          error: "Space image and product image are required.",
        });
      }

      const result = await client.images.edit({
        model: "gpt-image-2",

        image: [
          fs.createReadStream(spaceImage.path),
          fs.createReadStream(productImage.path),
        ],

        prompt: `
Create a photorealistic architectural visualization.

Use the first image as the customer's existing space.
Use the second image as the exact Green Line product reference.

Integrate the Green Line product naturally into the customer's space.

IMPORTANT:
- Preserve the real product's recognizable shape.
- Preserve its frame design and material appearance.
- Do not invent a different product.
- Keep the existing architecture and perspective realistic.
- Match lighting, shadows, reflections and scale to the original space.
- Make the result look like a professional architectural photograph.
- Do not add text, logos, people or unrelated objects.

The result should show how this exact Green Line product could look installed in the customer's space.
`,

        size: "1536x1024",
        quality: "medium",
        output_format: "jpeg",
      });

      const imageBase64 = result.data[0].b64_json;

      res.json({
        success: true,
        image: imageBase64,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message || "AI generation failed.",
      });
    }
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Backend running on http://localhost:${PORT}`);
});
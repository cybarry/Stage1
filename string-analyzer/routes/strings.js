import express from "express";
import storage from "../data/storage.js";
import { analyzeString } from "../utils/analyzer.js";


const router = express.Router();

// POST /strings - Analyze and store string
router.post("/", (req, res) => {
  const { value } = req.body;

  // Validate input
  if (value === undefined) {
    return res.status(400).json({ error: "Missing 'value' field." });
  }
  if (typeof value !== "string") {
    return res.status(422).json({ error: "'value' must be a string." });
  }

  // Analyze string
  const properties = analyzeString(value);
  const id = properties.sha256_hash;

  // Check if already exists
  if (storage.has(id)) {
    return res.status(409).json({ error: "String already exists in the system." });
  }

  // Store result
  const analyzedData = {
    id,
    value,
    properties,
    created_at: new Date().toISOString(),
  };
  storage.set(id, analyzedData);

  // Return response
  return res.status(201).json(analyzedData);
});

// ✅ GET /strings/:string_value - Retrieve a specific analyzed string
router.get("/:string_value", (req, res) => {
  const { string_value } = req.params;

  // Recalculate SHA-256 hash (used as ID)
  import("crypto").then((crypto) => {
    const sha256_hash = crypto
      .createHash("sha256")
      .update(string_value)
      .digest("hex");

    // Check if exists in storage
    if (!storage.has(sha256_hash)) {
      return res
        .status(404)
        .json({ error: "String does not exist in the system." });
    }

    const record = storage.get(sha256_hash);
    return res.status(200).json(record);
  });
});

export default router;

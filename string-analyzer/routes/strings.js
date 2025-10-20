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

export default router;

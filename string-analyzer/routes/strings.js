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

// GET /strings/:string_value - Retrieve a specific analyzed string
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

// ✅ GET /strings - Retrieve all strings with optional filters
router.get("/", (req, res) => {
  try {
    const {
      is_palindrome,
      min_length,
      max_length,
      word_count,
      contains_character,
    } = req.query;

    let results = Array.from(storage.values());
    const filtersApplied = {};

    // Validate query types and apply filters

    if (is_palindrome !== undefined) {
      if (is_palindrome !== "true" && is_palindrome !== "false") {
        return res
          .status(400)
          .json({ error: "Invalid value for is_palindrome. Use true or false." });
      }
      const boolValue = is_palindrome === "true";
      results = results.filter((item) => item.properties.is_palindrome === boolValue);
      filtersApplied.is_palindrome = boolValue;
    }

    if (min_length !== undefined) {
      const num = parseInt(min_length);
      if (isNaN(num)) {
        return res.status(400).json({ error: "min_length must be an integer." });
      }
      results = results.filter((item) => item.properties.length >= num);
      filtersApplied.min_length = num;
    }

    if (max_length !== undefined) {
      const num = parseInt(max_length);
      if (isNaN(num)) {
        return res.status(400).json({ error: "max_length must be an integer." });
      }
      results = results.filter((item) => item.properties.length <= num);
      filtersApplied.max_length = num;
    }

    if (word_count !== undefined) {
      const num = parseInt(word_count);
      if (isNaN(num)) {
        return res.status(400).json({ error: "word_count must be an integer." });
      }
      results = results.filter((item) => item.properties.word_count === num);
      filtersApplied.word_count = num;
    }

    if (contains_character !== undefined) {
      if (contains_character.length !== 1) {
        return res.status(400).json({
          error: "contains_character must be a single character.",
        });
      }
      const char = contains_character.toLowerCase();
      results = results.filter((item) =>
        item.value.toLowerCase().includes(char)
      );
      filtersApplied.contains_character = char;
    }

    return res.status(200).json({
      data: results,
      count: results.length,
      filters_applied: filtersApplied,
    });
  } catch (err) {
    console.error("Error filtering strings:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;

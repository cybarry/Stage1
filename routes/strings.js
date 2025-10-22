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


// GET /strings - List all strings with optional query filters
// Query params: is_palindrome (true/false), min_length, max_length, word_count, contains_character
router.get("/", (req, res) => {
  try {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

    const parsedFilters = {};

    if (is_palindrome !== undefined) {
      if (is_palindrome !== 'true' && is_palindrome !== 'false') {
        return res.status(400).json({ error: "is_palindrome must be 'true' or 'false'" });
      }
      parsedFilters.is_palindrome = is_palindrome === 'true';
    }

    if (min_length !== undefined) {
      const n = parseInt(min_length, 10);
      if (Number.isNaN(n)) return res.status(400).json({ error: "min_length must be an integer" });
      parsedFilters.min_length = n;
    }

    if (max_length !== undefined) {
      const n = parseInt(max_length, 10);
      if (Number.isNaN(n)) return res.status(400).json({ error: "max_length must be an integer" });
      parsedFilters.max_length = n;
    }

    if (word_count !== undefined) {
      const n = parseInt(word_count, 10);
      if (Number.isNaN(n)) return res.status(400).json({ error: "word_count must be an integer" });
      parsedFilters.word_count = n;
    }

    if (contains_character !== undefined) {
      if (typeof contains_character !== 'string' || contains_character.length !== 1) {
        return res.status(400).json({ error: "contains_character must be a single character" });
      }
      parsedFilters.contains_character = contains_character.toLowerCase();
    }

    // Conflict detection: min > max
    if (parsedFilters.min_length !== undefined && parsedFilters.max_length !== undefined) {
      if (parsedFilters.min_length > parsedFilters.max_length) {
        return res.status(400).json({ error: "min_length cannot be greater than max_length" });
      }
    }

    let results = Array.from(storage.values());

    if (parsedFilters.is_palindrome !== undefined) {
      results = results.filter(r => r.properties.is_palindrome === parsedFilters.is_palindrome);
    }

    if (parsedFilters.min_length !== undefined) {
      results = results.filter(r => r.properties.length >= parsedFilters.min_length);
    }

    if (parsedFilters.max_length !== undefined) {
      results = results.filter(r => r.properties.length <= parsedFilters.max_length);
    }

    if (parsedFilters.word_count !== undefined) {
      results = results.filter(r => r.properties.word_count === parsedFilters.word_count);
    }

    if (parsedFilters.contains_character !== undefined) {
      const ch = parsedFilters.contains_character;
      results = results.filter(r => r.value.toLowerCase().includes(ch));
    }

    return res.status(200).json({
      data: results,
      count: results.length,
      filters_applied: parsedFilters,
    });
  } catch (err) {
    console.error("Error in listing strings:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// GET /strings/:value - Retrieve a specific analyzed string by its raw value
router.get("/:value", (req, res) => {
  try {
    const raw = req.params.value;
    if (!raw) return res.status(400).json({ error: "Value parameter is required." });

    // Compute id using same analysis (sha256)
    const props = analyzeString(raw);
    const id = props.sha256_hash;

    if (!storage.has(id)) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    const record = storage.get(id);
    return res.status(200).json(record);
  } catch (err) {
    console.error("Error fetching string:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// DELETE /strings/:value - Delete a stored string by its raw value
router.delete("/:value", (req, res) => {
  try {
    const raw = req.params.value;
    if (!raw) return res.status(400).json({ error: "Value parameter is required." });

    const props = analyzeString(raw);
    const id = props.sha256_hash;

    if (!storage.has(id)) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    storage.delete(id);
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting string:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get("/:value", (req, res) => {
  try {
    const raw = req.params.value;
    if (!raw) return res.status(400).json({ error: "Value parameter is required." });

    // Compute id using same analysis (sha256)
    const props = analyzeString(raw);
    const id = props.sha256_hash;

    if (!storage.has(id)) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    const record = storage.get(id);
    return res.status(200).json(record);
  } catch (err) {
    console.error("Error fetching string:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


// DELETE /strings/:value - Delete a stored string by its raw value
router.delete("/:value", (req, res) => {
  try {
    const raw = req.params.value;
    if (!raw) return res.status(400).json({ error: "Value parameter is required." });

    const props = analyzeString(raw);
    const id = props.sha256_hash;

    if (!storage.has(id)) {
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    storage.delete(id);
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting string:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;

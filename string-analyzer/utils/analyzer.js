import crypto from "crypto";

export const analyzeString = (value) => {
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  const is_palindrome = normalized === normalized.split("").reverse().join("");
  const unique_characters = new Set(value.toLowerCase()).size;
  const word_count = value.trim().split(/\s+/).length;
  const length = value.length;

  const sha256_hash = crypto.createHash("sha256").update(value).digest("hex");

  // Character frequency map
  const character_frequency_map = {};
  for (let char of value) {
    character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
  }

  return {
    length,
    is_palindrome,
    unique_characters,
    word_count,
    sha256_hash,
    character_frequency_map,
  };
};

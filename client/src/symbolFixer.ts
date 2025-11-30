// src/symbolFixer.ts
// Auto Symbol Fixer - lightweight fuzzy matching + heuristics
// Uses local symbol DB (symbolDatabase.ts) to find best candidate.

import { stockDB } from "./symbolDatabase";

/**
 * Normalize user input (remove punctuation, trailing dots, extra spaces)
 */
function normalizeInput(s: string) {
  return (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/ ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Basic Levenshtein distance
 */
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * similarity score between 0..1 (1 = exact)
 */
function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  a = a.toUpperCase();
  b = b.toUpperCase();
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

/**
 * Candidate scoring:
 * - exact symbol or numeric code = top priority
 * - symbol match high score
 * - name match uses similarity on full name
 */
export function findBestSymbol(inputRaw: string) {
  const input = normalizeInput(inputRaw);
  if (!input) return { symbol: "", score: 0, reason: "empty" };

  // if user typed full numeric BSE code (5-6 digits), return it if present in DB
  const numeric = input.match(/^\d{5,6}$/);
  if (numeric) {
    const found = stockDB.find((s) => s.symbol === input);
    if (found) return { symbol: found.symbol, score: 1, reason: "exact_bse" };
    // no exact DB match — still return numeric (user may know BSE code even if DB lacks it)
    return { symbol: input, score: 0.95, reason: "numeric_guess" };
  }

  // direct exact symbol match (RELIANCE, TCS, BTC etc.)
  const exact = stockDB.find((s) => s.symbol === input);
  if (exact) return { symbol: exact.symbol, score: 1, reason: "exact_symbol" };

  // try to match by symbol with common punctuations removed (e.g., "TCS." => TCS)
  const cleaned = input.replace(/\.$/, "");
  const exact2 = stockDB.find((s) => s.symbol === cleaned);
  if (exact2) return { symbol: exact2.symbol, score: 0.99, reason: "exact_symbol_punct" };

  // build candidate list and score them
  const candidates = stockDB.map((s) => {
    const scoreSymbol = similarity(input, s.symbol);
    const scoreName = similarity(input, s.name);
    // boost symbol matches
    const score = Math.max(scoreSymbol * 1.1, scoreName * 0.95);
    return { symbol: s.symbol, name: s.name, score, s };
  });

  // also consider direct start-with name matches (high relevance)
  const starts = stockDB
    .filter((s) => s.name.toLowerCase().startsWith(input.toLowerCase()))
    .map((s) => ({ symbol: s.symbol, name: s.name, score: 0.92, s }));

  const all = [...candidates, ...starts];

  // sort by score desc
  all.sort((a, b) => b.score - a.score);

  const best = all[0];
  if (!best) return { symbol: input, score: 0.2, reason: "fallback" };

  // heuristics: if top score is too low, we still might return the raw input (user may want global stock)
  // thresholds:
  // >= 0.80 -> strong match
  // 0.60 - 0.79 -> medium
  // < 0.60 -> weak -> return raw symbol but offer suggestion
  if (best.score >= 0.8) {
    return { symbol: best.symbol, score: best.score, reason: "high_confidence", name: best.name };
  }
  if (best.score >= 0.6) {
    return { symbol: best.symbol, score: best.score, reason: "medium_confidence", name: best.name };
  }

  // fallback: try using raw input as symbol (useful for NASDAQ tickers)
  return { symbol: input, score: best.score, reason: "low_confidence", suggestion: best.symbol, suggestionName: best.name };
}

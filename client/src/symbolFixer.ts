// client/src/symbolFixer.ts
import { stockDB } from "./symbolDatabase";

/** Normalize input string */
function normalizeInput(s: string) {
  return (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/ ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance (small optimized) */
function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v0 = new Array(n + 1);
  const v1 = new Array(n + 1);
  for (let i = 0; i <= n; i++) v0[i] = i;
  for (let i = 0; i < m; i++) {
    v1[0] = i + 1;
    const ai = a.charAt(i);
    for (let j = 0; j < n; j++) {
      const cost = ai === b.charAt(j) ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= n; j++) v0[j] = v1[j];
  }
  return v1[n];
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  a = a.toUpperCase(); b = b.toUpperCase();
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

/** Detect probable exchange by input pattern */
export function detectExchangeFromInput(raw: string) {
  const input = normalizeInput(raw);
  if (!input) return "UNKNOWN";
  if (/^\d{5,6}$/.test(input)) return "BSE"; // numeric scripcode -> BSE
  if (input.includes("/")) return "FOREX";
  if (["BTC", "ETH", "DOGE"].includes(input.split(" ")[0])) return "CRYPTO";
  // check DB presence
  const exact = stockDB.find((s) => s.symbol === input);
  if (exact) return exact.exchange || "NSE";
  // fallback to NSE as default for alpha tickers
  return "NSE";
}

/** Find best symbol suggestion and recommended exchange */
export function findBestSymbol(inputRaw: string) {
  const input = normalizeInput(inputRaw);
  if (!input) return { symbol: "", score: 0, exchange: "UNKNOWN" };

  // numeric BSE code quick return
  if (/^\d{5,6}$/.test(input)) {
    const found = stockDB.find((s) => s.symbol === input && s.exchange === "BSE");
    if (found) return { symbol: found.symbol, score: 1, exchange: "BSE", name: found.name };
    return { symbol: input, score: 0.95, exchange: "BSE", name: null };
  }

  // exact symbol match
  const exact = stockDB.find((s) => s.symbol === input);
  if (exact) return { symbol: exact.symbol, score: 1, exchange: exact.exchange, name: exact.name };

  // compute similarity against DB (symbol + name)
  const candidates = stockDB.map((s) => {
    const scoreSymbol = similarity(input, s.symbol);
    const scoreName = similarity(input, s.name);
    const score = Math.max(scoreSymbol * 1.15, scoreName * 0.95);
    return { symbol: s.symbol, name: s.name, exchange: s.exchange, score };
  });

  // sort
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // heuristics
  if (!best) return { symbol: input, score: 0.2, exchange: "GLOBAL" };
  if (best.score >= 0.8) return { symbol: best.symbol, score: best.score, exchange: best.exchange, name: best.name };
  if (best.score >= 0.6) return { symbol: best.symbol, score: best.score, exchange: best.exchange, name: best.name };
  // weak -> return raw but suggest best
  return { symbol: input, score: best.score, exchange: detectExchangeFromInput(inputRaw), suggestion: best.symbol, suggestionExchange: best.exchange, suggestionName: best.name };
}

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let symbolList = [];

/* -----------------------------------------
   CUSTOM SYMBOL MAPPINGS (ETFs & special)
------------------------------------------*/
const customMap = {
    "gold": "SBIGETS",
    "gold etf": "SBIGETS",
    "sbi gold": "SBIGETS",
    "sbi gold etf": "SBIGETS",
    "gold bees": "GOLDBEES",
    "nifty 50 etf": "SETFNIF50",
    "nifty etf": "SETFNIF50",
    "nifty50 etf": "SETFNIF50",
    "junior nifty": "SETFNIFJR",
    "nifty next 50": "SETFNIFJR",
    "next 50 etf": "SETFNIFJR"
};

/* -----------------------------------------
   LOAD CSV (runs only once when server starts)
------------------------------------------*/
const loadSymbols = () => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, "symbols.csv"))
            .pipe(csv())
            .on("data", (row) => {
                symbolList.push({
                    symbol: row.SYMBOL,
                    name: row["NAME OF COMPANY"].toLowerCase()
                });
            })
            .on("end", () => {
                console.log("✔ NSE symbols loaded:", symbolList.length);
                resolve();
            })
            .on("error", reject);
    });
};

/* -----------------------------------------
    MAIN FUNCTION — convert stock name → symbol
------------------------------------------*/
function getSymbol(userInput) {
    userInput = userInput.toLowerCase().trim();

    // 1️⃣ Check in custom map first (ETFs, special cases, gold, etc.)
    if (customMap[userInput]) {
        return customMap[userInput];
    }

    // 2️⃣ Exact symbol match (when user types SBIN, INFY etc.)
    const exact = symbolList.find(
        item => item.symbol.toLowerCase() === userInput
    );
    if (exact) return exact.symbol;

    // 3️⃣ Partial name match (user types “reliance”, “tata motors”)
    const partial = symbolList.find(
        item => item.name.includes(userInput)
    );
    if (partial) return partial.symbol;

    // 4️⃣ No match
    return null;
}

module.exports = { loadSymbols, getSymbol };

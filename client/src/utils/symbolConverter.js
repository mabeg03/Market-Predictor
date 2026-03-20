export function getYahooSymbol(stock){

 if(stock.exchange === "NSE"){
  return stock.symbol + ".NS"
 }

 if(stock.exchange === "BSE"){
  return stock.symbol + ".BO"
 }

 return stock.symbol
}
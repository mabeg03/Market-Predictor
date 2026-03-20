import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import ta

def predict(symbol):

    data = yf.download(symbol, period="2y", interval="1d")

    data["Return"] = data["Close"].pct_change()
    data["MA10"] = data["Close"].rolling(10).mean()
    data["MA50"] = data["Close"].rolling(50).mean()
    data["Momentum"] = data["Close"] - data["Close"].shift(5)

    # Indicators
    data["RSI"] = ta.momentum.RSIIndicator(data["Close"], window=14).rsi()

    macd = ta.trend.MACD(data["Close"])
    data["MACD"] = macd.macd()
    data["MACD_signal"] = macd.macd_signal()

    data["ATR"] = ta.volatility.AverageTrueRange(
        data["High"], data["Low"], data["Close"]
    ).average_true_range()

    data["VolumeChange"] = data["Volume"].pct_change()

    # Target
    data["Target"] = np.where(data["Close"].shift(-1) > data["Close"], 1, 0)

    data = data.dropna()

    features = data[
        ["Return","MA10","MA50","Momentum","RSI","MACD","MACD_signal","ATR","VolumeChange"]
    ]
    target = data["Target"]

    # Train/Test split (NO leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, shuffle=False
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        random_state=42
    )

    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)

    latest = features.iloc[-1:].values

    pred = model.predict(latest)[0]
    prob = model.predict_proba(latest)[0][pred]

    # Smart signal
    if prob > 0.7:
        signal = "STRONG BUY" if pred == 1 else "STRONG SELL"
    elif prob > 0.55:
        signal = "BUY" if pred == 1 else "SELL"
    else:
        signal = "HOLD"

    return {
        "signal": signal,
        "confidence": round(prob * 100, 2),
        "accuracy": round(accuracy * 100, 2)
    }


if __name__ == "__main__":
    import sys
    symbol = sys.argv[1]
    import json
    print(json.dumps(predict(symbol)))
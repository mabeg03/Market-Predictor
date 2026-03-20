const {RandomForestRegression} = require("ml-random-forest");

function trainModel(data){

const features=[];
const labels=[];

data.forEach(d=>{
features.push([
d.rsi,
d.macd,
d.ma50trend,
d.ma200trend,
d.momentum,
d.volumeSpike,
d.volatility
]);

labels.push(d.futureMove);
});

const rf = new RandomForestRegression({
nEstimators:100
});

rf.train(features,labels);

return rf;

}

function predict(model,input){

const prediction = model.predict([[
input.rsi,
input.macd,
input.ma50trend,
input.ma200trend,
input.momentum,
input.volumeSpike,
input.volatility
]]);

return prediction[0];

}

module.exports={
trainModel,
predict
};
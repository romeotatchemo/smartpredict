export function interpretPrediction(outputs) {
  const [churn, conversion, abuse] = outputs;
  return {
    churn: churn.dataSync()[0],
    conversion: conversion.dataSync()[0],
    abuse: abuse.dataSync()[0],
  };
}

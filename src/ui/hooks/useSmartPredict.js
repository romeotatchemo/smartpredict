import { useContext } from "react";
import { SmartPredictContext } from "../../context/SmartPredictContext";

export const useSmartPredict = () => {
  const context = useContext(SmartPredictContext);

  if (!context) {
    throw new Error(
      "❌ USE_SMART_PREDICT ERROR: This hook must be used within a <SmartPredictProvider>.",
    );
  }

  return context;
};

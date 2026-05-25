import { logger } from "../utils/logger";
import { storageManager } from "../data/StorageManager";
import { dataCleaner } from "../data/DataCleaner";
import { temporalExtractor } from "../features/TemporalExtractor";
import { featureNormalizer } from "../features/FeatureNormalizer";
import { pageEncoder } from "../features/CategoricalEncoder";
import { featureValidator } from "../features/FeatureValidator";

// ===== One-hot encode une action =====
function encodeActionOneHot(actionType) {
  // Encode ONE of the 4 NEW actions (HOVER:4, INPUT:5, ERROR:6, NAV:7)
  // Les anciennes actions (CLICK:0, SCROLL:1, SUBMIT:2, VIEW:3) mappent à all-zeros
  // Car le model accepte: 4 temporal + 8 pages + 4 action features
  // Les 4 features d'action codent seulement les 4 NEW actions
  const vector = new Array(4).fill(0);

  // Mapper l'action au vecteur one-hot
  // HOVER:4 -> [1,0,0,0], INPUT:5 -> [0,1,0,0], ERROR:6 -> [0,0,1,0], NAV:7 -> [0,0,0,1]
  if (actionType === 4) vector[0] = 1; // HOVER
  if (actionType === 5) vector[1] = 1; // INPUT
  if (actionType === 6) vector[2] = 1; // ERROR
  if (actionType === 7) vector[3] = 1; // NAV
  // Les anciennes actions (0-3) restent [0,0,0,0]

  return vector;
}

export class DataPipeline {
  async run(windowSize = 30) {
    // logger.info("PIPELINE: Start extraction sequence...");

    const raw = await storageManager.getRecentHistory(windowSize);
    const events = dataCleaner.clean(raw);

    if (events.length === 0) {
      // logger.debug("PIPELINE: No events found in window.");
      return [];
    }

    // logger.debug("PIPELINE: Processing events", { count: events.length });

    const tensors = events.map((event) => {
      const temporal = temporalExtractor.process(event.timestamp);

      const context = event.payload.page || "unknown";
      const categorical = pageEncoder.encode(context);

      // Encoder l'action (extraire le type d'action du payload)
      const actionType = event.type || "VIEW"; // Défaut à VIEW
      // Mapper le type d'action string à un nombre
      const ACTION_TYPE_MAP = {
        CLICK: 0,
        SCROLL: 1,
        SUBMIT: 2,
        VIEW: 3,
        HOVER: 4,
        INPUT: 5,
        ERROR: 6,
        NAV: 7,
      };
      const actionCode = ACTION_TYPE_MAP[actionType] || 3;
      const actionOneHot = encodeActionOneHot(actionCode);

      const baseFeatures = { ...temporal };
      featureNormalizer.updateBounds(baseFeatures);

      const normalized = featureNormalizer.normalize(baseFeatures);

      return {
        ...normalized,
        pageOneHot: categorical,
        actionOneHot: actionOneHot,
      };
    });

    const validTensors = tensors.filter((t) => featureValidator.validate(t));

    // logger.info("PIPELINE: Extraction complete.", {
    //   total: tensors.length,
    //   valid: validTensors.length,
    // });

    return validTensors;
  }
}

export const dataPipeline = new DataPipeline();

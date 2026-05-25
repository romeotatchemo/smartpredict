import { logger } from "../utils/logger.js";

export class CategoricalEncoder {
  constructor(vocabSize = 50) {
    this.vocabSize = vocabSize;
    this.mapping = { "<UNK>": 0 };
    this.isFitted = false;
  }

  _clean(text) {
    if (!text) return "<UNK>";
    return text.toLowerCase().split("?")[0].trim();
  }

  fit(rawValues) {
    // logger.info(`Training Encoder on ${rawValues.length} items`);
    const counts = {};
    rawValues.forEach((val) => {
      const cleanVal = this._clean(val);
      counts[cleanVal] = (counts[cleanVal] || 0) + 1;
    });

    const sortedKeys = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a],
    );

    const topKeys = sortedKeys.slice(0, this.vocabSize - 1);

    this.mapping = { "<UNK>": 0 };
    topKeys.forEach((key, index) => {
      this.mapping[key] = index + 1;
    });

    this.isFitted = true;
    // logger.info(" Vocabulary built:", this.mapping);
  }

  encode(value) {
    if (!this.isFitted) {
      logger.warn("Encoder not fitted! Returning UNK.");
      return new Array(this.vocabSize).fill(0);
    }

    const cleanVal = this._clean(value);

    const index = this.mapping.hasOwnProperty(cleanVal)
      ? this.mapping[cleanVal]
      : 0;

    const vector = new Array(this.vocabSize).fill(0);
    vector[index] = 1;

    return vector;
  }
}

export const pageEncoder = new CategoricalEncoder(8);

import { ACTION_TYPES } from './event.schema';

export class DataProcessor {
  constructor() {
    this.actionEncoding = {
      [ACTION_TYPES.CLICK]: 1,
      [ACTION_TYPES.SCROLL]: 2,
      [ACTION_TYPES.SUBMIT]: 3,
      [ACTION_TYPES.VIEW]: 4,
    };
  }

  process(events, windowDurationSeconds = 30) {
    const now = Date.now();
    const startTime = now - windowDurationSeconds * 1000;

    const windowedEvents = events.filter((e) => e.timestamp >= startTime);

    if (windowedEvents.length === 0) return [];

    return windowedEvents.map((event) => this.vectorize(event, startTime));
  }

  vectorize(event, windowStartTime) {
    const relativeTime = (event.timestamp - windowStartTime) / 1000;

    const actionCode = this.actionEncoding[event.type] || 0;

    let normalizedValue = 0;

    if (event.type === ACTION_TYPES.SCROLL) {
      normalizedValue = (event.payload.percent || 0) / 100;
    } else if (event.type === ACTION_TYPES.SUBMIT) {
      normalizedValue = 1;
    }

    return { t: relativeTime, a: actionCode, v: normalizedValue };
  }
}

export const dataProcessor = new DataProcessor();

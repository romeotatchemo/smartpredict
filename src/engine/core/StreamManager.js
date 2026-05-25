import { EventNormalizer } from '../data/EventNormalizer';

class StreamManager {
  constructor() {
    this.stream = [];
    this.subscribers = [];
  }

  push(action, context) {
    const event = EventNormalizer.normalize(action, context);

    if (!event) return;

    this.stream.push(event);
    this.notify(event);
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify(event) {
    this.subscribers.forEach((callback) => callback(event));
  }
}

export const smartStream = new StreamManager();

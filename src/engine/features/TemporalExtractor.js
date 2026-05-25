const WINDOW_SIZE = 5;
const EPSILON = 0.001;

export class TemporalExtractor {
  constructor() {
    this.reset();
  }

  reset() {
    this.lastTimestamp = null;
    this.previousVelocity = 0;
    this.deltaBuffer = [];
    this.startTime = null;
  }

  process(currentTimestamp) {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = currentTimestamp;
      this.startTime = currentTimestamp;
      return { deltaTime: 0, velocity: 0, acceleration: 0, relativeTime: 0 };
    }

    let deltaTime = (currentTimestamp - this.lastTimestamp) / 1000;

    if (deltaTime < 0) deltaTime = 0;

    const relativeTime = (currentTimestamp - this.startTime) / 1000;

    this.deltaBuffer.push(deltaTime);

    if (this.deltaBuffer.length > WINDOW_SIZE) {
      this.deltaBuffer.shift();
    }

    const avgDelta =
      this.deltaBuffer.reduce((a, b) => a + b, 0) / this.deltaBuffer.length;

    const velocity = 1 / (avgDelta + EPSILON);

    const acceleration = velocity - this.previousVelocity;

    this.lastTimestamp = currentTimestamp;
    this.previousVelocity = velocity;

    return {
      deltaTime,
      velocity,
      acceleration,
      relativeTime,
    };
  }
}

export const temporalExtractor = new TemporalExtractor();

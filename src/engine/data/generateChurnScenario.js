import { smartStream } from "../core/StreamManager";
import { ACTION_TYPES } from "../data/event.schema";
import { logger } from "../utils/logger.js";

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomDelay(min = 200, max = 800) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export async function generateChurnScenario() {
  logger.info("🔥 CHURN SIMULATION: Starting negative user journey...");

  const pages = ["/home", "/features", "/pricing", "/help", "/unsubscribe"];

  // 1️⃣ Navigation hésitante
  for (let i = 0; i < 5; i++) {
    smartStream.push(ACTION_TYPES.VIEW, {
      page: pages[i],
    });

    await wait(randomDelay());

    // Scroll court et peu engagé
    smartStream.push(ACTION_TYPES.SCROLL, {
      percent: Math.floor(Math.random() * 30), // scroll faible
      page: pages[i],
    });

    await wait(randomDelay());
  }

  // 2️⃣ Consultation pricing répétée
  for (let i = 0; i < 3; i++) {
    smartStream.push(ACTION_TYPES.VIEW, {
      page: "/pricing",
    });

    await wait(randomDelay(300, 1000));
  }

  // 3️⃣ Clic hésitant sur unsubscribe
  smartStream.push(ACTION_TYPES.CLICK, {
    element: "btn_unsubscribe",
    page: "/unsubscribe",
  });

  await wait(randomDelay(500, 1200));

  // 4️⃣ Scroll très faible (désengagement)
  smartStream.push(ACTION_TYPES.SCROLL, {
    percent: 10,
    page: "/unsubscribe",
  });

  logger.info("⚠️ CHURN SIMULATION: User session ended (drop-off).");
}

export function generateRiskUserHistory() {
  const baseTime = Date.now();

  const history = {
    userId: "user_risk_001",
    sessionId: "session_" + Math.floor(Math.random() * 100000),
    events: [
      { type: "VIEW", page: "/home", timestamp: baseTime },

      {
        type: "SCROLL",
        page: "/home",
        percent: 65,
        timestamp: baseTime + 2500,
      },

      { type: "VIEW", page: "/features", timestamp: baseTime + 5000 },

      {
        type: "SCROLL",
        page: "/features",
        percent: 40,
        timestamp: baseTime + 8000,
      },

      { type: "VIEW", page: "/pricing", timestamp: baseTime + 12000 },

      {
        type: "SCROLL",
        page: "/pricing",
        percent: 20,
        timestamp: baseTime + 15000,
      },

      { type: "VIEW", page: "/help", timestamp: baseTime + 25000 },

      {
        type: "SCROLL",
        page: "/help",
        percent: 15,
        timestamp: baseTime + 29000,
      },

      { type: "VIEW", page: "/pricing", timestamp: baseTime + 45000 },

      {
        type: "SCROLL",
        page: "/pricing",
        percent: 10,
        timestamp: baseTime + 48000,
      },

      {
        type: "CLICK",
        page: "/account",
        element: "btn_settings",
        timestamp: baseTime + 60000,
      },

      { type: "VIEW", page: "/unsubscribe", timestamp: baseTime + 85000 },

      {
        type: "SCROLL",
        page: "/unsubscribe",
        percent: 5,
        timestamp: baseTime + 88000,
      },
    ],
  };

  history.events.forEach((event) => {
    smartStream.push(event.type, event);
  });
}

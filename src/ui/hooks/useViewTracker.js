import { useEffect } from "react";
import { smartStream } from "../../engine/core/StreamManager";
import { useLocation } from "react-router";
import { ACTION_TYPES } from "../../engine/data/event.schema";

export const useViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    smartStream.push(ACTION_TYPES.VIEW, {
      path: currentPath,
      timestamp: Date.now(),
    });
  }, [location.pathname]);
};

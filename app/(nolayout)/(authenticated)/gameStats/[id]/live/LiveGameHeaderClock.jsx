"use client";
import { useGame } from "@/contexts/GameLiveContext";
import { useEffect, useState } from "react";

// Scoreboard.jsx
function LiveGameHeaderClock() {
  const { game, calculatePeriodTime, formatTime } = useGame();
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!game.isRunning) {
      setDisplayTime(calculatePeriodTime());
      return;
    }

    const interval = setInterval(() => {
      setDisplayTime(calculatePeriodTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [game.isRunning, calculatePeriodTime]);

  return <div>{formatTime(displayTime)}</div>;
}

export default LiveGameHeaderClock;

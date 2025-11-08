"use client";
import { useGame } from "@/contexts/GameLiveContext";
import { useEffect, useState } from "react";

// Scoreboard.jsx
function LiveGameHeaderClock() {
  const { getPeriodTime, formatTime, gameStage } = useGame();

  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    if (gameStage !== "during_period") return;
    const interval = setInterval(() => {
      setDisplayTime(getPeriodTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [getPeriodTime]);

  return <div>{formatTime(displayTime)}</div>;
}

export default LiveGameHeaderClock;

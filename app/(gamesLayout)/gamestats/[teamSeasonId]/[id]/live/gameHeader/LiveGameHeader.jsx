"use client";

import { useState, useEffect } from "react";
import useGameStore from "@/stores/gameStore";
import { apiFetch } from "@/app/api/fetcher";

function GameHeader() {
  const game = useGameStore((s) => s.game);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [scoreMode, setScoreMode] = useState("calculated"); // 'manual' or 'calculated'

  // Fetch score - Priority: game_scores table > calculated from events
  useEffect(() => {
    const fetchScore = async () => {
      if (!game?.game_id) return;

      try {
        // Check for manual score entry first
        const [scoreData] = await apiFetch("game_scores", "GET", null, null, {
          filters: { game_id: game.game_id },
        });

        if (scoreData) {
          // Manual score exists - use it
          setScore({
            home: scoreData.home_score || 0,
            away: scoreData.away_score || 0,
          });
          setScoreMode("manual");
        } else {
          // No manual score - calculate from goal events
          const events = await apiFetch("game_events", "GET", null, null, {
            filters: { game_id: game.game_id, event_type: "goal" },
          });

          let homeGoals = 0;
          let awayGoals = 0;

          events.forEach((event) => {
            if (event.team_season_id === game.home_team_season_id) {
              homeGoals++;
            } else if (event.team_season_id === game.away_team_season_id) {
              awayGoals++;
            }
          });

          setScore({ home: homeGoals, away: awayGoals });
          setScoreMode("calculated");
        }
      } catch (error) {
        console.error("Error fetching score:", error);
      }
    };

    fetchScore();

    // Poll for score updates every 5 seconds during game
    const interval = setInterval(fetchScore, 5000);
    return () => clearInterval(interval);
  }, [game?.game_id, game?.home_team_season_id, game?.away_team_season_id]);

  if (!game) return null;

  const ourScore = game.isHome ? score.home : score.away;
  const theirScore = game.isHome ? score.away : score.home;

  return (
    <div className='bg-white flex flex-col items-center max-w-lg px-6 pt-3 pb-2 rounded-xl shadow-md mx-auto my-2'>
      <h2 className='text-2xl font-bold text-primary text-center mb-2'>
        {game.opponentName}
      </h2>

      {/* Score Display */}
      <div className='flex items-center gap-4 text-center'>
        <div className='flex flex-col'>
          <span className='text-xs text-muted font-medium uppercase'>Us</span>
          <span className='text-4xl font-bold text-primary'>{ourScore}</span>
        </div>

        <span className='text-2xl text-muted font-light'>-</span>

        <div className='flex flex-col'>
          <span className='text-xs text-muted font-medium uppercase'>Them</span>
          <span className='text-4xl font-bold text-accent'>{theirScore}</span>
        </div>
      </div>

      {/* Score Mode Indicator (optional - can be hidden) */}
      {process.env.NODE_ENV === "development" && (
        <div className='mt-1 text-xs text-muted'>
          {scoreMode === "manual"
            ? "(Manual Score)"
            : "(Calculated from Stats)"}
        </div>
      )}
    </div>
  );
}

export default GameHeader;

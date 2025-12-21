"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import { apiFetch } from "@/app/api/fetcher";
import GameSummaryHeader from "./GameSummaryHeader";
import GameSummaryTitle from "./GameSummaryTitle";
import GameSummaryPerformers from "./GameSummaryPerformers";
import GameSummaryTeamStats from "./GameSummaryTeamStats";
import GameSummaryPlayerStats from "./GameSummaryPlayerStats";
import GameSummaryPeriods from "./GameSummaryPeriods";
import GameSummarySubs from "./GameSummarySubs";
import GameSummaryNotes from "./GameSummaryNotes";
import GameSummaryEvents from "./GameSummaryEvents";
import { normalizeMajorEvents } from "@/lib/gameSummaryHelpers";
import GameSummaryPrintSection from "./GameSummaryPrintSection";

function GameSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id;
  const teamSeasonId = parseInt(params?.teamSeasonId);

  // Store state - use shallow comparison to prevent unnecessary re-renders
  const game = useGameStore(
    (state) => state.game,
    (a, b) => a?.game_id === b?.game_id
  );
  const players = useGamePlayersStore((state) => state.players);
  const events = useGameEventsStore((state) => state.gameEvents);
  const calculateTotalTimeOnField = useGamePlayerTimeStore(
    (state) => state.calculateTotalTimeOnField
  );

  // Local state
  const [gameNotes, setGameNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const majorEvents = useMemo(() => {
    if (!game) return [];
    return normalizeMajorEvents(game, teamSeasonId);
  }, [game, teamSeasonId]);
  // Period breakdown (ours/theirs)
  const periodBreakdown = useMemo(() => {
    const goalEvents = majorEvents.filter((e) => e.stoppage_type === "goal");
    const periods = {};

    goalEvents.forEach((event) => {
      const period = event.period;
      if (!periods[period]) {
        periods[period] = { ours: 0, theirs: 0 };
      }

      // Use the isOurs flag from normalized event (handles own goals)
      if (event.isOurs) {
        periods[period].ours++;
      } else {
        periods[period].theirs++;
      }
    });

    return Object.keys(periods)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((period) => ({
        period: parseInt(period),
        label:
          period <= "2"
            ? `${period === "1" ? "1st" : "2nd"} Half`
            : `OT ${period - 2}`,
        ours: periods[period].ours,
        theirs: periods[period].theirs,
      }));
  }, [majorEvents]);

  // Substitutions with confirmed sub_time
  const substitutions = useMemo(() => {
    const subs = [];
    players.forEach((player) => {
      (player.ins || []).forEach((sub) => {
        if (sub.gameTime !== null) {
          const existing = subs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.inPlayer = player;
          } else {
            subs.push({
              subId: sub.subId,
              gameTime: sub.gameTime,
              inPlayer: player,
              outPlayer: null,
            });
          }
        }
      });

      (player.outs || []).forEach((sub) => {
        if (sub.gameTime !== null) {
          const existing = subs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.outPlayer = player;
          } else {
            subs.push({
              subId: sub.subId,
              gameTime: sub.gameTime,
              inPlayer: null,
              outPlayer: player,
            });
          }
        }
      });
    });

    return subs.sort((a, b) => a.gameTime - b.gameTime);
  }, [players]);

  // Enhanced players with minutes played
  const playersWithMinutes = useMemo(() => {
    if (!game || !players.length) return [];

    const gameTime = useGameStore.getState().getGameTime();

    return players.map((player) => ({
      ...player,
      minutesPlayed: Math.floor(
        calculateTotalTimeOnField(player, gameTime) / 60
      ),
    }));
  }, [players, game, calculateTotalTimeOnField]);

  // Top performers
  const topPerformers = useMemo(() => {
    if (!playersWithMinutes.length) return null;

    const sortedByGoals = [...playersWithMinutes]
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals);

    const sortedByAssists = [...playersWithMinutes]
      .filter((p) => p.assists > 0)
      .sort((a, b) => b.assists - a.assists);

    const sortedBySaves = [...playersWithMinutes]
      .filter((p) => p.saves > 0)
      .sort((a, b) => b.saves - a.saves);

    return {
      topScorer: sortedByGoals[0] || null,
      topAssist: sortedByAssists[0] || null,
      topGK: sortedBySaves[0] || null,
    };
  }, [playersWithMinutes]);

  // Load data on mount
  useEffect(() => {
    if (!gameId || !teamSeasonId) return;

    const loadAllData = async () => {
      setIsLoading(true);

      try {
        // Fetch game events and team stats
        await useGameEventsStore.getState().fetchGameEvents(gameId);

        // Fetch game notes
        const gameDetails = await apiFetch("games", "GET", null, gameId);
        setGameNotes(gameDetails?.notes || "");
      } catch (error) {
        console.error("Error loading game summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [gameId, teamSeasonId]);

  const handleSaveNotes = async () => {
    try {
      await apiFetch(`games?id=${gameId}`, "PUT", { notes: gameNotes });
      alert("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes");
    }
  };
  const handlePrint = () => {
    window.print();
  };

  const handleBackToGame = () => {
    router.push(`/gamestats/${teamSeasonId}/${gameId}`);
  };
  const handleManageGame = () => {
    router.push(`/gamestats/${teamSeasonId}/${gameId}/manage`);
  };

  if (isLoading || !game) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-lg text-text'>Loading game summary...</div>
      </div>
    );
  }

  const result =
    game.goalsFor > game.goalsAgainst
      ? "WIN"
      : game.goalsFor < game.goalsAgainst
      ? "LOSS"
      : "DRAW";

  return (
    <div className='min-h-screen bg-background'>
      <GameSummaryHeader
        handleBackToGame={handleBackToGame}
        handleManageGame={handleManageGame}
        handlePrint={handlePrint}
      />

      {/* Print-only clean text summary */}
      <GameSummaryPrintSection
        game={game}
        result={result}
        majorEvents={majorEvents}
        topPerformers={topPerformers}
        teamSeasonId={teamSeasonId}
        playersWithMinutes={playersWithMinutes}
      />

      {/* Screen view - 3-column responsive desktop layout */}
      <div className='print:hidden max-w-[1620px] mx-auto px-4 py-4'>
        {/* 3-column layout for desktop with custom widths */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
          {/* Left Column */}
          <div className='lg:col-span-4 space-y-4'>
            <GameSummaryTitle
              game={game}
              result={result}
              ourTeamName={game.ourName}
              theirTeamName={game.opponentName}
            />

            <GameSummaryPerformers topPerformers={topPerformers} />

            {periodBreakdown.length > 0 && (
              <GameSummaryPeriods
                periodBreakdown={periodBreakdown}
                teamSeasonId={teamSeasonId}
              />
            )}
            <GameSummaryNotes
              gameNotes={gameNotes}
              setGameNotes={setGameNotes}
              handleSaveNotes={handleSaveNotes}
            />
          </div>

          {/* Middle Column */}
          <div className='lg:col-span-3 space-y-4'>
            <GameSummaryTeamStats
              teamStats={game.gameEventsTeam}
              playerActions={game.playerActions}
              teamSeasonId={teamSeasonId}
              majorEvents={majorEvents}
            />

            <GameSummaryEvents majorEvents={majorEvents} />
          </div>

          {/* Right Column */}
          <div className='lg:col-span-5 space-y-4'>
            <GameSummaryPlayerStats players={playersWithMinutes} />

            {substitutions.length > 0 && (
              <GameSummarySubs substitutions={substitutions} />
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default GameSummaryPage;

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
  const [teamStats, setTeamStats] = useState(null);
  const [gameNotes, setGameNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Calculate ours/theirs immediately
  const { ourTeamName, theirTeamName, isHome } = useMemo(() => {
    if (!game) return { ourTeamName: "", theirTeamName: "", isHome: false };

    const isHome = game.home_team_season_id === teamSeasonId;
    return {
      ourTeamName: isHome
        ? `${game.home_club_name} ${game.home_team_name}`
        : `${game.away_club_name} ${game.away_team_name}`,
      theirTeamName: isHome
        ? `${game.away_club_name} ${game.away_team_name}`
        : `${game.home_club_name} ${game.home_team_name}`,
      isHome,
    };
  }, [game, teamSeasonId]);

  // Calculate score from events (ours/theirs)
  const score = useMemo(() => {
    const goalEvents = events.filter((e) => e.event_type === "goal");
    let ours = 0;
    let theirs = 0;

    goalEvents.forEach((event) => {
      if (event.team_season_id === teamSeasonId) {
        ours++;
      } else {
        theirs++;
      }
    });

    return { ours, theirs };
  }, [events, teamSeasonId]);

  // Major events with isOurs flag
  const majorEvents = useMemo(() => {
    return events
      .filter((e) =>
        ["goal", "card", "penalty", "injury"].includes(e.event_category)
      )
      .sort((a, b) => a.game_time - b.game_time)
      .map((event) => ({
        ...event,
        isOurs: event.team_season_id === teamSeasonId,
      }));
  }, [events, teamSeasonId]);

  // Period breakdown (ours/theirs)
  const periodBreakdown = useMemo(() => {
    const goalEvents = events.filter((e) => e.event_type === "goal");
    const periods = {};

    goalEvents.forEach((event) => {
      const period = event.period;
      if (!periods[period]) {
        periods[period] = { ours: 0, theirs: 0 };
      }

      if (event.team_season_id === teamSeasonId) {
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
  }, [events, teamSeasonId]);

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

        // Fetch team stats (not in store)
        const stats = await useGameEventsStore
          .getState()
          .getTeamStats(gameId, teamSeasonId);
        setTeamStats(stats);

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
    router.push(`/games/${gameId}/manage?teamSeasonId=${teamSeasonId}`);
  };

  if (isLoading || !game) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-lg text-text'>Loading game summary...</div>
      </div>
    );
  }

  const result =
    score.ours > score.theirs
      ? "WIN"
      : score.ours < score.theirs
      ? "LOSS"
      : "DRAW";

  return (
    <div className='min-h-screen bg-background'>
      <GameSummaryHeader
        handleBackToGame={handleBackToGame}
        handlePrint={handlePrint}
      />

      {/* Print-only clean text summary */}
      <div className='hidden print:block p-8 max-w-4xl mx-auto font-body'>
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-heading font-bold mb-2'>GAME SUMMARY</h1>
          <p className='text-base mb-1'>
            {game.start_date} • {game.start_time || "TBD"}
          </p>
          <p className='text-sm'>{game.location_name || "TBD"}</p>
          {game.league_names && (
            <p className='text-xs text-muted mt-1'>{game.league_names}</p>
          )}
        </div>

        <div className='text-center mb-6 pb-4 border-b-2 border-text'>
          <h2 className='text-xl font-bold mb-3'>FINAL SCORE</h2>
          <p className='text-lg mb-1'>
            {ourTeamName}: <strong className='text-2xl'>{score.ours}</strong>
          </p>
          <p className='text-lg mb-2'>
            {theirTeamName}:{" "}
            <strong className='text-2xl'>{score.theirs}</strong>
          </p>
          <p className='text-2xl font-bold mt-2'>{result}</p>
        </div>

        {majorEvents.filter((e) => e.event_type === "goal").length > 0 && (
          <div className='mb-6'>
            <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
              SCORING SUMMARY
            </h2>
            {majorEvents
              .filter((e) => e.event_type === "goal")
              .map((event, idx) => {
                const player = playersWithMinutes.find(
                  (p) => p.playerGameId === event.player_game_id
                );
                const teamName = event.isOurs ? ourTeamName : theirTeamName;
                return (
                  <p key={idx} className='mb-1 text-sm'>
                    {Math.floor(event.game_time / 60)}' - {teamName}
                    {player &&
                      ` - ${player.fullName} (#${player.jerseyNumber})`}
                    {!player &&
                      event.opponent_jersey_number &&
                      ` - #${event.opponent_jersey_number}`}
                  </p>
                );
              })}
          </div>
        )}

        {topPerformers &&
          (topPerformers.topScorer ||
            topPerformers.topAssist ||
            topPerformers.topGK) && (
            <div className='mb-6'>
              <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
                TOP PERFORMERS
              </h2>
              {topPerformers.topScorer && (
                <p className='mb-1 text-sm'>
                  Top Scorer: {topPerformers.topScorer.fullName} -{" "}
                  {topPerformers.topScorer.goals} goal(s)
                </p>
              )}
              {topPerformers.topAssist && (
                <p className='mb-1 text-sm'>
                  Most Assists: {topPerformers.topAssist.fullName} -{" "}
                  {topPerformers.topAssist.assists} assist(s)
                </p>
              )}
              {topPerformers.topGK && (
                <p className='mb-1 text-sm'>
                  Goalkeeper: {topPerformers.topGK.fullName} -{" "}
                  {topPerformers.topGK.saves} saves,{" "}
                  {topPerformers.topGK.goalsAgainst} goals against
                </p>
              )}
            </div>
          )}

        {teamStats && (
          <div className='mb-6'>
            <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
              TEAM STATISTICS
            </h2>
            <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
              <p>Shots: {teamStats.shots || 0}</p>
              <p>On Target: {teamStats.shots_on_target || 0}</p>
              <p>Saves: {teamStats.saves || 0}</p>
              <p>
                Corners: {teamStats.corners_for || 0} -{" "}
                {teamStats.corners_against || 0}
              </p>
              <p>
                Fouls: {teamStats.fouls_committed || 0} /{" "}
                {teamStats.fouls_drawn || 0}
              </p>
              <p>
                Cards: {teamStats.yellow_cards || 0}Y /{" "}
                {teamStats.red_cards || 0}R
              </p>
            </div>
          </div>
        )}

        {playersWithMinutes.length > 0 && (
          <div>
            <h2 className='text-lg font-bold mb-3 border-b border-text pb-1'>
              PLAYER STATISTICS
            </h2>
            <table className='w-full text-xs border-collapse'>
              <thead>
                <tr className='border-b border-text'>
                  <th className='text-left py-1 pr-2'>#</th>
                  <th className='text-left py-1 pr-2'>Name</th>
                  <th className='text-center py-1 px-1'>Pos</th>
                  <th className='text-center py-1 px-1'>Min</th>
                  <th className='text-center py-1 px-1'>G</th>
                  <th className='text-center py-1 px-1'>A</th>
                  <th className='text-center py-1 px-1'>Sh</th>
                  <th className='text-center py-1 px-1'>Sv</th>
                </tr>
              </thead>
              <tbody>
                {playersWithMinutes.map((p, idx) => (
                  <tr key={idx} className='border-b border-gray-300'>
                    <td className='py-1 pr-2'>{p.jerseyNumber ?? "—"}</td>
                    <td className='py-1 pr-2'>{p.fullName}</td>
                    <td className='text-center py-1 px-1'>
                      {p.position || "—"}
                    </td>
                    <td className='text-center py-1 px-1'>{p.minutesPlayed}</td>
                    <td className='text-center py-1 px-1'>{p.goals || 0}</td>
                    <td className='text-center py-1 px-1'>{p.assists || 0}</td>
                    <td className='text-center py-1 px-1'>{p.shots || 0}</td>
                    <td className='text-center py-1 px-1'>{p.saves || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen view - 3-column responsive desktop layout */}
      <div className='print:hidden max-w-[1600px] mx-auto px-4 py-4'>
        {/* 3-column layout for desktop */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Left Column */}
          <div className='space-y-4'>
            <GameSummaryTitle
              game={game}
              score={score}
              result={result}
              ourTeamName={ourTeamName}
              theirTeamName={theirTeamName}
            />

            <GameSummaryPerformers topPerformers={topPerformers} />

            {periodBreakdown.length > 0 && (
              <GameSummaryPeriods periodBreakdown={periodBreakdown} />
            )}
          </div>

          {/* Middle Column */}
          <div className='space-y-4'>
            <GameSummaryTeamStats teamStats={teamStats} />

            <GameSummaryEvents
              majorEvents={majorEvents}
              players={playersWithMinutes}
              ourTeamName={ourTeamName}
              theirTeamName={theirTeamName}
            />
          </div>

          {/* Right Column */}
          <div className='space-y-4'>
            <GameSummaryPlayerStats players={playersWithMinutes} />

            {substitutions.length > 0 && (
              <GameSummarySubs substitutions={substitutions} />
            )}

            <GameSummaryNotes
              gameNotes={gameNotes}
              setGameNotes={setGameNotes}
              handleSaveNotes={handleSaveNotes}
            />
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

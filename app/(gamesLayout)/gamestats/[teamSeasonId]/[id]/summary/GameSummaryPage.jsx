"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { apiFetch } from "@/app/api/fetcher";
import {
  formatMySqlDate,
  formatMySqlTime,
  formatSecondsToMmss,
} from "@/lib/dateTimeUtils";

function GameSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id;
  const teamSeasonId = params?.teamSeasonId;

  const game = useGameStore((s) => s.game);
  const initializeGame = useGameStore((s) => s.initializeGame);
  const players = useGamePlayersStore((s) => s.players);
  const loadPlayers = useGamePlayersStore((s) => s.loadPlayers);

  const [score, setScore] = useState({ home: 0, away: 0, mode: "calculated" });
  const [majorEvents, setMajorEvents] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [substitutions, setSubs] = useState([]);
  const [periodBreakdown, setPeriodBreakdown] = useState([]);
  const [topPerformers, setTopPerformers] = useState(null);
  const [gameNotes, setGameNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const gameStage = useGameStore((s) => s.getGameStage());

  useEffect(() => {
    if (gameStage !== "end_game") {
      // Navigate away when game ends
      router.push(`/gamestats/${teamSeasonId}/${gameId}/live`);
    }
  }, [gameStage, game.id, router]);

  useEffect(() => {
    if (gameId && teamSeasonId) {
      loadGameData();
    }
  }, [gameId, teamSeasonId]);

  const loadGameData = async () => {
    setIsLoading(true);
    try {
      // Load game and players
      // await initializeGame(parseInt(gameId), parseInt(teamSeasonId));
      // await loadPlayers(parseInt(gameId), parseInt(teamSeasonId));
      // Fetch score
      await fetchScore();
      // Fetch major events
      await fetchMajorEvents();
      // Fetch team stats
      await fetchTeamStats();
      // Fetch substitutions
      await fetchSubstitutions();
      // Calculate period breakdown
      await calculatePeriodBreakdown();
      // Calculate top performers
      calculateTopPerformers();
      // Load game notes
      await fetchGameNotes();
    } catch (error) {
      console.error("Error loading game summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScore = async () => {
    try {
      // Check manual score first
      const [manualScore] = await apiFetch("game_scores", "GET", null, null, {
        filters: { game_id: gameId },
      });

      if (manualScore) {
        setScore({
          home: manualScore.home_score || 0,
          away: manualScore.away_score || 0,
          mode: "manual",
        });
      } else {
        // Calculate from events
        const events = await apiFetch("game_events", "GET", null, null, {
          filters: { game_id: gameId, event_type: "goal" },
        });

        let homeGoals = 0;
        let awayGoals = 0;

        events.forEach((event) => {
          if (event.team_season_id === game?.home_team_season_id) {
            homeGoals++;
          } else if (event.team_season_id === game?.away_team_season_id) {
            awayGoals++;
          }
        });

        setScore({ home: homeGoals, away: awayGoals, mode: "calculated" });
      }
    } catch (error) {
      console.error("Error fetching score:", error);
    }
  };

  const fetchMajorEvents = async () => {
    try {
      const events = await apiFetch("game_events", "GET", null, null, {
        filters: {
          game_id: gameId,
          event_type: ["goal", "card", "penalty", "injury"],
        },
      });

      // Sort by game time
      const sortedEvents = events.sort((a, b) => a.game_time - b.game_time);
      setMajorEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching major events:", error);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const [stats] = await apiFetch("v_team_game_stats", "GET", null, null, {
        filters: { game_id: gameId, team_season_id: teamSeasonId },
      });
      setTeamStats(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
    }
  };

  const fetchSubstitutions = async () => {
    try {
      const subs = await apiFetch("game_subs", "GET", null, null, {
        filters: { game_id: gameId },
      });

      // Filter out pending subs and sort by time
      const completedSubs = subs
        .filter((sub) => sub.sub_time !== null)
        .sort((a, b) => a.sub_time - b.sub_time);

      setSubs(completedSubs);
    } catch (error) {
      console.error("Error fetching substitutions:", error);
    }
  };

  const calculatePeriodBreakdown = async () => {
    try {
      const events = await apiFetch("game_events", "GET", null, null, {
        filters: { game_id: gameId, event_type: "goal" },
      });

      const periods = {};

      events.forEach((event) => {
        const period = event.period;
        if (!periods[period]) {
          periods[period] = { home: 0, away: 0 };
        }

        if (event.team_season_id === game?.home_team_season_id) {
          periods[period].home++;
        } else if (event.team_season_id === game?.away_team_season_id) {
          periods[period].away++;
        }
      });

      const breakdown = Object.keys(periods)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((period) => ({
          period: parseInt(period),
          label:
            period <= 2
              ? `${period === 1 ? "1st" : "2nd"} Half`
              : `OT ${period - 2}`,
          home: periods[period].home,
          away: periods[period].away,
        }));

      setPeriodBreakdown(breakdown);
    } catch (error) {
      console.error("Error calculating period breakdown:", error);
    }
  };

  const calculateTopPerformers = () => {
    if (!players || players.length === 0) return;

    const sortedByGoals = [...players]
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals);

    const sortedByAssists = [...players]
      .filter((p) => p.assists > 0)
      .sort((a, b) => b.assists - a.assists);

    const sortedBySaves = [...players]
      .filter((p) => p.saves > 0)
      .sort((a, b) => b.saves - a.saves);

    setTopPerformers({
      topScorer: sortedByGoals[0] || null,
      topAssist: sortedByAssists[0] || null,
      topGK: sortedBySaves[0] || null,
    });
  };

  const fetchGameNotes = async () => {
    try {
      const gameData = await apiFetch("games", "GET", null, gameId);
      setGameNotes(gameData?.notes || "");
    } catch (error) {
      console.error("Error fetching game notes:", error);
    }
  };

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
    router.push(`/gamestats/${teamSeasonId}/${gameId}/manage`);
  };

  if (isLoading || !game) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading game summary...</div>
      </div>
    );
  }

  const ourScore = game.isHome ? score.home : score.away;
  const theirScore = game.isHome ? score.away : score.home;
  const result =
    ourScore > theirScore ? "WIN" : ourScore < theirScore ? "LOSS" : "DRAW";
  const resultColor =
    result === "WIN"
      ? "text-green-600"
      : result === "LOSS"
      ? "text-red-600"
      : "text-yellow-600";

  // Player stats table columns
  const playerColumns = [
    { name: "number", label: "#", width: "50px" },
    { name: "name", label: "Name", width: "25%" },
    { name: "position", label: "Pos", width: "80px" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "saves", label: "Sv", cellClassName: "text-end" },
    { name: "ga", label: "GA", cellClassName: "text-end" },
    { name: "yc", label: "YC", cellClassName: "text-end" },
    { name: "rc", label: "RC", cellClassName: "text-end" },
  ];

  const playerData = players
    .filter((p) => ["dressed", "starter", "goalkeeper"].includes(p.gameStatus))
    .map((p) => ({
      number: p.jerseyNumber ?? "—",
      name: p.fullName,
      position: p.position || "—",
      goals: p.goals || 0,
      assists: p.assists || 0,
      shots: p.shots || 0,
      saves: p.saves || 0,
      ga: p.goalsAgainst || 0,
      yc: p.yellowCards || 0,
      rc: p.redCards || 0,
    }));

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Action Buttons - No Print */}
      <div className='print:hidden bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <Button onClick={handleBackToGame} variant='outline'>
            ← Back to Game Management
          </Button>
          <div className='flex gap-2'>
            <Button onClick={handlePrint} variant='primary'>
              🖨️ Print Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* 1. Game Info Header */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='text-center mb-4'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Game Summary
            </h1>
            <div className='text-sm text-gray-600'>
              {formatMySqlDate(game.start_date)} •{" "}
              {formatMySqlTime(game.start_time)} • {game.location_name || "TBD"}
            </div>
            {game.league_names && (
              <div className='text-sm text-gray-500 mt-1'>
                {game.league_names}
              </div>
            )}
          </div>

          {/* Score Display */}
          <div className='flex justify-center items-center gap-8 mb-4'>
            <div className='text-center'>
              <div className='text-xl font-semibold text-gray-700 mb-1'>
                {game.isHome
                  ? `${game.home_club_name} ${game.home_team_name}`
                  : `${game.away_club_name} ${game.away_team_name}`}
              </div>
              <div className='text-6xl font-bold text-primary'>{ourScore}</div>
              <div className='text-xs text-gray-500 mt-1'>Us</div>
            </div>

            <div className='text-4xl font-light text-gray-400'>-</div>

            <div className='text-center'>
              <div className='text-xl font-semibold text-gray-700 mb-1'>
                {game.isHome
                  ? `${game.away_club_name} ${game.away_team_name}`
                  : `${game.home_club_name} ${game.home_team_name}`}
              </div>
              <div className='text-6xl font-bold text-accent'>{theirScore}</div>
              <div className='text-xs text-gray-500 mt-1'>Them</div>
            </div>
          </div>

          {/* Result Badge */}
          <div className='text-center'>
            <span
              className={`inline-block px-6 py-2 rounded-full text-2xl font-bold ${resultColor} bg-opacity-10 ${
                result === "WIN"
                  ? "bg-green-100"
                  : result === "LOSS"
                  ? "bg-red-100"
                  : "bg-yellow-100"
              }`}
            >
              {result}
            </span>
          </div>
        </div>

        {/* 2. Major Events Timeline */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Major Events
          </h2>
          {majorEvents.length === 0 ? (
            <div className='text-center text-gray-500 py-4'>
              No major events recorded
            </div>
          ) : (
            <div className='space-y-2'>
              {majorEvents.map((event) => {
                const player = players.find(
                  (p) => p.playerGameId === event.player_game_id
                );
                const isOurTeam = event.team_season_id === teamSeasonId;
                const eventIcon = {
                  goal: "⚽",
                  card: event.event_type === "yellow_card" ? "🟨" : "🟥",
                  penalty: "🎯",
                  injury: "🚑",
                }[event.event_category];

                return (
                  <div
                    key={event.id}
                    className='flex items-center gap-4 p-3 border border-gray-200 rounded-lg'
                  >
                    <div className='text-2xl'>{eventIcon}</div>
                    <div className='flex-1'>
                      <div className='font-semibold text-gray-900'>
                        {event.event_type.replace("_", " ").toUpperCase()}
                        {player &&
                          ` - ${player.fullName} (#${player.jerseyNumber})`}
                        {!player &&
                          event.opponent_jersey_number &&
                          ` - Opponent #${event.opponent_jersey_number}`}
                      </div>
                      <div className='text-sm text-gray-600'>
                        {formatSecondsToMmss(event.game_time)} • Period{" "}
                        {event.period}
                        {event.details && ` • ${event.details}`}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isOurTeam
                            ? "bg-primary text-white"
                            : "bg-accent text-white"
                        }`}
                      >
                        {isOurTeam ? "Us" : "Them"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Team Stats Table */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Team Statistics
          </h2>
          {teamStats ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Shots</div>
                <div className='text-3xl font-bold text-primary'>
                  {teamStats.shots || 0}
                </div>
                <div className='text-xs text-gray-500'>
                  on target: {teamStats.shots_on_target || 0}
                </div>
              </div>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Saves</div>
                <div className='text-3xl font-bold text-primary'>
                  {teamStats.saves || 0}
                </div>
              </div>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Corners</div>
                <div className='text-xl font-bold'>
                  <span className='text-primary'>
                    {teamStats.corners_for || 0}
                  </span>
                  <span className='text-gray-400 mx-2'>-</span>
                  <span className='text-accent'>
                    {teamStats.corners_against || 0}
                  </span>
                </div>
              </div>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Offsides</div>
                <div className='text-xl font-bold text-primary'>
                  {teamStats.offsides || 0}
                </div>
              </div>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Fouls</div>
                <div className='text-xl font-bold'>
                  <span className='text-primary'>
                    {teamStats.fouls_committed || 0}
                  </span>
                  <span className='text-gray-400 mx-2'>-</span>
                  <span className='text-accent'>
                    {teamStats.fouls_drawn || 0}
                  </span>
                </div>
              </div>
              <div className='text-center p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Cards</div>
                <div className='text-xl font-bold'>
                  <span className='text-yellow-500'>
                    {teamStats.yellow_cards || 0}
                  </span>
                  <span className='text-gray-400 mx-2'>/</span>
                  <span className='text-red-500'>
                    {teamStats.red_cards || 0}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center text-gray-500 py-4'>
              No team stats available
            </div>
          )}
        </div>

        {/* 4. Player Stats Table */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Player Statistics
          </h2>
          <Table
            columns={playerColumns}
            data={playerData}
            size='sm'
            hoverable={false}
          />
        </div>

        {/* 5. Period Breakdown */}
        {periodBreakdown.length > 0 && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Score by Period
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {periodBreakdown.map((period) => {
                const ourGoals = game.isHome ? period.home : period.away;
                const theirGoals = game.isHome ? period.away : period.home;
                return (
                  <div
                    key={period.period}
                    className='text-center p-4 bg-gray-50 rounded-lg'
                  >
                    <div className='text-sm text-gray-600 mb-2'>
                      {period.label}
                    </div>
                    <div className='text-2xl font-bold'>
                      <span className='text-primary'>{ourGoals}</span>
                      <span className='text-gray-400 mx-2'>-</span>
                      <span className='text-accent'>{theirGoals}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Substitutions Log */}
        {substitutions.length > 0 && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Substitutions
            </h2>
            <div className='space-y-2'>
              {substitutions.map((sub) => {
                const playerIn = players.find(
                  (p) => p.playerGameId === sub.in_player_id
                );
                const playerOut = players.find(
                  (p) => p.playerGameId === sub.out_player_id
                );
                return (
                  <div
                    key={sub.id}
                    className='flex items-center gap-4 p-3 border border-gray-200 rounded-lg'
                  >
                    <div className='text-lg'>🔄</div>
                    <div className='flex-1'>
                      <div className='font-semibold text-green-600'>
                        IN: {playerIn?.fullName} (#{playerIn?.jerseyNumber})
                      </div>
                      <div className='font-semibold text-red-600'>
                        OUT: {playerOut?.fullName} (#{playerOut?.jerseyNumber})
                      </div>
                    </div>
                    <div className='text-sm text-gray-600'>
                      {formatSecondsToMmss(sub.sub_time)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Goalkeeper Performance */}
        {topPerformers?.topGK && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Goalkeeper Performance
            </h2>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Goalkeeper</div>
                <div className='text-lg font-bold text-gray-900'>
                  {topPerformers.topGK.fullName}
                </div>
                <div className='text-sm text-gray-500'>
                  #{topPerformers.topGK.jerseyNumber}
                </div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Saves</div>
                <div className='text-3xl font-bold text-primary'>
                  {topPerformers.topGK.saves}
                </div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Goals Against</div>
                <div className='text-3xl font-bold text-accent'>
                  {topPerformers.topGK.goalsAgainst}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Top Performers */}
        {(topPerformers?.topScorer || topPerformers?.topAssist) && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Top Performers
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {topPerformers.topScorer && (
                <div className='p-4 bg-green-50 rounded-lg'>
                  <div className='text-sm text-gray-600 mb-2'>
                    ⚽ Top Scorer
                  </div>
                  <div className='text-xl font-bold text-gray-900'>
                    {topPerformers.topScorer.fullName} (#
                    {topPerformers.topScorer.jerseyNumber})
                  </div>
                  <div className='text-3xl font-bold text-green-600 mt-1'>
                    {topPerformers.topScorer.goals}{" "}
                    {topPerformers.topScorer.goals === 1 ? "goal" : "goals"}
                  </div>
                </div>
              )}
              {topPerformers.topAssist && (
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <div className='text-sm text-gray-600 mb-2'>
                    🎯 Most Assists
                  </div>
                  <div className='text-xl font-bold text-gray-900'>
                    {topPerformers.topAssist.fullName} (#
                    {topPerformers.topAssist.jerseyNumber})
                  </div>
                  <div className='text-3xl font-bold text-blue-600 mt-1'>
                    {topPerformers.topAssist.assists}{" "}
                    {topPerformers.topAssist.assists === 1
                      ? "assist"
                      : "assists"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. Game Notes - No Print */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6 print:hidden'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Coach Notes</h2>
          <textarea
            value={gameNotes}
            onChange={(e) => setGameNotes(e.target.value)}
            className='w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent'
            placeholder='Add notes about the game, player performance, areas to improve...'
          />
          <div className='mt-3'>
            <Button onClick={handleSaveNotes} variant='primary'>
              Save Notes
            </Button>
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
          .shadow-md {
            box-shadow: none !important;
          }
          .rounded-lg {
            border: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}

export default GameSummaryPage;

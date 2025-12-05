"use client";
import { useState, useEffect, useMemo } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";

function TeamStatsBetweenPeriods() {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats on mount and when game changes
  useEffect(() => {
    if (game?.game_id) {
      fetchStats();
    }
  }, [game?.game_id]);

  const fetchStats = async () => {
    if (!game?.game_id) return;

    setIsLoading(true);
    try {
      const events = await apiFetch("game_events", "GET", null, null, {
        filters: { game_id: game.game_id, is_stoppage: 0 },
      });

      setStats(events || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Count stats by type
  const statCounts = useMemo(() => {
    const counts = {
      corner: { us: 0, them: 0 },
      offside: { us: 0, them: 0 },
      foul: { us: 0, them: 0 },
      shot: 0,
      save: 0,
    };

    stats.forEach((stat) => {
      const isOurTeam = stat.for_team === game?.team_season_id;

      if (stat.event_type === "corner") {
        if (isOurTeam) counts.corner.us++;
        else counts.corner.them++;
      } else if (stat.event_type === "offside") {
        if (isOurTeam) counts.offside.us++;
        else counts.offside.them++;
      } else if (stat.event_type === "foul") {
        if (isOurTeam) counts.foul.us++;
        else counts.foul.them++;
      } else if (stat.event_type === "shot") {
        counts.shot++;
      } else if (stat.event_type === "save") {
        counts.save++;
      }
    });

    return counts;
  }, [stats, game]);

  if (isLoading) {
    return <div className='text-center text-muted py-4'>Loading stats...</div>;
  }

  return (
    <div className='w-full'>
      <h2 className='text-base font-bold text-text mb-3'>Game Statistics</h2>

      {/* Stat Summary - Compact table-like display */}
      <div className='bg-surface rounded-lg border border-border p-3'>
        <div className='space-y-1.5'>
          {/* Corner Kicks */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Corners</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {statCounts.corner.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {statCounts.corner.them}
              </span>
            </div>
          </div>

          {/* Offsides */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Offsides</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {statCounts.offside.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {statCounts.offside.them}
              </span>
            </div>
          </div>

          {/* Fouls */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Fouls</span>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-bold text-primary w-6 text-right'>
                {statCounts.foul.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent w-6 text-left'>
                {statCounts.foul.them}
              </span>
            </div>
          </div>

          <div className='border-t border-border my-1'></div>

          {/* Shots (Our Team Only) */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Shots</span>
            <span className='text-sm font-bold text-primary'>
              {statCounts.shot}
            </span>
          </div>

          {/* Saves (Our Team Only) */}
          <div className='flex items-center justify-between py-1'>
            <span className='text-xs font-medium text-text'>Saves</span>
            <span className='text-sm font-bold text-primary'>
              {statCounts.save}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div className='border-t-2 border-border pt-3 mt-3'>
        <h3 className='text-xs font-semibold text-text-label mb-2 uppercase'>
          Recent Events
        </h3>
        <div className='space-y-1.5 max-h-[180px] overflow-y-auto pr-1'>
          {stats.length === 0 ? (
            <div className='text-xs text-muted text-center py-3 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            stats
              .slice()
              .reverse()
              .map((stat) => {
                const player = players.find(
                  (p) => p.playerGameId === stat.player_game_id
                );
                const isOurTeam = stat.for_team === game?.team_season_id;

                return (
                  <div
                    key={stat.id}
                    className='flex items-center gap-2 p-2 bg-surface rounded border border-border'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-text capitalize'>
                          {stat.event_type}
                        </span>
                        {!player && stat.for_team && (
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              isOurTeam
                                ? "bg-primary text-white"
                                : "bg-accent text-white"
                            }`}
                          >
                            {isOurTeam ? "Us" : "Them"}
                          </span>
                        )}
                      </div>
                      {player && (
                        <div className='text-xs text-muted truncate mt-0.5'>
                          #{player.jerseyNumber} {player.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamStatsBetweenPeriods;

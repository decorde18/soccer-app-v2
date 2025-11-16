// Team Card Component
"use client";
import { Card } from "@/components/ui/Card";
import { useEffect, useState } from "react";
function TeamCard({ team }) {
  const [standings, setStandings] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const { club_id: clubId, team_season_id: teamSeasonId } = team;

  useEffect(() => {
    if (!teamSeasonId) return;

    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [standingsRes, scheduleRes, statsRes] = await Promise.all([
          fetch(`/api/teams/${teamSeasonId}/standings`),
          fetch(`/api/teams/${teamSeasonId}/schedule?limit=5`),
          fetch(`/api/teams/${teamSeasonId}/stats`),
        ]);

        const [standingsData, scheduleData, statsData] = await Promise.all([
          standingsRes.ok ? standingsRes.json() : null,
          scheduleRes.ok ? scheduleRes.json() : [],
          statsRes.ok ? statsRes.json() : null,
        ]);

        setStandings(standingsData);
        setSchedule(scheduleData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamSeasonId]);

  if (loading) {
    return (
      <Card variant='outlined' padding='lg'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 bg-muted rounded w-3/4'></div>
          <div className='h-4 bg-muted rounded w-1/2'></div>
          <div className='space-y-2'>
            <div className='h-3 bg-muted rounded'></div>
            <div className='h-3 bg-muted rounded'></div>
            <div className='h-3 bg-muted rounded'></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant='hover' shadow padding='lg' className='h-full flex flex-col'>
      {/* Team Header */}
      <div className='mb-4 pb-4 border-b border-border'>
        <h3 className='text-xl font-bold text-foreground'>{team.name}</h3>
        <p className='text-sm text-muted'>
          {team.club_name} • {team.season_name}
        </p>
      </div>

      <div className='space-y-6 flex-1'>
        {/* League Standings Section */}
        {standings && (
          <div>
            <h4 className='text-sm font-semibold text-muted mb-2 flex items-center gap-2'>
              <span>📊</span>
              League Standings
            </h4>
            <div className='bg-surface rounded-lg p-3 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted'>Position</span>
                <span className='text-lg font-bold text-primary'>
                  {standings.position}
                </span>
              </div>
              <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                <div>
                  <div className='text-muted'>W</div>
                  <div className='font-semibold'>{standings.wins || 0}</div>
                </div>
                <div>
                  <div className='text-muted'>D</div>
                  <div className='font-semibold'>{standings.draws || 0}</div>
                </div>
                <div>
                  <div className='text-muted'>L</div>
                  <div className='font-semibold'>{standings.losses || 0}</div>
                </div>
              </div>
              <div className='flex justify-between items-center pt-2 border-t border-border'>
                <span className='text-xs text-muted'>Points</span>
                <span className='text-sm font-bold'>
                  {standings.points || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Games Section */}
        {schedule.length > 0 && (
          <div>
            <h4 className='text-sm font-semibold text-muted mb-2 flex items-center gap-2'>
              <span>⚽</span>
              Upcoming Games
            </h4>
            <div className='space-y-2'>
              {schedule.slice(0, 3).map((game, idx) => (
                <div
                  key={idx}
                  className='bg-surface rounded-lg p-3 text-sm hover:bg-muted/50 transition'
                >
                  <div className='flex justify-between items-center mb-1'>
                    <span className='font-medium'>
                      {game.home_team_id === team.id ? "vs" : "@"}{" "}
                      {game.opponent_name}
                    </span>
                    <span className='text-xs text-muted'>
                      {new Date(game.date).toLocaleDateString()}
                    </span>
                  </div>
                  {game.location && (
                    <div className='text-xs text-muted'>{game.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Season Stats Section */}
        {stats && (
          <div>
            <h4 className='text-sm font-semibold text-muted mb-2 flex items-center gap-2'>
              <span>📈</span>
              Season Stats
            </h4>
            <div className='grid grid-cols-2 gap-3'>
              <div className='bg-surface rounded-lg p-3 text-center'>
                <div className='text-xs text-muted mb-1'>Goals Scored</div>
                <div className='text-xl font-bold text-primary'>
                  {stats.goals_scored || 0}
                </div>
              </div>
              <div className='bg-surface rounded-lg p-3 text-center'>
                <div className='text-xs text-muted mb-1'>Goals Against</div>
                <div className='text-xl font-bold text-danger'>
                  {stats.goals_against || 0}
                </div>
              </div>
              <div className='bg-surface rounded-lg p-3 text-center'>
                <div className='text-xs text-muted mb-1'>Clean Sheets</div>
                <div className='text-lg font-semibold'>
                  {stats.clean_sheets || 0}
                </div>
              </div>
              <div className='bg-surface rounded-lg p-3 text-center'>
                <div className='text-xs text-muted mb-1'>Goal Diff</div>
                <div className='text-lg font-semibold'>
                  {(stats.goals_scored || 0) - (stats.goals_against || 0) > 0
                    ? "+"
                    : ""}
                  {(stats.goals_scored || 0) - (stats.goals_against || 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Details Button */}
      <div className='mt-4 pt-4 border-t border-border'>
        <button
          className='w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition font-medium text-sm'
          onClick={() => (window.location.href = `/teams/${teamSeasonId}`)}
        >
          View Full Details
        </button>
      </div>
    </Card>
  );
}

export default TeamCard;

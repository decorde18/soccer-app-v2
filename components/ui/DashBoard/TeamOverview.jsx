// ============================================
// UPDATED TeamOverview Component
// ============================================

// components/ui/DashBoard/TeamOverview.jsx
"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Grid, GridColumn } from "@/components/ui/Grid";
import Button from "../Button";
import LeagueStandingCard from "./LeagueStandingCard";
import RecentFormCard from "./RecentFormCard";
import UpcomingGamesCard from "./UpcomingGamesCard";
import StatLeadersCard from "./StatLeadersCard";

export default function TeamOverview({ team, data, showHeader = true }) {
  // If data is provided (server-fetched), use it
  // Otherwise fetch it client-side (for dynamic team selection)
  const [localData, setLocalData] = useState(data || null);
  const [loading, setLoading] = useState(!data);

  const { team_season_id: teamSeasonId } = team;

  useEffect(() => {
    // Only fetch if data wasn't provided from server
    if (!data && teamSeasonId) {
      const fetchTeamData = async () => {
        setLoading(true);
        try {
          const [standingsRes, recentRes, upcomingRes, leadersRes] =
            await Promise.all([
              fetch(`/api/teams/${teamSeasonId}/standings`),
              fetch(`/api/teams/${teamSeasonId}/schedule?type=recent&limit=5`),
              fetch(
                `/api/teams/${teamSeasonId}/schedule?type=upcoming&limit=3`
              ),
              fetch(`/api/teams/${teamSeasonId}/stat-leaders`),
            ]);

          const [standingsData, recentData, upcomingData, leadersData] =
            await Promise.all([
              standingsRes.ok ? standingsRes.json() : [],
              recentRes.ok ? recentRes.json() : [],
              upcomingRes.ok ? upcomingRes.json() : [],
              leadersRes.ok ? leadersRes.json() : null,
            ]);

          setLocalData({
            standings: Array.isArray(standingsData)
              ? standingsData
              : [standingsData],
            recentGames: recentData,
            upcomingGames: upcomingData,
            statLeaders: leadersData,
          });
        } catch (error) {
          console.error("Error fetching team data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTeamData();
    }
  }, [teamSeasonId, data]);

  // Use either server data or client-fetched data
  const displayData = data || localData;

  if (loading || !displayData) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between mb-6'>
          <div className='h-8 bg-muted/20 rounded w-1/3 animate-pulse'></div>
          <div className='h-6 bg-muted/20 rounded w-24 animate-pulse'></div>
        </div>
        <Grid gap='4'>
          {[1, 2, 3, 4].map((i) => (
            <GridColumn key={i} span={3} spanTablet={6} spanMobile={12}>
              <div className='h-48 bg-muted/20 rounded-xl animate-pulse'></div>
            </GridColumn>
          ))}
        </Grid>
      </div>
    );
  }

  const { standings, recentGames, upcomingGames, statLeaders } = displayData;

  return (
    <div className='space-y-4'>
      {/* Team Header */}
      {showHeader && (
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-text'>{team.team_name}</h2>
            <p className='text-sm text-muted'>
              {team.club_name} • {team.season_name}
            </p>
          </div>
          <div className='w-60'>
            <Button
              onClick={() => (window.location.href = `/teams/${teamSeasonId}`)}
              variant='outline'
            >
              View Full Details
            </Button>
          </div>
        </div>
      )}
      {/* Cards Grid */}
      <Grid gap='4'>
        {/* League Standing Cards */}
        <GridColumn span={3} spanTablet={12} spanMobile={12}>
          <div className='space-y-4'>
            {standings?.length > 0 ? (
              standings.map((standing, index) => (
                <LeagueStandingCard
                  key={index}
                  standings={standing}
                  team={teamSeasonId}
                />
              ))
            ) : (
              <Card variant='outlined' padding='md'>
                <div className='text-center text-muted py-8'>
                  <p className='text-sm'>No standings data available</p>
                </div>
              </Card>
            )}
          </div>
        </GridColumn>

        {/* Recent Form Card */}
        <GridColumn span={3} spanTablet={6} spanMobile={12}>
          <RecentFormCard recentGames={recentGames} team={teamSeasonId} />
        </GridColumn>

        {/* Upcoming Games Card */}
        <GridColumn span={3} spanTablet={6} spanMobile={12}>
          <UpcomingGamesCard
            upcomingGames={upcomingGames}
            team={teamSeasonId}
          />
        </GridColumn>

        {/* Stat Leaders Card */}
        <GridColumn span={3} spanTablet={6} spanMobile={12}>
          <StatLeadersCard statLeaders={statLeaders} team={teamSeasonId} />
        </GridColumn>
      </Grid>
    </div>
  );
}

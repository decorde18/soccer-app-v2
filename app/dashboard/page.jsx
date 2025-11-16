// app/dashboard/page.js - Enhanced dashboard with user team cards
"use client";

import { useUserContextStore } from "@/stores/userContextStore";
import useAuthStore from "@/stores/authStore";
import { useCallback, useEffect, useState } from "react";
import TeamSelector from "@/components/layout/TeamSelector";
import TeamCard from "@/components/ui/TeamCard";
import StandingsTable from "./GridExample";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { myTeams, loadUserContext } = useUserContextStore();
  const [currentContext, setCurrentContext] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserContext(user.id);
    }
  }, [user, loadUserContext]);

  // Handle context changes from TeamSelector - memoized to prevent re-renders
  const handleContextChange = useCallback((context) => {
    setCurrentContext(context);
  }, []);

  return (
    <div className='min-h-screen bg-background'>
      {/* Team Selector Section */}
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border'>
        <div className='container mx-auto px-4 py-4'>
          <div className='w-full max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%]'>
            <TeamSelector type='header' onContextChange={handleContextChange} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-8'>
        {/* <StandingsTable /> */}
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            {isAuthenticated
              ? `Welcome back, ${user?.first_name}!`
              : "Dashboard"}
          </h1>
          <p className='text-muted'>
            {currentContext?.team
              ? `Viewing ${currentContext.team.name} - ${
                  currentContext.season?.name || "Select a season"
                }`
              : "Select a team to view details"}
          </p>
        </div>
        {/* My Teams Section */}
        {isAuthenticated && myTeams.length > 0 && (
          <div className='mb-12'>
            <h2 className='text-2xl font-bold text-foreground mb-6'>
              My Teams
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {myTeams.map((team) => (
                <TeamCard
                  key={team.team_season_id}
                  team={team}
                  teamSeasonId={team.team_season_id}
                />
              ))}
            </div>
          </div>
        )}
        {/* Empty State for Non-authenticated Users */}
        {!isAuthenticated && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <div className='text-6xl mb-4'>⚽</div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                Welcome to TeamHub
              </h3>
              <p className='text-muted max-w-md mx-auto'>
                Sign in to see your teams, track standings, and stay updated
                with schedules and stats.
              </p>
            </div>
            <button
              className='bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-medium'
              onClick={() => (window.location.href = "/auth/login")}
            >
              Sign In to Get Started
            </button>
          </div>
        )}
        {/* Empty State for Authenticated Users with No Teams */}
        {isAuthenticated && myTeams.length === 0 && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <div className='text-6xl mb-4'>🎯</div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                No Teams Yet
              </h3>
              <p className='text-muted max-w-md mx-auto'>
                You haven't joined any teams yet. Use the team selector above to
                explore teams and get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

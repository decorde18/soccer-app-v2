"use client";
import { useEffect, useRef, useState } from "react";
import Select from "../ui/Select";
import { useTeamSelectorStore } from "@/stores/teamSelectorStore";

function TeamSelector({ type }) {
  const {
    selectedType,
    selectedClub,
    selectedTeam,
    selectedSeason,
    selectedTeamSeasonId,
    isLoading,
    error,
    setType,
    setClub,
    setTeam,
    setSeason,
    loadTeamsView,
    getAvailableTypes,
    getAvailableClubs,
    getAvailableTeams,
    getAvailableSeasons,
  } = useTeamSelectorStore();

  const availableTypes = getAvailableTypes();
  const availableClubs = getAvailableClubs();
  const availableTeams = getAvailableTeams();
  const availableSeasons = getAvailableSeasons();

  // Track the previous season to attempt persistence
  const previousSeasonRef = useRef(null);

  // Track window size for responsive behavior
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();
    setMounted(true);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadTeamsView();
  }, []);

  // When available seasons change (due to team change), try to persist the season
  useEffect(() => {
    if (
      previousSeasonRef.current &&
      availableSeasons.length > 0 &&
      !selectedSeason
    ) {
      // Try to find a season with the same name as the previous selection
      const matchingSeason = availableSeasons.find(
        (s) => s.name === previousSeasonRef.current.name
      );

      if (matchingSeason) {
        // Silently set the matching season without triggering preferences update
        setSeason(matchingSeason);
      }
    }
  }, [availableSeasons, selectedSeason, setSeason]);

  const handleSeasonChange = async (season) => {
    // Store the season for persistence
    previousSeasonRef.current = season;
    setSeason(season);

    // After setting season, selectedTeamSeasonId will be populated
    if (type !== "header") {
      // Get the updated team_season_id from store
      const teamSeasonId = useTeamSelectorStore.getState().selectedTeamSeasonId;

      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favorite_team_season_id: teamSeasonId,
        }),
      });
    }
  };

  const handleTeamChange = (team) => {
    // Store current season before changing teams
    if (selectedSeason) {
      previousSeasonRef.current = selectedSeason;
    }
    setTeam(team);
  };

  if (isLoading)
    return <div className='text-sm text-muted'>Loading teams...</div>;
  if (error) return <div className='text-sm text-danger'>Error: {error}</div>;
  if (!mounted) return null;

  // Responsive breakpoint (640px matches Tailwind's 'sm')
  const isMobile = windowWidth < 640;

  return (
    <div className='w-full sm:w-auto'>
      {/* Mobile: Horizontal scrollable single row */}
      {isMobile ? (
        <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
          {/* 1. Type Select */}
          <div className='flex-shrink-0 min-w-[120px]'>
            <Select
              label='Type'
              size='sm'
              width='sm'
              value={selectedType || ""}
              options={[
                { value: "", label: "Select Type" },
                ...availableTypes.map((type) => ({
                  value: type,
                  label: type === "club" ? "Club" : "School",
                })),
              ]}
              onChange={(e) => setType(e.target.value || null)}
            />
          </div>

          {/* 2. Club Select (filtered by type) */}
          <div className='flex-shrink-0 min-w-[160px]'>
            <Select
              label={
                selectedType === "club"
                  ? "Club"
                  : selectedType === "high_school"
                  ? "School"
                  : "Org"
              }
              size='sm'
              width='md'
              value={selectedClub?.id || ""}
              options={[
                { value: "", label: "Select Org" },
                ...availableClubs.map((club) => ({
                  value: club.id,
                  label: club.name,
                })),
              ]}
              onChange={(e) => {
                const club = availableClubs.find(
                  (c) => c.id === parseInt(e.target.value)
                );
                setClub(club || null);
              }}
              disabled={!selectedType}
            />
          </div>

          {/* 3. Team Select (filtered by club) */}
          <div className='flex-shrink-0 min-w-[140px]'>
            <Select
              label='Team'
              size='sm'
              width='md'
              value={selectedTeam?.id || ""}
              options={[
                { value: "", label: "Select Team" },
                ...availableTeams.map((team) => ({
                  value: team.id,
                  label: team.name,
                })),
              ]}
              onChange={(e) => {
                const team = availableTeams.find(
                  (t) => t.id === parseInt(e.target.value)
                );
                handleTeamChange(team || null);
              }}
              disabled={!selectedClub}
            />
          </div>

          {/* 4. Season Select (filtered by team) → Results in team_season ID */}
          <div className='flex-shrink-0 min-w-[120px]'>
            <Select
              label='Season'
              size='sm'
              width='sm'
              value={selectedSeason?.id || ""}
              options={[
                { value: "", label: "Select Season" },
                ...availableSeasons.map((season) => ({
                  value: season.id,
                  label: `${season.name}${season.is_current ? " •" : ""}`,
                })),
              ]}
              onChange={(e) => {
                const season = availableSeasons.find(
                  (s) => s.id === parseInt(e.target.value)
                );
                if (season) handleSeasonChange(season);
              }}
              disabled={!selectedTeam}
            />
          </div>
        </div>
      ) : (
        /* Desktop: Normal horizontal layout */
        <div className='flex gap-3'>
          {/* 1. Type Select */}
          <Select
            label='Type'
            size='sm'
            width='sm'
            value={selectedType || ""}
            options={[
              { value: "", label: "Select Type" },
              ...availableTypes.map((type) => ({
                value: type,
                label: type === "club" ? "Club" : "High School",
              })),
            ]}
            onChange={(e) => setType(e.target.value || null)}
          />

          {/* 2. Club Select (filtered by type) */}
          <Select
            label={
              selectedType === "club"
                ? "Club"
                : selectedType === "high_school"
                ? "High School"
                : "Organization"
            }
            size='sm'
            width='lg'
            value={selectedClub?.id || ""}
            options={[
              { value: "", label: "Select Organization" },
              ...availableClubs.map((club) => ({
                value: club.id,
                label: club.name,
              })),
            ]}
            onChange={(e) => {
              const club = availableClubs.find(
                (c) => c.id === parseInt(e.target.value)
              );
              setClub(club || null);
            }}
            disabled={!selectedType}
          />

          {/* 3. Team Select (filtered by club) */}
          <Select
            label='Team'
            size='sm'
            width='lg'
            value={selectedTeam?.id || ""}
            options={[
              { value: "", label: "Select Team" },
              ...availableTeams.map((team) => ({
                value: team.id,
                label: team.name,
              })),
            ]}
            onChange={(e) => {
              const team = availableTeams.find(
                (t) => t.id === parseInt(e.target.value)
              );
              handleTeamChange(team || null);
            }}
            disabled={!selectedClub}
          />

          {/* 4. Season Select (filtered by team) → Results in team_season ID */}
          <Select
            label='Season'
            size='sm'
            width='md'
            value={selectedSeason?.id || ""}
            options={[
              { value: "", label: "Select Season" },
              ...availableSeasons.map((season) => ({
                value: season.id,
                label: `${season.name}${season.is_current ? " (Current)" : ""}`,
              })),
            ]}
            onChange={(e) => {
              const season = availableSeasons.find(
                (s) => s.id === parseInt(e.target.value)
              );
              if (season) handleSeasonChange(season);
            }}
            disabled={!selectedTeam}
          />
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--color-border));
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--color-muted));
        }
      `}</style>
    </div>
  );
}

export default TeamSelector;

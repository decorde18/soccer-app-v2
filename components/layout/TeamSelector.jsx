"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Select from "../ui/Select";
import { useTeamSelectorStore } from "@/stores/teamSelectorStore";
import useAuthStore from "@/stores/authStore";

function TeamSelector({ type, onContextChange }) {
  const router = useRouter();
  const pathname = usePathname();

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
    getCurrentContext,
  } = useTeamSelectorStore();

  // Get auth state - only for preference saving
  const { isAuthenticated, user } = useAuthStore();

  const availableTypes = getAvailableTypes();
  const availableClubs = getAvailableClubs();
  const availableTeams = getAvailableTeams();
  const availableSeasons = getAvailableSeasons();

  const previousSeasonRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const hasLoadedRef = useRef(false); // Prevent multiple loads

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    setMounted(true);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load data on mount - ONLY ONCE and only if rawData is empty
  useEffect(() => {
    // Skip loading if type is "header" to prevent interference with page-specific routing
    if (type === "header" && hasLoadedRef.current) return;

    // Prevent multiple loads
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      const store = useTeamSelectorStore.getState();

      // Only load if we don't have data yet
      if (store.rawData.length === 0) {
        hasLoadedRef.current = true;

        // Priority order:
        // 1. Currently selected team season (from persisted state)
        // 2. User's favorite team season (if authenticated)
        // 3. null (no selection)
        const currentTeamSeasonId =
          selectedTeamSeasonId ||
          (isAuthenticated ? user?.favorite_team_season_id : null);

        await loadTeamsView(currentTeamSeasonId);
      } else {
        // Data already exists, just mark as loaded
        hasLoadedRef.current = true;
      }
    };

    // Add a small delay for header instances to let page finish loading
    if (type === "header") {
      const timer = setTimeout(loadData, 100);
      return () => clearTimeout(timer);
    } else {
      loadData();
    }
  }, []); // Empty deps - truly only once

  // Notify parent when context changes - with safety check
  useEffect(() => {
    if (!onContextChange || !mounted) return;

    // Don't trigger during initial load
    if (!hasLoadedRef.current) return;

    const context = {
      type: selectedType,
      club: selectedClub,
      team: selectedTeam,
      season: selectedSeason,
      teamSeasonId: selectedTeamSeasonId,
    };

    // Use setTimeout to prevent blocking navigation
    const timer = setTimeout(() => {
      onContextChange(context);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    selectedType,
    selectedClub,
    selectedTeam,
    selectedSeason,
    selectedTeamSeasonId,
    onContextChange,
    mounted,
  ]);

  // Season persistence logic
  useEffect(() => {
    if (
      previousSeasonRef.current &&
      availableSeasons.length > 0 &&
      !selectedSeason
    ) {
      const matchingSeason = availableSeasons.find(
        (s) => s.name === previousSeasonRef.current.name
      );

      if (matchingSeason) {
        setSeason(matchingSeason);
      }
    }
  }, [availableSeasons, selectedSeason, setSeason]);

  const handleSeasonChange = async (season) => {
    previousSeasonRef.current = season;
    setSeason(season);

    // Only save to user preferences if authenticated and not header type
    if (isAuthenticated && type !== "header") {
      const teamSeasonId = useTeamSelectorStore.getState().selectedTeamSeasonId;

      try {
        await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            favorite_team_season_id: teamSeasonId,
          }),
        });
      } catch (error) {
        console.error("Failed to save preference:", error);
      }
    }
  };

  const handleTeamChange = (team) => {
    if (selectedSeason) {
      previousSeasonRef.current = selectedSeason;
    }
    setTeam(team);
  };

  if (isLoading)
    return <div className='text-sm text-muted'>Loading teams...</div>;
  if (error) return <div className='text-sm text-danger'>Error: {error}</div>;
  if (!mounted) return null;

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
              placeholder='Select a Type'
              options={[
                ...availableTypes.map((type) => ({
                  value: type.value,
                  label: type.label,
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
              placeholder={`Select a ${
                selectedType === "club" ? "Club" : "School"
              }`}
              options={[
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
              placeholder='Select a Team'
              options={[
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

          {/* 4. Season Select (filtered by team) */}
          <div className='flex-shrink-0 min-w-[120px]'>
            <Select
              label='Season'
              size='sm'
              width='sm'
              value={selectedSeason?.id || ""}
              placeholder='Select a Season'
              options={[
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
            placeholder='Select a Type'
            options={[
              ...availableTypes.map((type) => ({
                value: type.value,
                label: type.label,
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
            placeholder={`Select a ${
              selectedType === "club" ? "Club" : "High School"
            }`}
            options={[
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
            placeholder='Select a Team'
            options={[
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

          {/* 4. Season Select (filtered by team) */}
          <Select
            label='Season'
            size='sm'
            width='md'
            value={selectedSeason?.id || ""}
            placeholder='Select a Season'
            options={[
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

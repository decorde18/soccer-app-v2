"use client";

import { create } from "zustand";

export const useDataStore = create((set) => ({
  teams: { data: null, loading: false, error: null },
  locations: { data: null, loading: false, error: null },
  sublocations: { data: null, loading: false, error: null },
  leagues: { data: null, loading: false, error: null },
  clubs: { data: null, loading: false, error: null },

  setTeams: (teamsData) => set({ teams: teamsData }),
  setLocations: (locationsData) => set({ locations: locationsData }),
  setsublocations: (sublocationsData) =>
    set({ sublocations: sublocationsData }),
  setLeagues: (leaguesData) => set({ leagues: leaguesData }),
  setClubs: (clubsData) => set({ clubs: clubsData }),
}));

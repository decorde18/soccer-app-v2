"use client";
import { useApiData } from "@/hooks/useApiData";
import { useDataStore } from "@/stores/useDataStore";
import { useEffect } from "react";

export default function DataProvider({ children }) {
  const teams = useApiData("v_teams_all", {
    sortBy: "club_name",
    order: "asc",
  });
  const locations = useApiData("v_locations", {
    sortBy: "location_name",
    order: "asc",
  });
  const sublocations = useApiData("v_locations_detailed", {
    sortBy: "location_name",
    order: "asc",
  });
  const clubs = useApiData("clubs", {
    sortBy: "name",
    order: "asc",
  });
  const leagues = useApiData("v_leagues", {
    sortBy: "league_name",
    order: "asc",
  });

  const setTeams = useDataStore((state) => state.setTeams);
  const setLocations = useDataStore((state) => state.setLocations);
  const setsublocations = useDataStore((state) => state.setsublocations);
  const setClubs = useDataStore((state) => state.setClubs);
  const setLeagues = useDataStore((state) => state.setLeagues);

  useEffect(() => {
    setTeams(teams);
  }, [teams]);

  useEffect(() => {
    setLocations(locations);
  }, [locations]);
  useEffect(() => {
    setsublocations(sublocations);
  }, [sublocations]);
  useEffect(() => {
    setLeagues(leagues);
  }, [leagues]);
  useEffect(() => {
    setClubs(clubs);
  }, [clubs]);

  return children;
}

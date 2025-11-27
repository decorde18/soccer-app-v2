"use client";
import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Form from "@/components/ui/Form";
import { toDateInputValue, toTimeInputValue } from "@/lib/dateTimeUtils";
import { useDataStore } from "@/stores/useDataStore";
import { useApiData } from "@/hooks/useApiData";

export default function GameModal({
  isOpen,
  onClose,
  onSave,
  game,
  teamSeasonId,
}) {
  const defaultGameData = {
    start_date: "",
    start_time: "",
    timezone_label: "CDT",
    game_type: "league",
    league_node_id: null,
    club_id: null,
    opponent: null,
    location_id: null,
    sublocation_id: null,
    home_away: "home",
    score_us: "",
    score_them: "",
    status: "scheduled",
  };
  //todo league nodes needs to be a different idea. if the game can be in multiple leagues/tournaments we need to handle that. game.leagues_array
  //todo probably don't want to change to sql date time until after end date and time are calculated in submit

  const [formData, setFormData] = useState(defaultGameData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(null);

  // Get data from stores
  const {
    data: teams,
    loading: loadingTeams,
    error: errorTeams,
  } = useDataStore((state) => state.teams);
  const {
    data: locations,
    loading: loadingLocations,
    error: errorLocations,
  } = useDataStore((state) => state.locations);
  const {
    data: sublocations,
    loading: loadingSublocations,
    error: errorSublocations,
  } = useDataStore((state) => state.sublocations);
  const {
    data: clubs,
    loading: loadingClubs,
    error: errorClubs,
  } = useDataStore((state) => state.clubs);
  const {
    data: leagues,
    loading: loadingLeagues,
    error: errorLeagues,
  } = useDataStore((state) => state.leagues);

  const {
    data: leagueTeams,
    loading: loadingLeagueTeams,
    error: errorLeagueTeams,
  } = useApiData("v_league_teams");

  // Aggregate loading and error states
  useEffect(() => {
    const isLoading =
      loadingTeams ||
      loadingLocations ||
      loadingSublocations ||
      loadingClubs ||
      loadingLeagues ||
      loadingLeagueTeams;
    setLoading(isLoading);

    const hasError =
      errorTeams ||
      errorLocations ||
      errorSublocations ||
      errorClubs ||
      errorLeagues ||
      errorLeagueTeams;
    setError(hasError);
  }, [
    loadingTeams,
    loadingLocations,
    loadingSublocations,
    loadingClubs,
    loadingLeagues,
    loadingLeagueTeams,
    errorTeams,
    errorLocations,
    errorSublocations,
    errorClubs,
    errorLeagues,
    errorLeagueTeams,
  ]);

  // Get current team info
  useEffect(() => {
    if (loadingTeams || !teams || !teamSeasonId) return;
    const team = teams.find((t) => t.id === +teamSeasonId);
    setCurrentTeam(team);
  }, [teams, loadingTeams, teamSeasonId]);

  // Filter 1 & 2: League/Tournament filtering based on game_type and team membership
  const filteredLeagues = useMemo(() => {
    if (!leagues || !leagueTeams || !teamSeasonId) return [];

    const { game_type } = formData;

    // Don't show leagues for non-league/tournament game types
    if (!["league", "tournament"].includes(game_type)) return [];

    const isTournament = game_type === "tournament" ? 1 : 0;

    // Get league IDs where current team is a member
    const teamLeagueIds = leagueTeams
      .filter((lt) => lt.team_season_id === +teamSeasonId)
      .map((lt) => lt.league_id);

    // Filter leagues by: team is member AND is_tournament matches game_type
    return leagues.filter(
      (league) =>
        league.is_tournament === isTournament &&
        teamLeagueIds.includes(league.id)
    );
  }, [leagues, leagueTeams, teamSeasonId, formData.game_type]);

  // Filter 4: Opponent teams filtered by selected club
  const filteredOpponentTeams = useMemo(() => {
    if (!teams || !currentTeam) return [];

    // Teams eligible to play against (same type, same season, not current team)
    let eligible = teams.filter(
      (team) =>
        team.type === currentTeam.type &&
        team.season_id === currentTeam.season_id &&
        team.id !== currentTeam.id
    );

    // If club is selected, further filter by club_id
    if (formData.club_id) {
      eligible = eligible.filter((team) => team.club_id === formData.club_id);
    }

    return eligible;
  }, [teams, currentTeam, formData.club_id]);

  // Filter 5: Sublocations filtered by selected location
  const filteredSublocations = useMemo(() => {
    if (!sublocations || !formData.location_id) return [];
    return sublocations.filter(
      (sub) => sub.location_id === formData.location_id
    );
  }, [sublocations, formData.location_id]);

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (game) {
      const isHome = +teamSeasonId === game.home_team_season_id;

      setFormData({
        start_date: toDateInputValue(game.start_date) || "",
        start_time: toTimeInputValue(game.start_time) || "",
        timezone_label: game.timezone_label || "CDT",
        game_type: game.game_type || "league",
        league_node_id: game.league_node_id || null,
        club_id: isHome
          ? teams.find((team) => team.id === game.away_team_season_id).club_id
          : teams.find((team) => team.id === game.home_team_season_id)
              .club_id || null,
        opponent: isHome
          ? game.away_team_season_id
          : game.home_team_season_id || null,
        location_id: game.location_id || null,
        sublocation_id: game.sublocation_id || null,
        home_away: game.home_away || "home",
        score_us: game.score_us ?? "",
        score_them: game.score_them ?? "",
        status: game.status || "scheduled",
      });
    } else {
      setFormData(defaultGameData);
    }
  }, [isOpen, game]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };

      // Reset dependent fields when parent changes
      if (fieldName === "game_type") {
        newData.league_node_id = null; // Clear league when game type changes
      }
      if (fieldName === "club_id") {
        newData.opponent = null; // Clear opponent when club changes
      }
      if (fieldName === "location_id") {
        newData.sublocation_id = null; // Clear sublocation when location changes
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        score_us: formData.score_us === "" ? null : parseInt(formData.score_us),
        score_them:
          formData.score_them === "" ? null : parseInt(formData.score_them),
      };
      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async (fieldName, newValue) => {
    try {
      const response = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldName, value: newValue }),
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add option:", error);
      return false;
    }
  };

  if (loading) return;
  if (error) return <div>Error loading data</div>;

  // Build fields dynamically based on game_type
  const fields = [
    {
      name: "start_date",
      label: "Game Date",
      type: "date",
      required: true,
    },
    {
      name: "start_time",
      label: "Game Time",
      type: "time",
      required: true,
    },
    {
      name: "timezone_label",
      label: "Time Zone",
      type: "select",
      required: true,
      allowOther: true,
      options: [
        { value: "CDT", label: "CDT" },
        { value: "CST", label: "CST" },
        { value: "EDT", label: "EDT" },
        { value: "EST", label: "EST" },
      ],
    },
    {
      name: "game_type",
      label: "Game Type",
      type: "select",
      required: true,
      options: [
        { value: "league", label: "League" },
        { value: "tournament", label: "Tournament" },
        { value: "friendly", label: "Friendly" },
        { value: "scrimmage", label: "Scrimmage" },
        { value: "exhibition", label: "Exhibition" },
        { value: "playoff", label: "Playoff" },
      ],
    },
    // Filter 1-3: Only show league/tournament selector for league/tournament games
    ...(["league", "tournament"].includes(formData.game_type)
      ? [
          {
            name: "league_node_id",
            label:
              formData.game_type === "tournament" ? "Tournament" : "League",
            type: "select",
            required: true,
            allowOther: true,
            options: filteredLeagues.map((item) => ({
              value: item.id,
              label: item.league_name,
            })),
            helperText:
              filteredLeagues.length === 0
                ? `No ${formData.game_type}s found for this team`
                : undefined,
          },
        ]
      : []),
    {
      name: "club_id",
      label: "Opponent Club",
      type: "select",
      allowOther: true,
      options: clubs.map((item) => ({ value: item.id, label: item.name })),
      required: true,
      helperText: "Select club first to filter opponent teams",
    },
    // Filter 4: Opponent teams filtered by club
    {
      name: "opponent",
      label: "Opponent Team",
      type: "select",
      allowOther: true,
      options: filteredOpponentTeams.map((item) => ({
        value: item.id,
        label: item.team_name,
      })),
      required: true,
      disabled: !formData.club_id,
      helperText: !formData.club_id
        ? "Select a club first"
        : filteredOpponentTeams.length === 0
        ? "No eligible teams from this club"
        : undefined,
    },
    {
      name: "location_id",
      label: "Location",
      type: "select",
      allowOther: true,
      placeholder: "Select game location",
      required: true,
      options: locations.map((item) => ({
        value: item.location_id,
        label: item.location_name,
      })),
      helperText: "Select location first to filter fields",
    },
    // Filter 5: Sublocations filtered by location
    {
      name: "sublocation_id",
      label: "Field / Court",
      type: "select",
      allowOther: true,
      placeholder: "Select specific field",
      options: filteredSublocations.map((item) => ({
        value: item.sublocation_id,
        label: item.sublocation_name,
      })),
      disabled: !formData.location_id,
      helperText: !formData.location_id
        ? "Select a location first"
        : filteredSublocations.length === 0
        ? "No fields available for this location"
        : undefined,
    },
    {
      name: "home_away",
      label: "Home/Away",
      type: "toggle",
      required: true,
      options: [
        { value: "home", label: "Home" },
        { value: "away", label: "Away" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "scheduled", label: "Scheduled" },
        { value: "completed", label: "Completed" },
        { value: "canceled", label: "Canceled" },
      ],
    },
    {
      name: "score_us",
      label: "Our Score",
      type: "number",
      min: 0,
      placeholder: "Leave empty if not played",
      helperText: "Only enter if game has been played",
    },
    {
      name: "score_them",
      label: "Opponent Score",
      type: "number",
      min: 0,
      placeholder: "Leave empty if not played",
      helperText: "Only enter if game has been played",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={game ? "Edit Game" : "Add Game"}
      size='lg'
    >
      <Form
        fields={fields}
        data={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isEditing={!!game}
        loading={loading}
        submitText={game ? "Update Game" : "Add Game"}
        onAddOption={handleAddOption}
      />
    </Modal>
  );
}

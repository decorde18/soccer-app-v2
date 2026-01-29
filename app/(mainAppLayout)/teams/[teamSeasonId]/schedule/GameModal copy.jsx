"use client";
import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { Tabs, Tab } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import { toDateInputValue, toTimeInputValue } from "@/lib/dateTimeUtils";
import { useDataStore } from "@/stores/useDataStore";
import { useApiData } from "@/hooks/useApiData";
import { validateGameData } from "@/lib/gameDataProcessor";
import {
  GameBasicInfo,
  GameOpponent,
  GameLocation,
  GameLeagues,
  GameScoring,
} from "@/components/ui/game-form";

// Sub-modal for adding new club
function AddClubModal({ isOpen, onClose, onSave }) {
  const [clubData, setClubData] = useState({ name: "", location: "" });

  const handleSave = async () => {
    if (!clubData.name.trim()) return;
    await onSave(clubData);
    setClubData({ name: "", location: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Club' size='sm'>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Club Name <span className='text-accent'>*</span>
          </label>
          <input
            type='text'
            value={clubData.name}
            onChange={(e) =>
              setClubData((prev) => ({ ...prev, name: e.target.value }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='Enter club name'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Location</label>
          <input
            type='text'
            value={clubData.location}
            onChange={(e) =>
              setClubData((prev) => ({ ...prev, location: e.target.value }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='City, State'
          />
        </div>
        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSave}
            disabled={!clubData.name.trim()}
          >
            Add Club
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Sub-modal for adding new location
function AddLocationModal({ isOpen, onClose, onSave }) {
  const [locationData, setLocationData] = useState({
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
  });

  const handleSave = async () => {
    if (!locationData.name.trim()) return;
    await onSave(locationData);
    setLocationData({
      name: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Location' size='md'>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Location Name <span className='text-accent'>*</span>
          </label>
          <input
            type='text'
            value={locationData.name}
            onChange={(e) =>
              setLocationData((prev) => ({ ...prev, name: e.target.value }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='e.g., Smith Sports Complex'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Address</label>
          <input
            type='text'
            value={locationData.address_line1}
            onChange={(e) =>
              setLocationData((prev) => ({
                ...prev,
                address_line1: e.target.value,
              }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='Street address'
          />
        </div>
        <div className='grid grid-cols-3 gap-3'>
          <div className='col-span-2'>
            <label className='block text-sm font-medium mb-1'>City</label>
            <input
              type='text'
              value={locationData.city}
              onChange={(e) =>
                setLocationData((prev) => ({ ...prev, city: e.target.value }))
              }
              className='w-full px-3 py-2 border border-border rounded-md'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>State</label>
            <input
              type='text'
              value={locationData.state}
              onChange={(e) =>
                setLocationData((prev) => ({ ...prev, state: e.target.value }))
              }
              className='w-full px-3 py-2 border border-border rounded-md'
              placeholder='TN'
              maxLength={2}
            />
          </div>
        </div>
        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSave}
            disabled={!locationData.name.trim()}
          >
            Add Location
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
    league_node_ids: [],
    club_id: null,
    opponent: null,
    location_id: null,
    sublocation_id: null,
    home_away: "home",
    score_us: null,
    score_them: null,
    status: "scheduled",
    has_overtime: false,
    has_shootout: false,
    max_ot_periods: "2",
    notes: "",
  };

  const [formData, setFormData] = useState(defaultGameData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);

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
    create: createClub,
  } = useDataStore((state) => state.clubs);

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
      loadingLeagueTeams;
    setLoading(isLoading);

    const hasError =
      errorTeams ||
      errorLocations ||
      errorSublocations ||
      errorClubs ||
      errorLeagueTeams;
    setError(hasError);
  }, [
    loadingTeams,
    loadingLocations,
    loadingSublocations,
    loadingClubs,
    loadingLeagueTeams,
    errorTeams,
    errorLocations,
    errorSublocations,
    errorClubs,
    errorLeagueTeams,
  ]);

  // Get current team info
  useEffect(() => {
    if (loadingTeams || !teams || !teamSeasonId) return;
    const team = teams.find((t) => t.id === +teamSeasonId);
    setCurrentTeam(team);
  }, [teams, loadingTeams, teamSeasonId]);

  // Filter leagues based on game_type and team membership
  const filteredLeagues = useMemo(() => {
    if (!leagueTeams || !teamSeasonId) return [];

    const { game_type } = formData;

    if (!["league", "tournament", "playoff"].includes(game_type)) return [];

    // Get unique leagues where current team is enrolled
    const teamLeagues = leagueTeams
      .filter((lt) => lt.team_season_id === +teamSeasonId)
      .reduce((acc, lt) => {
        if (!acc.find((l) => l.id === lt.league_id)) {
          acc.push({
            id: lt.league_id,
            league_name: lt.league_name,
            is_tournament: lt.is_tournament || 0,
          });
        }
        return acc;
      }, []);

    // Filter by game type
    const isTournament = game_type === "tournament" ? 1 : 0;
    return teamLeagues.filter(
      (league) => league.is_tournament === isTournament
    );
  }, [leagueTeams, teamSeasonId, formData.game_type]);

  // Filter opponent teams by selected club
  const filteredOpponentTeams = useMemo(() => {
    if (!teams || !currentTeam) return [];

    let eligible = teams.filter(
      (team) =>
        team.type === currentTeam.type &&
        team.season_id === currentTeam.season_id &&
        team.id !== currentTeam.id
    );

    if (formData.club_id) {
      eligible = eligible.filter((team) => team.club_id === formData.club_id);
    }

    return eligible;
  }, [teams, currentTeam, formData.club_id]);

  // Filter sublocations by selected location
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

      // Parse league_names into league_node_ids array
      // This is a simplified version - you may need to fetch actual league_node_season_ids
      const leagueIds = []; // TODO: Extract from game data

      setFormData({
        start_date: toDateInputValue(game.start_date) || "",
        start_time: toTimeInputValue(game.start_time) || "",
        timezone_label: game.timezone_label || "CDT",
        game_type: game.game_type || "league",
        league_node_ids: leagueIds,
        club_id: isHome
          ? teams.find((team) => team.id === game.away_team_season_id)?.club_id
          : teams.find((team) => team.id === game.home_team_season_id)
              ?.club_id || null,
        opponent: isHome
          ? game.away_team_season_id
          : game.home_team_season_id || null,
        location_id: game.location_id || null,
        sublocation_id: game.sublocation_id || null,
        home_away: isHome ? "home" : "away",
        score_us: game.score_us ?? null,
        score_them: game.score_them ?? null,
        status: game.status || "scheduled",
        has_overtime: game.final_status === "overtime",
        has_shootout: false, // TODO: Extract from game data
        max_ot_periods: "2",
        notes: game.notes || "",
      });
    } else {
      setFormData(defaultGameData);
    }
  }, [isOpen, game, teams, teamSeasonId]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };

      // Reset dependent fields when parent changes
      if (fieldName === "game_type") {
        newData.league_node_ids = [];
      }
      if (fieldName === "club_id") {
        newData.opponent = null;
      }
      if (fieldName === "location_id") {
        newData.sublocation_id = null;
      }

      return newData;
    });

    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    // Validate
    const validation = validateGameData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClub = async (clubData) => {
    try {
      const newClub = await createClub(clubData);
      setFormData((prev) => ({ ...prev, club_id: newClub.id }));
      setShowAddClub(false);
    } catch (err) {
      console.error("Failed to add club:", err);
      alert("Error adding club");
    }
  };

  const handleAddLocation = async (locationData) => {
    try {
      // First create address
      const addressResponse = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line1: locationData.address_line1,
          city: locationData.city,
          state: locationData.state,
          postal_code: locationData.postal_code,
          country: "USA",
        }),
      });
      const address = await addressResponse.json();

      // Then create location
      const locationResponse = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationData.name,
          address_id: address.id,
        }),
      });
      const location = await locationResponse.json();

      setFormData((prev) => ({ ...prev, location_id: location.id }));
      setShowAddLocation(false);
    } catch (err) {
      console.error("Failed to add location:", err);
      alert("Error adding location");
    }
  };

  if (loading && !isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={game ? "Edit Game" : "Add Game"}
        size='xl'
      >
        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md'>
            {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className='mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md'>
            <p className='font-semibold mb-1'>
              Please fix the following errors:
            </p>
            <ul className='list-disc list-inside text-sm'>
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <Tabs defaultTab={0} variant='underline'>
          <Tab label='Game Info'>
            <GameBasicInfo data={formData} onChange={handleChange} />
          </Tab>

          <Tab label='Opponent'>
            <GameOpponent
              data={formData}
              onChange={handleChange}
              clubs={clubs || []}
              teams={filteredOpponentTeams}
              onAddClub={() => setShowAddClub(true)}
            />
          </Tab>

          <Tab label='Location'>
            <GameLocation
              data={formData}
              onChange={handleChange}
              locations={locations || []}
              sublocations={filteredSublocations}
              onAddLocation={() => setShowAddLocation(true)}
            />
          </Tab>

          <Tab label='League/Tournament'>
            <GameLeagues
              data={formData}
              onChange={handleChange}
              leagues={filteredLeagues}
            />
          </Tab>

          <Tab label='Score'>
            <GameScoring data={formData} onChange={handleChange} />
          </Tab>
        </Tabs>

        <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-border'>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : game ? "Update Game" : "Add Game"}
          </Button>
        </div>
      </Modal>

      <AddClubModal
        isOpen={showAddClub}
        onClose={() => setShowAddClub(false)}
        onSave={handleAddClub}
      />

      <AddLocationModal
        isOpen={showAddLocation}
        onClose={() => setShowAddLocation(false)}
        onSave={handleAddLocation}
      />
    </>
  );
}

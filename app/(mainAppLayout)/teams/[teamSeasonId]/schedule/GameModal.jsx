"use client";
import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { Tabs, Tab } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { toDateInputValue, toTimeInputValue } from "@/lib/dateTimeUtils";
import { useDataStore } from "@/stores/useDataStore";
import { useApiData } from "@/hooks/useApiData";
import { validateGameData } from "@/lib/gameDataProcessor";
import { apiFetch } from "@/app/api/fetcher";

// Sub-modal for adding new club
function AddClubModal({ isOpen, onClose, onSave }) {
  const [clubData, setClubData] = useState({ name: "", location: "" });

  const handleSave = async () => {
    if (!clubData.name.trim()) return;
    await onSave(clubData);
    setClubData({ name: "", location: "" });
  };

  if (!isOpen) return null;

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

// Sub-modal for adding new team to a club
function AddTeamModal({ isOpen, onClose, onSave, clubId, clubName, seasonId }) {
  const [teamData, setTeamData] = useState({
    team_name: "",
    gender: "Women",
  });

  const handleSave = async () => {
    if (!teamData.team_name.trim()) return;
    await onSave(teamData);
    setTeamData({
      team_name: "",
      gender: "Women",
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Team to ${clubName}`}
      size='md'
    >
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Team Name <span className='text-accent'>*</span>
          </label>
          <input
            type='text'
            value={teamData.team_name}
            onChange={(e) =>
              setTeamData((prev) => ({ ...prev, team_name: e.target.value }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='e.g., U12 Boys Gold'
          />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='block text-sm font-medium mb-1'>Gender</label>
            <Select
              value={teamData.gender}
              onChange={(e) =>
                setTeamData((prev) => ({ ...prev, gender: e.target.value }))
              }
              options={[
                { value: "women", label: "Women" },
                { value: "men", label: "Men" },
                { value: "coEd", label: "CoEd" },
              ]}
              width='full'
              showPlaceholder={false}
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
            disabled={!teamData.team_name.trim()}
          >
            Add Team
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

  if (!isOpen) return null;

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

// Sub-modal for adding field/court to venue
function AddSublocationModal({
  isOpen,
  onClose,
  onSave,
  locationId,
  locationName,
}) {
  const [sublocationData, setSublocationData] = useState({
    name: "",
    type: "field",
  });

  const handleSave = async () => {
    if (!sublocationData.name.trim()) return;
    await onSave(sublocationData);
    setSublocationData({ name: "", type: "field" });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Field/Court to ${locationName}`}
      size='sm'
    >
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Field/Court Name <span className='text-accent'>*</span>
          </label>
          <input
            type='text'
            value={sublocationData.name}
            onChange={(e) =>
              setSublocationData((prev) => ({ ...prev, name: e.target.value }))
            }
            className='w-full px-3 py-2 border border-border rounded-md'
            placeholder='e.g., Field 1, Court A'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Type</label>
          <Select
            value={sublocationData.type}
            onChange={(e) =>
              setSublocationData((prev) => ({ ...prev, type: e.target.value }))
            }
            options={[
              { value: "field", label: "Field" },
              { value: "court", label: "Court" },
              { value: "pitch", label: "Pitch" },
              { value: "diamond", label: "Diamond" },
              { value: "rink", label: "Rink" },
            ]}
            width='full'
            showPlaceholder={false}
          />
        </div>

        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSave}
            disabled={!sublocationData.name.trim()}
          >
            Add Field/Court
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Game Basic Info Component (refactored to use custom components)
function GameBasicInfo({ data, onChange }) {
  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Game Details</h3>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Game Date <span className='text-accent'>*</span>
          </label>
          <input
            type='date'
            value={data.start_date || ""}
            onChange={(e) => onChange("start_date", e.target.value)}
            required
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Game Time</label>
          <input
            type='time'
            value={data.start_time || ""}
            onChange={(e) => onChange("start_time", e.target.value)}
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Time Zone <span className='text-accent'>*</span>
          </label>
          <Select
            value={data.timezone_label || "CDT"}
            onChange={(e) => onChange("timezone_label", e.target.value)}
            options={["CDT", "CST", "EDT", "EST", "MDT", "MST", "PDT", "PST"]}
            width='full'
            showPlaceholder={false}
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Game Type <span className='text-accent'>*</span>
          </label>
          <Select
            value={data.game_type || "league"}
            onChange={(e) => onChange("game_type", e.target.value)}
            required
            options={[
              { value: "league", label: "League" },
              { value: "tournament", label: "Tournament" },
              { value: "playoff", label: "Playoff" },
              { value: "friendly", label: "Friendly" },
              { value: "scrimmage", label: "Scrimmage" },
              { value: "exhibition", label: "Exhibition" },
            ]}
            width='full'
            showPlaceholder={false}
          />
        </div>
      </div>
    </div>
  );
}

// Home/Away Tab Component
function GameHomeAway({ data, onChange }) {
  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Home or Away?</h3>
      <p className='text-sm text-muted mb-4'>
        Select whether this game will be played at your home venue or away.
      </p>

      <div className='flex gap-3'>
        <button
          type='button'
          onClick={() => onChange("home_away", "home")}
          className={`flex-1 py-8 px-4 rounded-lg border-2 transition-all ${
            data.home_away === "home"
              ? "border-primary bg-primary/10 text-primary font-semibold shadow-lg"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <div className='text-center'>
            <div className='text-4xl mb-2'>🏠</div>
            <div className='text-xl font-bold'>Home</div>
          </div>
        </button>
        <button
          type='button'
          onClick={() => onChange("home_away", "away")}
          className={`flex-1 py-8 px-4 rounded-lg border-2 transition-all ${
            data.home_away === "away"
              ? "border-primary bg-primary/10 text-primary font-semibold shadow-lg"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <div className='text-center'>
            <div className='text-4xl mb-2'>✈️</div>
            <div className='text-xl font-bold'>Away</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Game Opponent Component (refactored)
function GameOpponent({ data, onChange, clubs, teams, onAddClub, onAddTeam }) {
  const filteredTeams = teams.filter((team) =>
    data.club_id ? team.club_id === data.club_id : true,
  );

  const selectedClub = clubs.find((club) => club.id === data.club_id);

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Opponent</h3>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Opponent Club <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-2'>
          <Select
            value={data.club_id || ""}
            onChange={(e) =>
              onChange(
                "club_id",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            options={[
              { value: "", label: "Select opponent club..." },
              ...clubs.map((club) => ({
                value: club.id,
                label: club.name,
              })),
            ]}
            width='full'
            showPlaceholder={false}
          />
          <button
            type='button'
            onClick={onAddClub}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors flex-shrink-0'
            title='Add new club'
          >
            +
          </button>
        </div>
        <p className='text-xs text-muted mt-1'>
          Select club first to filter opponent teams
        </p>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Opponent Team <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-2'>
          <Select
            value={data.opponent || ""}
            onChange={(e) =>
              onChange(
                "opponent",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            required
            disabled={!data.club_id}
            options={[
              {
                value: "",
                label: data.club_id
                  ? "Select opponent team..."
                  : "Select a club first",
              },
              ...filteredTeams.map((team) => ({
                value: team.id,
                label: team.team_name,
              })),
            ]}
            width='full'
            showPlaceholder={false}
          />
          <button
            type='button'
            onClick={onAddTeam}
            disabled={!data.club_id}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
            title='Add new team to club'
          >
            +
          </button>
        </div>
        {data.club_id && filteredTeams.length === 0 && (
          <p className='text-xs text-muted mt-1'>
            No eligible teams from this club - click + to add one
          </p>
        )}
      </div>
    </div>
  );
}

// Game Location Component (refactored)
function GameLocation({
  data,
  onChange,
  locations,
  sublocations,
  onAddLocation,
  onAddSublocation,
}) {
  const filteredSublocations = sublocations.filter((sub) =>
    data.location_id ? sub.location_id === data.location_id : false,
  );

  const selectedLocation = locations.find(
    (loc) => loc.location_id === data.location_id,
  );

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Location</h3>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Venue <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-2'>
          <Select
            value={data.location_id || ""}
            onChange={(e) =>
              onChange(
                "location_id",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            required
            options={[
              { value: "", label: "Select venue..." },
              ...locations.map((loc) => ({
                value: loc.location_id,
                label: loc.location_name,
              })),
            ]}
            width='full'
            showPlaceholder={false}
          />
          <button
            type='button'
            onClick={onAddLocation}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors flex-shrink-0'
            title='Add new location'
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Field / Court</label>
        <div className='flex gap-2'>
          <Select
            value={data.sublocation_id || ""}
            onChange={(e) =>
              onChange(
                "sublocation_id",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            disabled={!data.location_id}
            options={[
              {
                value: "",
                label: data.location_id
                  ? "Select field (optional)..."
                  : "Select a venue first",
              },
              ...filteredSublocations.map((sub) => ({
                value: sub.sublocation_id,
                label: sub.sublocation_name,
              })),
            ]}
            width='full'
            showPlaceholder={false}
          />
          <button
            type='button'
            onClick={onAddSublocation}
            disabled={!data.location_id}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
            title='Add new field/court'
          >
            +
          </button>
        </div>
        {data.location_id && filteredSublocations.length === 0 && (
          <p className='text-xs text-muted mt-1'>
            No fields available - click + to add one
          </p>
        )}
      </div>
    </div>
  );
}

// Game Leagues Component (refactored)
function GameLeagues({ data, onChange, leagues }) {
  const showLeagues = ["league", "tournament", "playoff"].includes(
    data.game_type,
  );

  if (!showLeagues) {
    return (
      <div className='space-y-4'>
        <h3 className='font-semibold text-lg mb-3'>League/Tournament</h3>
        <div className='p-6 bg-muted/10 rounded-md text-center'>
          <p className='text-muted'>
            League selection is not required for {data.game_type} games.
          </p>
          <p className='text-sm text-muted mt-2'>
            You can proceed to the next step.
          </p>
        </div>
      </div>
    );
  }

  const selectedIds = data.league_node_ids || [];

  const handleToggleLeague = (leagueId) => {
    const newIds = selectedIds.includes(leagueId)
      ? selectedIds.filter((id) => id !== leagueId)
      : [...selectedIds, leagueId];
    onChange("league_node_ids", newIds);
  };

  const handleSetPrimary = (leagueId) => {
    const newIds = [leagueId, ...selectedIds.filter((id) => id !== leagueId)];
    onChange("league_node_ids", newIds);
  };

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>
        {data.game_type === "tournament"
          ? "Tournaments"
          : data.game_type === "playoff"
            ? "Playoffs"
            : "Leagues"}
        <span className='text-accent'> *</span>
      </h3>

      <p className='text-sm text-muted mb-3'>
        Select all {data.game_type}s this game counts toward. The first one
        selected will be the primary.
      </p>

      {leagues.length === 0 ? (
        <div className='p-4 bg-muted/10 rounded-md text-sm text-muted'>
          No {data.game_type}s found for this team. The team must be enrolled in
          a {data.game_type} to schedule {data.game_type} games.
        </div>
      ) : (
        <div className='space-y-2 max-h-60 overflow-y-auto'>
          {leagues.map((league) => {
            const isSelected = selectedIds.includes(league.id);
            const isPrimary = selectedIds[0] === league.id;

            return (
              <div
                key={league.id}
                className={`p-3 rounded-md border-2 transition-all cursor-pointer ${
                  isSelected
                    ? isPrimary
                      ? "border-primary bg-primary/10"
                      : "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => handleToggleLeague(league.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => handleToggleLeague(league.id)}
                      className='w-4 h-4'
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className='font-medium'>{league.league_name}</div>
                      {isPrimary && (
                        <span className='text-xs text-primary font-semibold'>
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && !isPrimary && (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(league.id);
                      }}
                      className='text-xs px-2 py-1 border border-primary text-primary rounded hover:bg-primary/10'
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Game Scoring Component (refactored)
function GameScoring({ data, onChange }) {
  const hasScores =
    data.score_us !== null &&
    data.score_us !== undefined &&
    data.score_them !== null &&
    data.score_them !== undefined;

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Scoring (Optional)</h3>
      <p className='text-sm text-muted mb-4'>
        You can add scores now or leave empty and add them after the game is
        played.
      </p>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Our Score</label>
          <input
            type='number'
            min='0'
            value={data.score_us ?? ""}
            onChange={(e) =>
              onChange(
                "score_us",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            placeholder='Leave empty if not played'
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Opponent Score
          </label>
          <input
            type='number'
            min='0'
            value={data.score_them ?? ""}
            onChange={(e) =>
              onChange(
                "score_them",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            placeholder='Leave empty if not played'
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
      </div>

      {hasScores && (
        <>
          <div className='flex items-center gap-2 p-3 bg-muted/10 rounded-md'>
            <input
              type='checkbox'
              id='has_overtime'
              checked={data.has_overtime || false}
              onChange={(e) => onChange("has_overtime", e.target.checked)}
              className='w-4 h-4'
            />
            <label
              htmlFor='has_overtime'
              className='text-sm font-medium cursor-pointer'
            >
              Game went to overtime
            </label>
          </div>

          {data.has_overtime && (
            <div className='ml-6 space-y-3'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='has_shootout'
                  checked={data.has_shootout || false}
                  onChange={(e) => onChange("has_shootout", e.target.checked)}
                  className='w-4 h-4'
                />
                <label
                  htmlFor='has_shootout'
                  className='text-sm cursor-pointer'
                >
                  Decided by shootout/penalty kicks
                </label>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Maximum OT Periods
                </label>
                <input
                  type='number'
                  min='1'
                  max='5'
                  value={data.max_ot_periods || "2"}
                  onChange={(e) => onChange("max_ot_periods", e.target.value)}
                  className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <label className='block text-sm font-medium mb-1'>Game Status</label>
        <Select
          value={data.status || "scheduled"}
          onChange={(e) => onChange("status", e.target.value)}
          options={[
            { value: "scheduled", label: "Scheduled" },
            { value: "completed", label: "Completed" },
            { value: "postponed", label: "Postponed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          width='full'
          showPlaceholder={false}
        />
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Notes</label>
        <textarea
          value={data.notes || ""}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={3}
          placeholder='Optional notes about this game...'
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
        />
      </div>
    </div>
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
  const [currentTab, setCurrentTab] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState(new Set([0]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddSublocation, setShowAddSublocation] = useState(false);

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
    create: createSublocation,
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
    if (teams && teamSeasonId) {
      const team = teams.find((t) => t.id === parseInt(teamSeasonId));
      setCurrentTeam(team);
    }
  }, [teams, teamSeasonId]);

  // Get filtered leagues for current team
  const filteredLeagues = useMemo(() => {
    if (!leagueTeams || !teamSeasonId) return [];

    const { game_type } = formData;
    const teamLeagues = leagueTeams
      .filter((lt) => lt.team_season_id === parseInt(teamSeasonId))
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

    const isTournament = game_type === "tournament" ? 1 : 0;
    return teamLeagues.filter(
      (league) => league.is_tournament === isTournament,
    );
  }, [leagueTeams, teamSeasonId, formData.game_type]);

  // Filter opponent teams by selected club
  const filteredOpponentTeams = useMemo(() => {
    if (!teams || !currentTeam) return [];

    let eligible = teams.filter(
      (team) =>
        team.type === currentTeam.type &&
        team.season_id === currentTeam.season_id &&
        team.id !== currentTeam.id,
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
      (sub) => sub.location_id === formData.location_id,
    );
  }, [sublocations, formData.location_id]);

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (game) {
      const isHome = +teamSeasonId === game.home_team_season_id;
      const leagueIds = [];

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
        has_shootout: false,
        max_ot_periods: "2",
        notes: game.notes || "",
      });
    } else {
      setFormData(defaultGameData);
    }

    setCurrentTab(0);
    setVisitedTabs(new Set([0]));
  }, [isOpen, game, teams, teamSeasonId]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };

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

    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Tab validation
  const isTabComplete = (tabIndex) => {
    switch (tabIndex) {
      case 0: // Game Info
        return formData.start_date && formData.game_type;
      case 1: // Home/Away
        return formData.home_away;
      case 2: // Opponent
        return formData.club_id && formData.opponent;
      case 3: // Location
        return formData.location_id;
      case 4: // League
        if (!["league", "tournament", "playoff"].includes(formData.game_type)) {
          return true;
        }
        return formData.league_node_ids && formData.league_node_ids.length > 0;
      case 5: // Score (optional)
        return true;
      default:
        return false;
    }
  };

  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    setVisitedTabs((prev) => new Set([...prev, newTab]));
  };

  const handleNext = () => {
    if (currentTab < 5) {
      handleTabChange(currentTab + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTab > 0) {
      handleTabChange(currentTab - 1);
    }
  };

  const canProceed = () => {
    // Must visit all required tabs (0-4) and they must all be complete
    const requiredTabs = [0, 1, 2, 3, 4];
    const allRequiredVisited = requiredTabs.every((tab) =>
      visitedTabs.has(tab),
    );
    const allRequiredComplete = requiredTabs.every((tab) => isTabComplete(tab));
    return allRequiredVisited && allRequiredComplete;
  };

  const handleSubmit = async () => {
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

  const handleAddTeam = async (teamData) => {
    try {
      if (!formData.club_id || !currentTeam) return;

      // Create the team
      const newTeam = await apiFetch("teams", "POST", {
        club_id: formData.club_id,
        team_name: teamData.team_name,
        gender: teamData.gender,
      });

      // Create team_season entry
      await apiFetch("team_seasons", "POST", {
        team_id: newTeam.id,
        season_id: currentTeam.season_id,
      });

      // Refresh teams data
      window.location.reload(); // Simple refresh - could be improved with store refetch

      setFormData((prev) => ({ ...prev, opponent: newTeam.id }));
      setShowAddTeam(false);
    } catch (err) {
      console.error("Failed to add team:", err);
      alert("Error adding team");
    }
  };

  const handleAddLocation = async (locationData) => {
    try {
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

  const handleAddSublocation = async (sublocationData) => {
    try {
      if (!formData.location_id) return;

      const newSublocation = await createSublocation({
        location_id: formData.location_id,
        name: sublocationData.name,
        type: sublocationData.type,
      });

      setFormData((prev) => ({ ...prev, sublocation_id: newSublocation.id }));
      setShowAddSublocation(false);
    } catch (err) {
      console.error("Failed to add sublocation:", err);
      alert("Error adding field/court");
    }
  };

  if (!isOpen) return null;

  const selectedClub = clubs?.find((club) => club.id === formData.club_id);
  const selectedLocation = locations?.find(
    (loc) => loc.location_id === formData.location_id,
  );

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

        {/* Manual Tab Navigation */}
        <div className='mb-6'>
          <div className='flex gap-2 overflow-x-auto pb-2'>
            {[
              { label: "Game Info", icon: "📅" },
              { label: "Home/Away", icon: "🏠" },
              { label: "Opponent", icon: "⚔️" },
              { label: "Location", icon: "📍" },
              { label: "League", icon: "🏆" },
              { label: "Score", icon: "🎯" },
            ].map((tab, index) => {
              const isActive = currentTab === index;
              const isVisited = visitedTabs.has(index);
              const isComplete = isTabComplete(index);

              return (
                <button
                  key={index}
                  onClick={() => handleTabChange(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : isVisited
                        ? "border-border hover:border-primary/50"
                        : "border-border opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!isVisited && index > currentTab}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {isComplete && index !== 5 && (
                    <span className='text-success'>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className='min-h-[400px]'>
          {currentTab === 0 && (
            <GameBasicInfo data={formData} onChange={handleChange} />
          )}
          {currentTab === 1 && (
            <GameHomeAway data={formData} onChange={handleChange} />
          )}
          {currentTab === 2 && (
            <GameOpponent
              data={formData}
              onChange={handleChange}
              clubs={clubs || []}
              teams={filteredOpponentTeams}
              onAddClub={() => setShowAddClub(true)}
              onAddTeam={() => setShowAddTeam(true)}
            />
          )}
          {currentTab === 3 && (
            <GameLocation
              data={formData}
              onChange={handleChange}
              locations={locations || []}
              sublocations={filteredSublocations}
              onAddLocation={() => setShowAddLocation(true)}
              onAddSublocation={() => setShowAddSublocation(true)}
            />
          )}
          {currentTab === 4 && (
            <GameLeagues
              data={formData}
              onChange={handleChange}
              leagues={filteredLeagues}
            />
          )}
          {currentTab === 5 && (
            <GameScoring data={formData} onChange={handleChange} />
          )}
        </div>

        {/* Footer Navigation */}
        <div className='flex justify-between items-center mt-6 pt-4 border-t border-border'>
          <div>
            {currentTab > 0 && (
              <Button variant='outline' onClick={handlePrevious}>
                ← Previous
              </Button>
            )}
          </div>

          <div className='flex gap-3'>
            <Button variant='outline' onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            {currentTab < 5 ? (
              <Button
                variant='primary'
                onClick={handleNext}
                disabled={!isTabComplete(currentTab)}
              >
                Next →
              </Button>
            ) : (
              <Button
                variant='primary'
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
              >
                {loading ? "Saving..." : game ? "Update Game" : "Add Game"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <AddClubModal
        isOpen={showAddClub}
        onClose={() => setShowAddClub(false)}
        onSave={handleAddClub}
      />

      <AddTeamModal
        isOpen={showAddTeam}
        onClose={() => setShowAddTeam(false)}
        onSave={handleAddTeam}
        clubId={formData.club_id}
        clubName={selectedClub?.name || ""}
        seasonId={currentTeam?.season_id}
      />

      <AddLocationModal
        isOpen={showAddLocation}
        onClose={() => setShowAddLocation(false)}
        onSave={handleAddLocation}
      />

      <AddSublocationModal
        isOpen={showAddSublocation}
        onClose={() => setShowAddSublocation(false)}
        onSave={handleAddSublocation}
        locationId={formData.location_id}
        locationName={selectedLocation?.location_name || ""}
      />
    </>
  );
}

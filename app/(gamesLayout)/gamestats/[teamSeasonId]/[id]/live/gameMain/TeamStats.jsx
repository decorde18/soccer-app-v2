"use client";
import { useState, useEffect, useMemo } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { apiFetch } from "@/app/api/fetcher";

function TeamStats() {
  const game = useGameStore((s) => s.game);
  const getGameTime = useGameStore((s) => s.getGameTime);
  const getCurrentPeriodNumber = useGameStore((s) => s.getCurrentPeriodNumber);
  const players = useGamePlayersStore((s) => s.players);

  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");

  // Modal types configuration
  const EVENT_TYPES = {
    GOAL: { label: "Goal", category: "major", needsPlayer: true },
    DISCIPLINE: { label: "Discipline", category: "major", needsPlayer: true },
    PENALTY: { label: "Penalty", category: "major", needsPlayer: false },
    PAUSE: { label: "Game Paused", category: "major", needsPlayer: false },
    CORNER: { label: "Corner Kick", category: "stat", needsPlayer: false },
    OFFSIDE: { label: "Offside", category: "stat", needsPlayer: false },
    FOUL: { label: "Foul", category: "stat", needsPlayer: false },
    SHOT: { label: "Shot", category: "stat", needsPlayer: true },
    SAVE: { label: "Save", category: "stat", needsPlayer: true },
  };

  // Fetch stats on mount and when game changes
  useEffect(() => {
    if (game?.game_id) {
      fetchStats();
    }
  }, [game?.game_id]);

  const fetchStats = async () => {
    if (!game?.game_id) return;

    setIsLoading(true);
    try {
      const events = await apiFetch("game_events", "GET", null, null, {
        filters: { game_id: game.game_id, is_stoppage: 0 },
      });

      setStats(events || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Available players for selection
  const availablePlayers = useMemo(() => {
    return players
      .filter(
        (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
      )
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  }, [players]);

  // Count stats by type
  const statCounts = useMemo(() => {
    const counts = {
      corner: { us: 0, them: 0 },
      offside: { us: 0, them: 0 },
      foul: { us: 0, them: 0 },
      shot: 0,
      save: 0,
    };

    stats.forEach((stat) => {
      const isOurTeam = stat.for_team === game?.team_season_id;

      if (stat.event_type === "corner") {
        if (isOurTeam) counts.corner.us++;
        else counts.corner.them++;
      } else if (stat.event_type === "offside") {
        if (isOurTeam) counts.offside.us++;
        else counts.offside.them++;
      } else if (stat.event_type === "foul") {
        if (isOurTeam) counts.foul.us++;
        else counts.foul.them++;
      } else if (stat.event_type === "shot") {
        counts.shot++;
      } else if (stat.event_type === "save") {
        counts.save++;
      }
    });

    return counts;
  }, [stats, game]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setSelectedPlayer("");
    setShowModal(true);
  };

  const handleOpenMajorModal = () => {
    setShowMajorModal(true);
  };

  const handleCloseMajorModal = () => {
    setShowMajorModal(false);
  };

  const handleSelectMajorEvent = (type) => {
    setShowMajorModal(false);
    handleOpenModal(type);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedPlayer("");
  };

  const handleCreateEvent = async (forTeam) => {
    if (!game || !modalType) return;

    const eventConfig = EVENT_TYPES[modalType];

    // Validate player selection if needed
    if (eventConfig.needsPlayer && !selectedPlayer) {
      alert("Please select a player");
      return;
    }

    const gameTime = getGameTime();
    const period = getCurrentPeriodNumber();

    try {
      const eventData = {
        game_id: game.game_id,
        player_game_id: eventConfig.needsPlayer
          ? parseInt(selectedPlayer)
          : null,
        event_category: eventConfig.category,
        event_type: modalType.toLowerCase(),
        game_time: gameTime,
        period: period,
        for_team: forTeam,
        clock_should_run: modalType === "PAUSE" ? 0 : 1,
        is_stoppage: 0,
      };

      await apiFetch("game_events", "POST", eventData);
      await fetchStats();
      handleCloseModal();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  const handleQuickStat = async (statType, forTeam) => {
    if (!game) return;

    const gameTime = getGameTime();
    const period = getCurrentPeriodNumber();

    try {
      const eventData = {
        game_id: game.game_id,
        player_game_id: null,
        event_category: "stat",
        event_type: statType.toLowerCase(),
        game_time: gameTime,
        period: period,
        for_team: forTeam,
        clock_should_run: 1,
        is_stoppage: 0,
      };

      await apiFetch("game_events", "POST", eventData);
      await fetchStats();
    } catch (error) {
      console.error("Error creating stat:", error);
    }
  };

  const handleDeleteStat = async (statId) => {
    if (!confirm("Delete this stat?")) return;

    try {
      await apiFetch(`game_events?id=${statId}`, "DELETE");
      await fetchStats();
    } catch (error) {
      console.error("Error deleting stat:", error);
      alert("Failed to delete stat");
    }
  };

  if (isLoading) {
    return <div className='text-center text-muted py-4'>Loading stats...</div>;
  }

  return (
    <div className='w-[290px] min-w-[290px]'>
      {/* Major Event Button */}
      <div className='mb-3'>
        <Button
          onClick={handleOpenMajorModal}
          variant='primary'
          className='w-full'
          size='md'
        >
          Major Event
        </Button>
      </div>

      {/* Stat Counters - Compact with inline +/- buttons */}
      <div className='space-y-2 mb-3'>
        {/* Corner Kicks */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Corners</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("CORNER", game.team_season_id)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {statCounts.corner.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {statCounts.corner.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("CORNER", game.opponentId)}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors'
            >
              +
            </button>
          </div>
        </div>

        {/* Offsides */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Offsides</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("OFFSIDE", game.team_season_id)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {statCounts.offside.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {statCounts.offside.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("OFFSIDE", game.opponentId)}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors'
            >
              +
            </button>
          </div>
        </div>

        {/* Fouls */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Fouls</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("FOUL", game.team_season_id)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {statCounts.foul.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {statCounts.foul.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("FOUL", game.opponentId)}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors'
            >
              +
            </button>
          </div>
        </div>

        {/* Shots (Our Team Only) */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Shots</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={() => handleOpenModal("SHOT")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {statCounts.shot}
            </span>
          </div>
        </div>

        {/* Saves (Our Team Only) */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Saves</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={() => handleOpenModal("SAVE")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {statCounts.save}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events List */}
      <div className='border-t-2 border-border pt-3'>
        <h3 className='text-xs font-semibold text-text-label mb-2 uppercase'>
          Recent Events
        </h3>
        <div className='space-y-1.5 h-[105px] overflow-y-auto pr-1'>
          {stats.length === 0 ? (
            <div className='text-xs text-muted text-center py-4 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            stats
              .slice()
              .reverse()
              .map((stat) => {
                const player = players.find(
                  (p) => p.playerGameId === stat.player_game_id
                );
                const isOurTeam = stat.for_team === game?.team_season_id;

                return (
                  <div
                    key={stat.id}
                    className='flex items-center gap-2 p-2 bg-surface rounded-lg border border-border'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-text capitalize'>
                          {stat.event_type}
                        </span>
                        {!player && stat.for_team && (
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                              isOurTeam
                                ? "bg-primary text-white"
                                : "bg-accent text-white"
                            }`}
                          >
                            {isOurTeam ? "Us" : "Them"}
                          </span>
                        )}
                      </div>
                      {player && (
                        <div className='text-xs text-muted truncate mt-0.5'>
                          #{player.jerseyNumber} {player.fullName}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteStat(stat.id)}
                      className='w-6 h-6 flex items-center justify-center rounded bg-danger text-white hover:bg-error-hover transition-colors flex-shrink-0 text-sm font-bold'
                    >
                      ×
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Major Event Selection Modal */}
      {showMajorModal && (
        <Modal
          isOpen={showMajorModal}
          onClose={handleCloseMajorModal}
          title='Select Major Event'
        >
          <div className='space-y-2'>
            <Button
              onClick={() => handleSelectMajorEvent("GOAL")}
              variant='success'
              className='w-full'
            >
              Goal
            </Button>
            <Button
              onClick={() => handleSelectMajorEvent("DISCIPLINE")}
              variant='danger'
              className='w-full'
            >
              Discipline
            </Button>
            <Button
              onClick={() => handleSelectMajorEvent("PENALTY")}
              variant='outline'
              className='w-full'
            >
              Penalty
            </Button>
            <Button
              onClick={() => handleSelectMajorEvent("PAUSE")}
              variant='outline'
              className='w-full'
            >
              Game Paused
            </Button>
            <Button
              onClick={handleCloseMajorModal}
              variant='outline'
              className='w-full mt-4'
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {/* Event Detail Modal (for player selection) */}
      {showModal && modalType && (
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={EVENT_TYPES[modalType].label}
        >
          <div className='space-y-4'>
            {/* Player Selection (if needed) */}
            {EVENT_TYPES[modalType].needsPlayer && (
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Select Player
                </label>
                <Select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  options={[
                    { value: "", label: "Select a player..." },
                    ...availablePlayers,
                  ]}
                />
              </div>
            )}

            {/* Team Selection (for stats that track both teams) */}
            {["CORNER", "OFFSIDE", "FOUL"].includes(modalType) && (
              <div className='flex gap-2'>
                <Button
                  onClick={() => handleCreateEvent(game.team_season_id)}
                  variant='primary'
                  className='flex-1'
                >
                  Our Team
                </Button>
                <Button
                  onClick={() => handleCreateEvent(game.opponentId)}
                  variant='accent'
                  className='flex-1'
                >
                  Opponent
                </Button>
              </div>
            )}

            {/* Direct action for player-specific or single-team events */}
            {(EVENT_TYPES[modalType].needsPlayer ||
              ["PENALTY", "PAUSE", "SHOT", "SAVE"].includes(modalType)) && (
              <Button
                onClick={() => handleCreateEvent(game.team_season_id)}
                variant='success'
                className='w-full'
                disabled={EVENT_TYPES[modalType].needsPlayer && !selectedPlayer}
              >
                Create {EVENT_TYPES[modalType].label}
              </Button>
            )}

            <Button
              onClick={handleCloseModal}
              variant='outline'
              className='w-full'
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TeamStats;

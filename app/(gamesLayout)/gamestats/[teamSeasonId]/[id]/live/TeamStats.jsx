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
    <div className='w-full'>
      {/* Quick Action Buttons */}
      <div className='grid grid-cols-2 gap-2 mb-3'>
        <Button
          onClick={() => handleOpenModal("GOAL")}
          variant='success'
          size='sm'
        >
          Goal
        </Button>
        <Button
          onClick={() => handleOpenModal("DISCIPLINE")}
          variant='danger'
          size='sm'
        >
          Discipline
        </Button>
        <Button
          onClick={() => handleOpenModal("PENALTY")}
          variant='outline'
          size='sm'
        >
          Penalty
        </Button>
        <Button
          onClick={() => handleOpenModal("PAUSE")}
          variant='outline'
          size='sm'
        >
          Game Paused
        </Button>
      </div>

      {/* Stat Counters */}
      <div className='space-y-2 mb-3'>
        {/* Corner Kicks */}
        <div className='flex items-center justify-between p-2 bg-surface rounded border border-border'>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => handleOpenModal("CORNER")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-xs font-medium'>Corner Kicks</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-bold text-primary'>
              {statCounts.corner.us}
            </span>
            <span className='text-muted'>-</span>
            <span className='font-bold text-accent'>
              {statCounts.corner.them}
            </span>
          </div>
        </div>

        {/* Offsides */}
        <div className='flex items-center justify-between p-2 bg-surface rounded border border-border'>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => handleOpenModal("OFFSIDE")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-xs font-medium'>Offsides</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-bold text-primary'>
              {statCounts.offside.us}
            </span>
            <span className='text-muted'>-</span>
            <span className='font-bold text-accent'>
              {statCounts.offside.them}
            </span>
          </div>
        </div>

        {/* Fouls */}
        <div className='flex items-center justify-between p-2 bg-surface rounded border border-border'>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => handleOpenModal("FOUL")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-xs font-medium'>Fouls</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-bold text-primary'>{statCounts.foul.us}</span>
            <span className='text-muted'>-</span>
            <span className='font-bold text-accent'>
              {statCounts.foul.them}
            </span>
          </div>
        </div>

        {/* Shots (Our Team Only) */}
        <div className='flex items-center justify-between p-2 bg-surface rounded border border-border'>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => handleOpenModal("SHOT")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-xs font-medium'>Shots (Us)</span>
          </div>
          <span className='text-sm font-bold text-primary'>
            {statCounts.shot}
          </span>
        </div>

        {/* Saves (Our Team Only) */}
        <div className='flex items-center justify-between p-2 bg-surface rounded border border-border'>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => handleOpenModal("SAVE")}
              variant='outline'
              size='sm'
            >
              +
            </Button>
            <span className='text-xs font-medium'>Saves (Us)</span>
          </div>
          <span className='text-sm font-bold text-primary'>
            {statCounts.save}
          </span>
        </div>
      </div>

      {/* Recent Stats List */}
      <div className='border-t border-border pt-3'>
        <h3 className='text-xs font-medium text-text-label mb-2'>
          Recent Events
        </h3>
        <div className='space-y-1 max-h-[200px] overflow-y-auto'>
          {stats.length === 0 ? (
            <div className='text-xs text-muted text-center py-2'>
              No events yet
            </div>
          ) : (
            stats
              .slice()
              .reverse()
              .slice(0, 10)
              .map((stat) => {
                const player = players.find(
                  (p) => p.playerGameId === stat.player_game_id
                );
                const isOurTeam = stat.for_team === game?.team_season_id;

                return (
                  <div
                    key={stat.id}
                    className='flex items-center justify-between p-1.5 bg-surface rounded border border-border text-xs'
                  >
                    <div className='flex-1 min-w-0'>
                      <span className='font-medium capitalize'>
                        {stat.event_type}
                      </span>
                      {player && (
                        <span className='text-muted ml-1'>
                          - #{player.jerseyNumber} {player.fullName}
                        </span>
                      )}
                      {!player && stat.for_team && (
                        <span
                          className={`ml-1 ${
                            isOurTeam ? "text-primary" : "text-accent"
                          }`}
                        >
                          ({isOurTeam ? "Us" : "Them"})
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDeleteStat(stat.id)}
                      variant='danger'
                      size='sm'
                    >
                      ×
                    </Button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Modal */}
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

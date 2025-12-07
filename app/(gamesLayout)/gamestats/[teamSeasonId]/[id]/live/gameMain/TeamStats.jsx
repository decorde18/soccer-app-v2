"use client";
import { useState, useEffect, useMemo } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

function TeamStats() {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  // Use store state
  const gameEvents = useGameEventsStore((s) => s.gameEvents);
  const teamStats = useGameEventsStore((s) => s.teamStats);
  const isLoading = useGameEventsStore((s) => s.isLoadingEvents);

  // Use store methods
  const fetchGameEvents = useGameEventsStore((s) => s.fetchGameEvents);
  const deleteEvent = useGameEventsStore((s) => s.deleteEvent);
  const recordEvent = useGameEventsStore((s) => s.recordEvent);
  const recordOpponentEvent = useGameEventsStore((s) => s.recordOpponentEvent);
  const recordTeamEvent = useGameEventsStore((s) => s.recordTeamEvent);
  const recordPenaltyKick = useGameEventsStore((s) => s.recordPenaltyKick);
  const refreshPlayerStats = useGameEventsStore((s) => s.refreshPlayerStats);

  // Modal states
  const [showTeamSelectModal, setShowTeamSelectModal] = useState(false);
  const [showMajorEventModal, setShowMajorEventModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [selectedMajorEventType, setSelectedMajorEventType] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // 'us' or 'them'

  // Event form states
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedAssist, setSelectedAssist] = useState("");
  const [opponentJerseyNumber, setOpponentJerseyNumber] = useState("");
  const [description, setDescription] = useState("");
  const [cardReason, setCardReason] = useState("");
  const [goalTypes, setGoalTypes] = useState([]);
  const [penaltyResult, setPenaltyResult] = useState("");
  const [stopClock, setStopClock] = useState(false);

  // Optimistic update state - temporarily increment while waiting for server
  const [optimisticUpdates, setOptimisticUpdates] = useState({
    corner: { us: 0, them: 0 },
    offside: { us: 0, them: 0 },
    foul: { us: 0, them: 0 },
    shot: 0,
    save: 0,
  });

  useEffect(() => {
    if (game?.game_id) {
      fetchGameEvents(game.game_id);
    }
  }, [game?.game_id]);

  const availablePlayers = useMemo(() => {
    return players
      .filter(
        (p) =>
          p.fieldStatus === "onField" ||
          p.fieldStatus === "onFieldGk" ||
          p.fieldStatus === "subbingOut"
      )
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  }, [players]);

  const goalTypeOptions = [
    { value: "header", label: "Header" },
    { value: "free_kick", label: "Free Kick" },
    { value: "penalty", label: "Penalty" },
    { value: "own_goal", label: "Own Goal" },
  ];

  // Merge store stats with optimistic updates for display
  const displayStats = {
    corner: {
      us: teamStats.corner.us + optimisticUpdates.corner.us,
      them: teamStats.corner.them + optimisticUpdates.corner.them,
    },
    offside: {
      us: teamStats.offside.us + optimisticUpdates.offside.us,
      them: teamStats.offside.them + optimisticUpdates.offside.them,
    },
    foul: {
      us: teamStats.foul.us + optimisticUpdates.foul.us,
      them: teamStats.foul.them + optimisticUpdates.foul.them,
    },
    shot: teamStats.shot + optimisticUpdates.shot,
    save: teamStats.save + optimisticUpdates.save,
  };

  // Optimistic update helpers
  const addOptimisticUpdate = (statType, team, increment = 1) => {
    setOptimisticUpdates((prev) => ({
      ...prev,
      [statType]: team
        ? { ...prev[statType], [team]: prev[statType][team] + increment }
        : prev[statType] + increment,
    }));
  };

  const clearOptimisticUpdate = (statType, team, decrement = 1) => {
    setOptimisticUpdates((prev) => ({
      ...prev,
      [statType]: team
        ? {
            ...prev[statType],
            [team]: Math.max(0, prev[statType][team] - decrement),
          }
        : Math.max(0, prev[statType] - decrement),
    }));
  };

  const clearAllOptimisticUpdates = () => {
    setOptimisticUpdates({
      corner: { us: 0, them: 0 },
      offside: { us: 0, them: 0 },
      foul: { us: 0, them: 0 },
      shot: 0,
      save: 0,
    });
  };

  // Quick stat handlers with optimistic updates
  const handleQuickStat = async (statType, forYourTeam) => {
    const team = forYourTeam ? "us" : "them";

    // Optimistic update
    addOptimisticUpdate(statType, team);

    try {
      await recordTeamEvent({
        type: statType === "foul" ? "foul_committed" : statType,
        forYourTeam,
      });

      // Store automatically refreshes, clear optimistic update
      clearOptimisticUpdate(statType, team);
    } catch (error) {
      console.error("Error recording stat:", error);
      // Rollback optimistic update on error
      clearOptimisticUpdate(statType, team);
      alert("Failed to record stat. Please try again.");
    }
  };

  const handleSaveClick = async () => {
    const currentGK = players.find((p) => p.gameStatus === "goalkeeper");
    if (!currentGK) {
      alert("No goalkeeper found on field");
      return;
    }

    // Optimistic update
    addOptimisticUpdate("save");

    try {
      await recordEvent({
        playerGameId: currentGK.playerGameId,
        category: "save",
        type: "save",
      });

      clearOptimisticUpdate("save");
    } catch (error) {
      console.error("Error recording save:", error);
      clearOptimisticUpdate("save");
      alert("Failed to record save. Please try again.");
    }
  };

  const handleShotClick = () => {
    setShowShotModal(true);
  };

  const handleShotPlayerSelect = async (playerGameId) => {
    // Optimistic update
    addOptimisticUpdate("shot");

    setShowShotModal(false);

    try {
      await recordEvent({
        playerGameId: parseInt(playerGameId),
        category: "shot",
        type: "shot_on_target",
      });

      clearOptimisticUpdate("shot");
    } catch (error) {
      console.error("Error recording shot:", error);
      clearOptimisticUpdate("shot");
      alert("Failed to record shot. Please try again.");
    }
  };

  // Major event flow
  const handleMajorEventClick = () => {
    setShowMajorEventModal(true);
  };

  const handleSelectMajorEvent = (eventType) => {
    setSelectedMajorEventType(eventType);
    setShowMajorEventModal(false);
    setShowTeamSelectModal(true);
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setShowTeamSelectModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPlayer("");
    setSelectedAssist("");
    setOpponentJerseyNumber("");
    setDescription("");
    setCardReason("");
    setGoalTypes([]);
    setPenaltyResult("");
    setStopClock(false);
  };

  const handleCloseEventModal = () => {
    setSelectedMajorEventType(null);
    setSelectedTeam(null);
    resetForm();
  };

  const toggleGoalType = (type) => {
    setGoalTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmitEvent = async () => {
    try {
      if (selectedMajorEventType === "goal") {
        if (selectedTeam === "us") {
          if (!selectedPlayer) {
            alert("Please select a player");
            return;
          }

          await recordEvent({
            playerGameId: parseInt(selectedPlayer),
            category: "goal",
            type: "goal",
            assistPlayerGameId: selectedAssist
              ? parseInt(selectedAssist)
              : null,
            goalTypes: goalTypes.length > 0 ? goalTypes : null,
            details: description || null,
          });
        } else {
          // Opponent goal
          await recordOpponentEvent({
            category: "goal",
            type: "goal",
            opponentJerseyNumber: opponentJerseyNumber || null,
            details: description || null,
          });
        }
      } else if (selectedMajorEventType === "card") {
        if (selectedTeam === "us") {
          if (!selectedPlayer) {
            alert("Please select a player");
            return;
          }

          const cardType = cardReason.toLowerCase().includes("red")
            ? "red_card"
            : "yellow_card";

          await recordEvent({
            playerGameId: parseInt(selectedPlayer),
            category: "card",
            type: cardType,
            cardReason: cardReason || null,
            details: description || null,
          });
        } else {
          alert("Opponent cards are not tracked in detail");
          return;
        }
      } else if (selectedMajorEventType === "penalty") {
        if (!penaltyResult) {
          alert("Please select penalty result");
          return;
        }

        if (selectedTeam === "us") {
          if (!selectedPlayer) {
            alert("Please select a player");
            return;
          }

          await recordPenaltyKick({
            playerGameId: parseInt(selectedPlayer),
            result: penaltyResult,
            details: description || null,
          });
        } else {
          // Opponent penalty
          if (penaltyResult === "goal") {
            await recordOpponentEvent({
              category: "penalty",
              type: "goal",
              opponentJerseyNumber: opponentJerseyNumber || null,
              details: description || null,
            });
          } else if (penaltyResult === "save") {
            const currentGK = players.find(
              (p) => p.gameStatus === "goalkeeper"
            );
            if (currentGK) {
              await recordEvent({
                playerGameId: currentGK.playerGameId,
                category: "penalty",
                type: "save",
                details: description || null,
              });
            }
          }
        }
      } else if (selectedMajorEventType === "injury") {
        if (selectedTeam === "us" && !selectedPlayer) {
          alert("Please select a player");
          return;
        }

        if (selectedTeam === "us") {
          await recordEvent({
            playerGameId: parseInt(selectedPlayer),
            category: "injury",
            type: "injury",
            details: description || null,
            clockShouldRun: stopClock ? 0 : 1,
          });
        }
      } else if (selectedMajorEventType === "stoppage") {
        // Handle via gameStore stoppage methods instead
        alert("Use the game control modal to manage stoppages");
        return;
      }

      // Clear all optimistic updates after successful submit
      clearAllOptimisticUpdates();

      handleCloseEventModal();
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Failed to record event. Please try again.");
    }
  };

  const handleDeleteStat = async (statId) => {
    if (!confirm("Delete this stat?")) return;

    try {
      await deleteEvent(statId);
      // Store automatically refreshes
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
          onClick={handleMajorEventClick}
          variant='primary'
          className='w-full'
          size='md'
        >
          Major Event
        </Button>
      </div>

      {/* Stat Counters */}
      <div className='space-y-2 mb-3'>
        {/* Corners */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Corners</span>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => handleQuickStat("corner", true)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {displayStats.corner.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {displayStats.corner.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("corner", false)}
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
              onClick={() => handleQuickStat("offside", true)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {displayStats.offside.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {displayStats.offside.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("offside", false)}
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
              onClick={() => handleQuickStat("foul", true)}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {displayStats.foul.us}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {displayStats.foul.them}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("foul", false)}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors'
            >
              +
            </button>
          </div>
        </div>

        {/* Shots */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Shots</span>
          <div className='flex items-center gap-3'>
            <Button onClick={handleShotClick} variant='outline' size='sm'>
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {displayStats.shot}
            </span>
          </div>
        </div>

        {/* Saves */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Saves</span>
          <div className='flex items-center gap-3'>
            <Button onClick={handleSaveClick} variant='outline' size='sm'>
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {displayStats.save}
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
          {gameEvents.length === 0 ? (
            <div className='text-xs text-muted text-center py-4 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            gameEvents
              .slice()
              .reverse()
              .map((stat) => {
                const player = players.find(
                  (p) => p.playerGameId === stat.player_game_id
                );
                const yourTeamSeasonId = game.isHome
                  ? game.home_team_season_id
                  : game.away_team_season_id;
                const isOurTeam = stat.team_season_id === yourTeamSeasonId;

                return (
                  <div
                    key={stat.id}
                    className='flex items-center gap-2 p-2 bg-surface rounded-lg border border-border'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-text capitalize'>
                          {stat.event_type.replace("_", " ")}
                        </span>
                        {!player && (
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
                        {stat.opponent_jersey_number && (
                          <span className='text-xs text-muted'>
                            #{stat.opponent_jersey_number}
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

      {/* Modals remain the same... */}
      {/* Major Event Selection Modal */}
      <Modal
        isOpen={showMajorEventModal}
        onClose={() => setShowMajorEventModal(false)}
        title='Select Major Event'
      >
        <div className='space-y-2'>
          <Button
            onClick={() => handleSelectMajorEvent("goal")}
            variant='success'
            className='w-full'
          >
            Goal
          </Button>
          <Button
            onClick={() => handleSelectMajorEvent("card")}
            variant='danger'
            className='w-full'
          >
            Card
          </Button>
          <Button
            onClick={() => handleSelectMajorEvent("penalty")}
            variant='outline'
            className='w-full'
          >
            Penalty Kick
          </Button>
          <Button
            onClick={() => handleSelectMajorEvent("injury")}
            variant='outline'
            className='w-full'
          >
            Injury
          </Button>
          <Button
            onClick={() => setShowMajorEventModal(false)}
            variant='outline'
            className='w-full mt-4'
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Team Selection Modal */}
      <Modal
        isOpen={showTeamSelectModal}
        onClose={() => setShowTeamSelectModal(false)}
        title={`Who scored/received the ${selectedMajorEventType}?`}
      >
        <div className='space-y-2'>
          <Button
            onClick={() => handleTeamSelect("us")}
            variant='primary'
            className='w-full'
          >
            Our Team
          </Button>
          <Button
            onClick={() => handleTeamSelect("them")}
            variant='accent'
            className='w-full'
          >
            Opponent
          </Button>
          <Button
            onClick={() => setShowTeamSelectModal(false)}
            variant='outline'
            className='w-full mt-4'
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        isOpen={selectedMajorEventType && selectedTeam}
        onClose={handleCloseEventModal}
        title={`${
          selectedTeam === "us" ? "OUR" : "OPPONENT"
        } ${selectedMajorEventType?.toUpperCase()}`}
        size='lg'
      >
        <div className='space-y-4'>
          {/* Team Toggle */}
          <div className='flex items-center justify-center gap-2 p-2 bg-surface rounded-lg'>
            <button
              onClick={() => setSelectedTeam("us")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                selectedTeam === "us"
                  ? "bg-primary text-white"
                  : "bg-white text-text hover:bg-gray-100"
              }`}
            >
              Our Team
            </button>
            <button
              onClick={() => setSelectedTeam("them")}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                selectedTeam === "them"
                  ? "bg-accent text-white"
                  : "bg-white text-text hover:bg-gray-100"
              }`}
            >
              Opponent
            </button>
          </div>

          {/* Player Selection (Our Team) */}
          {selectedTeam === "us" && selectedMajorEventType !== "stoppage" && (
            <Select
              label='Player'
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              options={[
                { value: "", label: "Select player..." },
                ...availablePlayers,
              ]}
            />
          )}

          {/* Opponent Jersey Number */}
          {selectedTeam === "them" && (
            <Input
              label='Opponent Jersey # (Optional)'
              type='number'
              value={opponentJerseyNumber}
              onChange={(e) => setOpponentJerseyNumber(e.target.value)}
              placeholder='e.g., 10'
            />
          )}

          {/* Goal-specific fields */}
          {selectedMajorEventType === "goal" && selectedTeam === "us" && (
            <>
              <Select
                label='Assist (Optional)'
                value={selectedAssist}
                onChange={(e) => setSelectedAssist(e.target.value)}
                options={[
                  { value: "", label: "No assist" },
                  ...availablePlayers.filter((p) => p.value !== selectedPlayer),
                ]}
              />

              <div>
                <label className='block text-sm font-medium mb-2'>
                  Goal Types (Optional)
                </label>
                <div className='space-y-2'>
                  {goalTypeOptions.map((type) => (
                    <label
                      key={type.value}
                      className='flex items-center gap-2 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={goalTypes.includes(type.value)}
                        onChange={() => toggleGoalType(type.value)}
                        className='w-4 h-4'
                      />
                      <span className='text-sm'>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Card reason */}
          {selectedMajorEventType === "card" && selectedTeam === "us" && (
            <Select
              label='Card Type'
              value={cardReason}
              onChange={(e) => setCardReason(e.target.value)}
              options={[
                { value: "", label: "Select card type..." },
                { value: "Yellow Card - Foul", label: "Yellow Card - Foul" },
                {
                  value: "Yellow Card - Dissent",
                  label: "Yellow Card - Dissent",
                },
                {
                  value: "Yellow Card - Time Wasting",
                  label: "Yellow Card - Time Wasting",
                },
                {
                  value: "Red Card - Serious Foul",
                  label: "Red Card - Serious Foul",
                },
                {
                  value: "Red Card - Violent Conduct",
                  label: "Red Card - Violent Conduct",
                },
                {
                  value: "Red Card - 2nd Yellow",
                  label: "Red Card - 2nd Yellow",
                },
              ]}
            />
          )}

          {/* Penalty result */}
          {selectedMajorEventType === "penalty" && (
            <Select
              label='Penalty Result'
              value={penaltyResult}
              onChange={(e) => setPenaltyResult(e.target.value)}
              options={[
                { value: "", label: "Select result..." },
                { value: "goal", label: "Goal" },
                { value: "save", label: "Save" },
                { value: "miss", label: "Miss" },
              ]}
            />
          )}

          {/* Description */}
          <Input
            label='Description (Optional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Additional details...'
          />

          {/* Clock Control */}
          <div className='flex items-center gap-3 p-3 bg-surface rounded-lg'>
            <label className='flex items-center gap-2 cursor-pointer flex-1'>
              <input
                type='checkbox'
                checked={stopClock}
                onChange={(e) => setStopClock(e.target.checked)}
                className='w-4 h-4'
              />
              <span className='text-sm font-medium'>
                Stop clock for this event
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className='flex gap-2 pt-4'>
            <Button
              onClick={handleSubmitEvent}
              variant='success'
              className='flex-1'
            >
              Confirm
            </Button>
            <Button
              onClick={handleCloseEventModal}
              variant='outline'
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Shot Player Selection Modal */}
      <Modal
        isOpen={showShotModal}
        onClose={() => setShowShotModal(false)}
        title='Select Player (Shot on Target)'
      >
        <div className='space-y-2 max-h-[400px] overflow-y-auto'>
          {availablePlayers.map((player) => (
            <button
              key={player.value}
              onClick={() => handleShotPlayerSelect(player.value)}
              className='w-full text-left px-4 py-3 rounded-lg bg-surface hover:bg-primary hover:text-white transition-colors border border-border'
            >
              {player.label}
            </button>
          ))}
          <Button
            onClick={() => setShowShotModal(false)}
            variant='outline'
            className='w-full mt-4'
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default TeamStats;

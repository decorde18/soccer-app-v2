"use client";
import { useMemo, useState } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

function TeamStats() {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((state) => state.players);

  // Get team stats directly from game store
  const teamStats = game?.teamStatTotals || {
    corner: { us: 0, them: 0 },
    offside: { us: 0, them: 0 },
    foul: { us: 0, them: 0 },
    shots: 0,
    saves: 0,
  };

  const isRecording = useGameEventsStore((s) => s.isRecording);

  // Use store methods
  const deleteEvent = useGameEventsStore((s) => s.deleteEvent);
  const recordPlayerAction = useGameEventsStore((s) => s.recordPlayerAction);
  const recordTeamEvent = useGameEventsStore((s) => s.recordTeamEvent);
  const recordGoal = useGameEventsStore((s) => s.recordGoal);
  const recordCard = useGameEventsStore((s) => s.recordCard);
  const recordPenaltyKick = useGameEventsStore((s) => s.recordPenaltyKick);

  // Modal states
  const [showTeamSelectModal, setShowTeamSelectModal] = useState(false);
  const [showMajorEventModal, setShowMajorEventModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showEditMajorEventModal, setShowEditMajorEventModal] = useState(false);
  const [selectedMajorEventType, setSelectedMajorEventType] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Event form states
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedAssist, setSelectedAssist] = useState("");
  const [opponentJerseyNumber, setOpponentJerseyNumber] = useState("");
  const [description, setDescription] = useState("");
  const [cardReason, setCardReason] = useState("");
  const [goalTypes, setGoalTypes] = useState([]);
  const [penaltyResult, setPenaltyResult] = useState("");
  const [stopClock, setStopClock] = useState(false);

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

  const majorEventTypes = [
    { value: "goal", label: "Goal", variant: "success" },
    { value: "card", label: "Card", variant: "danger" },
    { value: "penalty", label: "Penalty Kick", variant: "outline" },
    { value: "injury", label: "Injury", variant: "warning" },
    { value: "weather", label: "Weather Delay", variant: "outline" },
    { value: "other", label: "Other Stoppage", variant: "outline" },
  ];

  // Get all recent events unified and sorted
  const recentEvents = useMemo(() => {
    if (!game) return [];

    const events = [];
    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    // Major events (goals, cards, penalties, injuries, etc)
    game.gameEventsMajor?.forEach((e) => {
      let label = e.event_type.replace(/_/g, " ");
      let details = null;
      let playerInfo = null;

      // Find associated goal
      const goal = game.gameEventsGoals?.find((g) => g.major_event_id === e.id);
      if (goal) {
        const scorer = players.find(
          (p) => p.playerGameId === goal.scorer_player_game_id
        );
        if (scorer) {
          playerInfo = `#${scorer.jerseyNumber} ${scorer.fullName}`;
        } else if (goal.opponent_jersey_number) {
          playerInfo = `#${goal.opponent_jersey_number}`;
        }
        details = goal.team_season_id === teamSeasonId ? "Us" : "Them";
      }

      // Find associated card
      const card = game.gameEventsDiscipline?.find(
        (d) => d.major_event_id === e.id
      );
      if (card) {
        label = `${card.card_type} card`;
        const cardPlayer = players.find(
          (p) => p.playerGameId === card.player_game_id
        );
        if (cardPlayer) {
          playerInfo = `#${cardPlayer.jerseyNumber} ${cardPlayer.fullName}`;
        }
      }

      // Find associated penalty
      const penalty = game.gameEventsPenalties?.find(
        (p) => p.major_event_id === e.id
      );
      if (penalty) {
        const shooter = players.find(
          (p) => p.playerGameId === penalty.shooter_player_game_id
        );
        if (shooter) {
          playerInfo = `#${shooter.jerseyNumber} ${shooter.fullName}`;
        }
        details = penalty.outcome;
      }

      events.push({
        id: e.id,
        type: "major",
        eventType: e.event_type,
        label,
        gameTime: e.game_time,
        period: e.period,
        clockStopped: e.clock_should_run === 0,
        playerInfo,
        details: details || e.details,
        canEdit: true,
        rawEvent: e,
      });
    });

    // Team events
    game.gameEventsTeam?.forEach((e) => {
      const isUs = e.team_season_id === teamSeasonId;
      events.push({
        id: e.id,
        type: "team",
        eventType: e.event_type,
        label: e.event_type.replace(/_/g, " "),
        gameTime: e.game_time,
        period: e.period,
        clockStopped: false,
        details: isUs ? "Us" : "Them",
        canEdit: false,
      });
    });

    // Player actions
    game.playerActions?.forEach((e) => {
      const player = players.find((p) => p.playerGameId === e.player_game_id);
      events.push({
        id: e.id,
        type: "player_action",
        eventType: e.event_type,
        label: e.event_type.replace(/_/g, " "),
        gameTime: e.game_time,
        period: e.period,
        clockStopped: false,
        playerInfo: player
          ? `#${player.jerseyNumber} ${player.fullName}`
          : null,
        canEdit: false,
      });
    });

    // Sort by game time descending (most recent first)
    return events.sort((a, b) => b.gameTime - a.gameTime).slice(0, 10);
  }, [game, players]);

  // Quick stat handlers
  const handleQuickStat = async (statType, forYourTeam) => {
    try {
      await recordTeamEvent({
        eventType: statType,
        forYourTeam,
      });
    } catch (error) {
      console.error("Error recording stat:", error);
      alert("Failed to record stat. Please try again.");
    }
  };

  const handleSaveClick = async () => {
    const currentGK = players.find((p) => p.gameStatus === "goalkeeper");
    if (!currentGK) {
      alert("No goalkeeper found on field");
      return;
    }

    try {
      await recordPlayerAction({
        playerGameId: currentGK.playerGameId,
        eventType: "save",
      });
    } catch (error) {
      console.error("Error recording save:", error);
      alert("Failed to record save. Please try again.");
    }
  };

  const handleShotClick = () => {
    setShowShotModal(true);
  };

  const handleShotPlayerSelect = async (playerGameId) => {
    setShowShotModal(false);

    try {
      await recordPlayerAction({
        playerGameId: parseInt(playerGameId),
        eventType: "shot_on_target",
      });
    } catch (error) {
      console.error("Error recording shot:", error);
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

    // Events that need team selection
    if (["goal", "card", "penalty"].includes(eventType)) {
      setShowTeamSelectModal(true);
    } else {
      // Events that don't need team selection (injury, weather, other)
      setSelectedTeam("neutral");
      resetForm();
    }
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
    setEditingEvent(null);
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

          await recordGoal({
            scorerPlayerGameId: parseInt(selectedPlayer),
            assistPlayerGameId: selectedAssist
              ? parseInt(selectedAssist)
              : null,
            goalTypes: goalTypes.length > 0 ? goalTypes : null,
            details: description || null,
          });
        } else {
          // Opponent goal
          await recordGoal({
            teamSeasonId: game.isHome
              ? game.away_team_season_id
              : game.home_team_season_id,
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
            ? "red"
            : "yellow";

          await recordCard({
            playerGameId: parseInt(selectedPlayer),
            cardType,
            cardReason: cardReason || null,
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
            shooterPlayerGameId: parseInt(selectedPlayer),
            outcome: penaltyResult,
            details: description || null,
          });
        } else {
          // Opponent penalty
          if (penaltyResult === "goal") {
            await recordGoal({
              teamSeasonId: game.isHome
                ? game.away_team_season_id
                : game.home_team_season_id,
              opponentJerseyNumber: opponentJerseyNumber || null,
              goalTypes: ["penalty"],
              details: description || null,
            });
          } else if (penaltyResult === "saved") {
            const currentGK = players.find(
              (p) => p.gameStatus === "goalkeeper"
            );
            if (currentGK) {
              await recordPlayerAction({
                playerGameId: currentGK.playerGameId,
                eventType: "save",
              });
            }
          }
        }
      } else if (
        ["injury", "weather", "other"].includes(selectedMajorEventType)
      ) {
        // Create a simple major event with optional clock stop
        const gameStore = useGameStore.getState();
        const gameTime = gameStore.getGameTime();
        const period = gameStore.getCurrentPeriodNumber();

        await gameStore.startStoppage(
          description || "",
          selectedMajorEventType
        );
      }

      handleCloseEventModal();
    } catch (error) {
      console.error("Error submitting event:", error);
      alert("Failed to record event. Please try again.");
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(`Delete this ${event.label}?`)) return;

    try {
      // Cascade delete for major events
      if (event.type === "major") {
        await deleteEvent(event.id, "major", true); // true = cascade
      } else {
        await deleteEvent(event.id, event.type);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleEditEvent = (event) => {
    if (!event.canEdit) return;

    setEditingEvent(event);
    setShowEditMajorEventModal(true);
  };

  if (!game) {
    return <div className='text-center text-muted py-4'>No active game</div>;
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
          disabled={isRecording}
        >
          {isRecording ? "Recording..." : "Major Event"}
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
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.corner?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.corner?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("corner", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
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
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.offside?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.offside?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("offside", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
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
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
            <div className='flex items-center gap-2 min-w-[50px] justify-center'>
              <span className='text-sm font-bold text-primary'>
                {teamStats.foul?.us || 0}
              </span>
              <span className='text-xs text-muted'>-</span>
              <span className='text-sm font-bold text-accent'>
                {teamStats.foul?.them || 0}
              </span>
            </div>
            <button
              onClick={() => handleQuickStat("foul", false)}
              disabled={isRecording}
              className='w-7 h-7 flex items-center justify-center rounded bg-accent text-white hover:bg-error-hover transition-colors disabled:opacity-50'
            >
              +
            </button>
          </div>
        </div>

        {/* Shots */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Shots</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleShotClick}
              variant='outline'
              size='sm'
              disabled={isRecording}
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {teamStats.shots || 0}
            </span>
          </div>
        </div>

        {/* Saves */}
        <div className='flex items-center justify-between py-2 px-3 bg-surface rounded-lg border border-border'>
          <span className='text-xs font-medium text-text'>Saves</span>
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleSaveClick}
              variant='outline'
              size='sm'
              disabled={isRecording}
            >
              +
            </Button>
            <span className='text-sm font-bold text-primary min-w-[30px] text-center'>
              {teamStats.saves || 0}
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
          {recentEvents.length === 0 ? (
            <div className='text-xs text-muted text-center py-4 bg-surface rounded border border-border'>
              No events yet
            </div>
          ) : (
            recentEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className='flex items-center gap-2 p-2 bg-surface rounded-lg border border-border'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-xs font-semibold text-text capitalize'>
                      {event.label}
                    </span>
                    {event.clockStopped && (
                      <span className='px-1.5 py-0.5 text-xs font-medium rounded bg-red-500 text-white'>
                        ⏸
                      </span>
                    )}
                    {event.details && (
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          event.details === "Us"
                            ? "bg-primary text-white"
                            : event.details === "Them"
                            ? "bg-accent text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {event.details}
                      </span>
                    )}
                    <span className='text-xs text-muted'>
                      {formatSecondsToMmss(event.gameTime)}
                    </span>
                  </div>
                  {event.playerInfo && (
                    <div className='text-xs text-muted truncate mt-0.5'>
                      {event.playerInfo}
                    </div>
                  )}
                </div>
                <div className='flex gap-1 flex-shrink-0'>
                  {event.canEdit && (
                    <button
                      onClick={() => handleEditEvent(event)}
                      disabled={isRecording}
                      className='w-6 h-6 flex items-center justify-center rounded bg-primary text-white hover:bg-accent-hover transition-colors text-xs font-bold disabled:opacity-50'
                    >
                      ✎
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(event)}
                    disabled={isRecording}
                    className='w-6 h-6 flex items-center justify-center rounded bg-danger text-white hover:bg-error-hover transition-colors text-sm font-bold disabled:opacity-50'
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Major Event Selection Modal */}
      <Modal
        isOpen={showMajorEventModal}
        onClose={() => setShowMajorEventModal(false)}
        title='Select Major Event'
      >
        <div className='space-y-2'>
          {majorEventTypes.map((eventType) => (
            <Button
              key={eventType.value}
              onClick={() => handleSelectMajorEvent(eventType.value)}
              variant={eventType.variant}
              className='w-full'
            >
              {eventType.label}
            </Button>
          ))}
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
          selectedTeam === "us"
            ? "OUR"
            : selectedTeam === "them"
            ? "OPPONENT"
            : ""
        } ${selectedMajorEventType?.toUpperCase()}`}
        size='lg'
      >
        <div className='space-y-4'>
          {/* Team Toggle - only for goal/card/penalty */}
          {["goal", "card", "penalty"].includes(selectedMajorEventType) && (
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
          )}

          {/* Player Selection (Our Team) */}
          {selectedTeam === "us" &&
            ["goal", "card", "penalty"].includes(selectedMajorEventType) && (
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

      {/* Edit Major Event Modal */}
      <Modal
        isOpen={showEditMajorEventModal}
        onClose={() => {
          setShowEditMajorEventModal(false);
          setEditingEvent(null);
        }}
        title={`Edit ${editingEvent?.label || "Event"}`}
        size='lg'
      >
        {editingEvent && (
          <div className='space-y-4'>
            <div className='bg-surface p-3 rounded-lg'>
              <div className='text-sm text-muted mb-1'>Current Details</div>
              <div className='text-sm font-medium'>
                Time: {formatSecondsToMmss(editingEvent.gameTime)} | Period:{" "}
                {editingEvent.period}
              </div>
              {editingEvent.playerInfo && (
                <div className='text-sm'>{editingEvent.playerInfo}</div>
              )}
              {editingEvent.details && (
                <div className='text-sm'>{editingEvent.details}</div>
              )}
            </div>

            <div className='text-sm text-muted'>
              Note: Full editing of major events coming soon. For now, you can
              delete and re-create the event if needed.
            </div>

            <Button
              onClick={() => {
                setShowEditMajorEventModal(false);
                setEditingEvent(null);
              }}
              variant='outline'
              className='w-full'
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TeamStats;

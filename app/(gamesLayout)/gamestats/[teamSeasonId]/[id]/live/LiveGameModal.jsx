"use client";
import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { secondsToTime, formatSecondsToMmss } from "@/lib/dateTimeUtils";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import PendingSubs from "./gameMain/PendingSubs";

function GameControlModal({ onClose }) {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const getGameTime = useGameStore((s) => s.getGameTime);
  const getPeriodTime = useGameStore((s) => s.getPeriodTime);
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel);
  const startStoppage = useGameStore((s) => s.startStoppage);
  const endStoppage = useGameStore((s) => s.endStoppage);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const endPeriod = useGameStore((s) => s.endPeriod);

  const players = useGamePlayersStore((s) => s.players);

  // Sub management from gameSubsStore
  const getPendingSubs = useGameSubsStore((s) => s.getPendingSubs);
  const confirmSub = useGameSubsStore((s) => s.confirmSub);
  const confirmAllPendingSubs = useGameSubsStore(
    (s) => s.confirmAllPendingSubs
  );

  // Event recording from gameEventsStore
  const recordEvent = useGameEventsStore((s) => s.recordEvent);

  const isOpen = game?.gameStage === "in_stoppage";

  const [, setTick] = useState(0);
  const [eventType, setEventType] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedAssist, setSelectedAssist] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [cardReason, setCardReason] = useState("");
  const [stoppageReason, setStoppageReason] = useState("");
  const [pendingSubs, setPendingSubs] = useState([]);

  // Fetch pending subs
  useEffect(() => {
    const fetchSubs = async () => {
      if (!game?.game_id) return;
      const subs = await getPendingSubs();
      setPendingSubs(subs || []);
    };
    fetchSubs();
  }, [game?.game_id, getPendingSubs, players]); // Refetch when players change

  // Update every second for live clock
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const gameTime = getGameTime();
  const periodTime = getPeriodTime();
  const periodLabel = getCurrentPeriodLabel();
  const activeStoppage = game?.stoppages?.find((s) => s.endTime === null);
  const isInStoppage = gameStage === "in_stoppage";

  // Get on-field players for event recording
  const onFieldPlayers = useMemo(
    () =>
      players
        .filter(
          (p) => p.fieldStatus === "onField" || p.fieldStatus === "onFieldGk"
        )
        .map((p) => ({
          value: p.playerGameId,
          label: `#${p.jerseyNumber} ${p.fullName}`,
        })),
    [players]
  );

  const eventTypes = [
    { value: "goal", label: "Goal" },

    { value: "yellow_card", label: "Yellow Card" },
    { value: "red_card", label: "Red Card" },
  ];

  const handleStartStoppage = async () => {
    await startStoppage(stoppageReason);
    setStoppageReason("");
  };

  const handleEndStoppage = async () => {
    if (activeStoppage) {
      await endStoppage(activeStoppage.id);
    }
  };

  const handleConfirmAllSubs = async () => {
    const result = await confirmAllPendingSubs();

    // Refresh pending subs after confirmation
    if (game?.game_id) {
      const subs = await getPendingSubs();
      setPendingSubs(subs || []);
    }

    return result;
  };

  const handleRecordEvent = async () => {
    if (!eventType || !selectedPlayer) return;

    const eventData = {
      playerGameId: parseInt(selectedPlayer),
      category: "major",
      type: eventType,
      isStoppage: 0,
      clockShouldRun: 1,
      details: eventDetails || null,
    };

    // Add assist for goals
    if (eventType === "goal" && selectedAssist) {
      eventData.assistPlayerGameId = parseInt(selectedAssist);
    }

    // Add card reason for cards
    if (
      (eventType === "yellow_card" || eventType === "red_card") &&
      cardReason
    ) {
      eventData.cardReason = cardReason;
    }

    await recordEvent(eventData);

    // Reset form
    setEventType("");
    setSelectedPlayer("");
    setSelectedAssist("");
    setEventDetails("");
    setCardReason("");
  };

  const handleResumeGame = async () => {
    if (pendingSubs.length > 0) {
      // Show confirmation to enter subs
      const confirmEnterSubs = window.confirm(
        `You have ${pendingSubs.length} pending sub(s). Confirm all substitutions now?`
      );
      if (confirmEnterSubs) {
        await handleConfirmAllSubs();
      }
    }
    if (activeStoppage) {
      await handleEndStoppage();
    }
    onClose();
  };

  if (!game) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Game Control'
      size='xl'
      closeOnOverlayClick={false}
    >
      <div className='space-y-6'>
        {/* Clock Display */}
        <div className='bg-background p-6 rounded-lg border border-border'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center'>
              <div className='text-sm text-muted mb-1'>Game Time</div>
              <div className='text-4xl font-bold text-text font-mono'>
                {secondsToTime(gameTime, {
                  includeSeconds: true,
                  use12Hour: false,
                })}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-muted mb-1'>{periodLabel} Time</div>
              <div className='text-4xl font-bold text-text font-mono'>
                {formatSecondsToMmss(periodTime)}
              </div>
            </div>
          </div>

          {/* Clock Status */}
          <div className='mt-4 flex items-center justify-center gap-3'>
            <div
              className={`w-3 h-3 rounded-full ${
                isInStoppage ? "bg-red-500" : "bg-green-500"
              }`}
            />
            <span className='text-sm font-medium text-text'>
              {isInStoppage ? "Clock Stopped" : "Clock Running"}
            </span>
          </div>

          {/* Stoppage Controls */}
          <div className='mt-4 flex gap-2'>
            {!isInStoppage ? (
              <div className='flex gap-2 w-full'>
                <Input
                  placeholder='Stoppage reason (optional)'
                  value={stoppageReason}
                  onChange={(e) => setStoppageReason(e.target.value)}
                  className='flex-1'
                />
                <Button
                  onClick={handleStartStoppage}
                  variant='danger'
                  className='whitespace-nowrap'
                >
                  Stop Clock
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleResumeGame}
                variant='success'
                className='w-full'
              >
                Resume Game
              </Button>
            )}
          </div>
        </div>

        {/* Pending Subs */}
        {pendingSubs.length > 0 && (
          <div className='bg-background p-4 rounded-lg border border-border'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold text-text'>
                Pending Substitutions ({pendingSubs.length})
              </h3>
              <Button
                onClick={handleConfirmAllSubs}
                variant='primary'
                size='sm'
              >
                Confirm All
              </Button>
            </div>
            <PendingSubs />
          </div>
        )}

        {/* Event Recording */}
        <div className='bg-background p-4 rounded-lg border border-border'>
          <h3 className='text-lg font-semibold text-text mb-4'>Record Event</h3>

          <div className='grid grid-cols-1 gap-4'>
            <Select
              label='Event Type'
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              options={[
                { value: "", label: "Select event type..." },
                ...eventTypes,
              ]}
            />

            {eventType && (
              <>
                <Select
                  label='Player'
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  options={[
                    { value: "", label: "Select player..." },
                    ...onFieldPlayers,
                  ]}
                />

                {eventType === "goal" && (
                  <Select
                    label='Assist (Optional)'
                    value={selectedAssist}
                    onChange={(e) => setSelectedAssist(e.target.value)}
                    options={[
                      { value: "", label: "No assist" },
                      ...onFieldPlayers.filter(
                        (p) => p.value !== selectedPlayer
                      ),
                    ]}
                  />
                )}

                {(eventType === "yellow_card" || eventType === "red_card") && (
                  <Input
                    label='Card Reason'
                    value={cardReason}
                    onChange={(e) => setCardReason(e.target.value)}
                    placeholder='Enter reason for card...'
                  />
                )}

                <Input
                  label='Details (Optional)'
                  value={eventDetails}
                  onChange={(e) => setEventDetails(e.target.value)}
                  placeholder='Additional details...'
                />

                <Button
                  onClick={handleRecordEvent}
                  variant='primary'
                  disabled={!selectedPlayer}
                  className='w-full'
                >
                  Record {eventType.replace("_", " ").toUpperCase()}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Period Controls */}
        <div className='bg-background p-4 rounded-lg border border-border'>
          <h3 className='text-lg font-semibold text-text mb-4'>
            Period Controls
          </h3>
          <div className='flex gap-2'>
            {gameStage === "before_start" && (
              <Button
                onClick={startNextPeriod}
                variant='success'
                className='flex-1'
              >
                Start Period 1
              </Button>
            )}

            {gameStage === "during_period" && (
              <Button onClick={endPeriod} variant='danger' className='flex-1'>
                End {periodLabel}
              </Button>
            )}

            {gameStage === "between_periods" && (
              <Button
                onClick={startNextPeriod}
                variant='success'
                className='flex-1'
              >
                Start Next Period
              </Button>
            )}

            {gameStage === "end_game" && (
              <div className='text-center text-text font-semibold py-2'>
                Game Complete
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className='bg-background p-4 rounded-lg border border-border'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted'>Home:</span>{" "}
              <span className='font-semibold text-text'>
                {game?.home_club_name} {game?.home_team_name}
              </span>
            </div>
            <div>
              <span className='text-muted'>Away:</span>{" "}
              <span className='font-semibold text-text'>
                {game?.away_club_name} {game?.away_team_name}
              </span>
            </div>
            <div>
              <span className='text-muted'>Score:</span>{" "}
              <span className='font-semibold text-text'>
                {game?.homeScore} - {game?.awayScore}
              </span>
            </div>
            <div>
              <span className='text-muted'>Stage:</span>{" "}
              <span className='font-semibold text-text'>
                {gameStage?.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default GameControlModal;

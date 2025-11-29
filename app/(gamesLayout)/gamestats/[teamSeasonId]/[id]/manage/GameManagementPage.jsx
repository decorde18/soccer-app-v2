"use client";
import { useState, useEffect } from "react";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { apiFetch } from "@/app/api/fetcher";
import { formatTimestamp, formatSecondsToMmss } from "@/lib/dateTimeUtils";

function GameManagementPage() {
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);
  const refreshPlayerStats = useGamePlayersStore((s) => s.refreshPlayerStats);

  const [periods, setPeriods] = useState(game.periods);
  const [events, setEvents] = useState([]);
  const [subs, setSubs] = useState([]);
  const [selectedTab, setSelectedTab] = useState("periods");
  const [isLoading, setIsLoading] = useState(false);
  console.log(game);
  // Load data
  useEffect(() => {
    if (!game?.id) return;
    loadData();
  }, [game?.id]);

  const loadData = async () => {
    if (!game?.id) return;
    setIsLoading(true);

    try {
      // Load events
      const eventsData = await apiFetch("game_events", "GET", null, null, {
        filters: { game_id: game.id },
      });
      setEvents(eventsData || []);

      // Load subs
      const subsData = await apiFetch("game_subs", "GET", null, null, {
        filters: { game_id: game.id },
      });
      setSubs(subsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== PERIODS ====================

  const handleDeletePeriod = async (periodId) => {
    if (!confirm("Are you sure you want to delete this period?")) return;

    try {
      await apiFetch(`game_periods?id=${periodId}`, "DELETE");
      await loadData();
    } catch (error) {
      console.error("Error deleting period:", error);
      alert("Failed to delete period");
    }
  };

  const handleEditPeriod = async (period) => {
    const startTime = prompt(
      "Enter start time (YYYY-MM-DD HH:MM:SS):",
      period.start_time
    );
    if (!startTime) return;

    const endTime = prompt(
      "Enter end time (YYYY-MM-DD HH:MM:SS) or leave blank:",
      period.end_time || ""
    );

    try {
      await apiFetch(`game_periods?id=${period.id}`, "PUT", {
        start_time: startTime,
        end_time: endTime || null,
      });
      await loadData();
    } catch (error) {
      console.error("Error updating period:", error);
      alert("Failed to update period");
    }
  };

  const periodColumns = [
    { name: "periodNumber", label: "Period #" },
    { name: "startTime", label: "Start Time" },
    { name: "endTime", label: "End Time" },
    { name: "addedTime", label: "Added Time (s)" },
  ];

  const periodData = periods.map((p) => ({
    id: p.id,
    periodNumber: p.periodNumber,
    startTime: formatTimestamp(p.startTime, "timeShort"),
    endTime: formatTimestamp(p.end_time, "timeShort")
      ? formatTimestamp(p.end_time, "timeShort")
      : "—",
    addedTime: formatSecondsToMmss(p.addedTime) || 0,
  }));

  // ==================== EVENTS ====================

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await apiFetch(`game_events?id=${eventId}`, "DELETE");
      await loadData();
      await refreshPlayerStats(game.id);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };
  const handleEditEvent = async (event) => {
    const gameTime = prompt("Enter game time (seconds):", event.game_time);
    if (!gameTime) return;

    const period = prompt("Enter period number:", event.period);
    if (!period) return;

    try {
      await apiFetch(`game_events?id=${event.id}`, "PUT", {
        game_time: parseInt(gameTime),
        period: parseInt(period),
      });
      await loadData();
      await refreshPlayerStats(game.id);
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    }
  };
  const eventColumns = [
    { key: "player_name", label: "Player" },
    { key: "event_type", label: "Event Type" },
    { key: "game_time", label: "Game Time" },
    { key: "period", label: "Period" },
    { key: "details", label: "Details" },
  ];
  const eventData = events.map((e) => {
    const player = players.find((p) => p.playerGameId === e.player_game_id);
    return {
      id: e.id,
      player_name: player ? player.fullName : "Unknown",
      event_type: e.event_type,
      game_time: `${Math.floor(e.game_time / 60)}:${String(
        e.game_time % 60
      ).padStart(2, "0")}`,
      period: e.period,
      details: e.details || "—",
    };
  });

  // ==================== SUBS ====================

  const handleDeleteSub = async (subId) => {
    if (!confirm("Are you sure you want to delete this substitution?")) return;

    try {
      await apiFetch(`game_subs?id=${subId}`, "DELETE");
      await loadData();
    } catch (error) {
      console.error("Error deleting sub:", error);
      alert("Failed to delete substitution");
    }
  };
  const handleEditSub = async (sub) => {
    const subTime = prompt(
      "Enter sub time (HH:MM:SS) or leave blank for pending:",
      sub.sub_time || ""
    );

    const period = prompt("Enter period number:", sub.period);
    if (!period) return;

    try {
      await apiFetch(`game_subs?id=${sub.id}`, "PUT", {
        sub_time: subTime || null,
        period: parseInt(period),
      });
      await loadData();
    } catch (error) {
      console.error("Error updating sub:", error);
      alert("Failed to update substitution");
    }
  };
  const subColumns = [
    { key: "in_player", label: "In" },
    { key: "out_player", label: "Out" },
    { key: "sub_time", label: "Time" },
    { key: "period", label: "Period" },
    { key: "gk_sub", label: "GK Sub" },
  ];
  const subData = subs.map((s) => {
    const inPlayer = players.find((p) => p.id === s.in_player_id);
    const outPlayer = players.find((p) => p.id === s.out_player_id);
    return {
      id: s.id,
      in_player: inPlayer ? inPlayer.fullName : "Unknown",
      out_player: outPlayer ? outPlayer.fullName : "Unknown",
      sub_time: s.sub_time || "Pending",
      period: s.period,
      gk_sub: s.gk_sub ? "Yes" : "No",
    };
  });

  // ==================== RENDER ====================

  if (!game) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-lg text-muted'>No game loaded</p>
      </div>
    );
  }
  console.log(periodData);
  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Game Management</h1>
        <p className='text-muted'>
          Manage periods, events, and substitutions for this game
        </p>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 mb-6 border-b border-border'>
        <button
          onClick={() => setSelectedTab("periods")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === "periods"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Periods ({periods.length})
        </button>
        <button
          onClick={() => setSelectedTab("events")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === "events"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Events ({events.length})
        </button>
        <button
          onClick={() => setSelectedTab("subs")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === "subs"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Substitutions ({subs.length})
        </button>
      </div>

      {/* Content */}
      <div className='bg-card rounded-lg shadow-lg'>
        {isLoading ? (
          <div className='flex items-center justify-center p-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          </div>
        ) : (
          <>
            {selectedTab === "periods" && (
              <Table
                columns={periodColumns}
                data={periodData}
                hoverable
                caption={<span className='text-xl font-bold'>Periods</span>}
                actions={(row) => (
                  <div className='flex gap-2'>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const period = periods.find((p) => p.id === row.id);
                        if (period) handleEditPeriod(period);
                      }}
                      className='px-3 py-1 text-sm'
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePeriod(row.id);
                      }}
                      variant='danger'
                    >
                      Delete
                    </Button>
                  </div>
                )}
                actionsLabel='Actions'
                actionsWidth='150px'
              />
            )}

            {selectedTab === "events" && (
              <Table
                columns={eventColumns}
                data={eventData}
                hoverable
                caption={<span className='text-xl font-bold'>Events</span>}
                actions={(row) => (
                  <div className='flex gap-2'>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = events.find((ev) => ev.id === row.id);
                        if (event) handleEditEvent(event);
                      }}
                      className='px-3 py-1 text-sm'
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(row.id);
                      }}
                      variant='danger'
                    >
                      Delete
                    </Button>
                  </div>
                )}
                actionsLabel='Actions'
                actionsWidth='150px'
              />
            )}

            {selectedTab === "subs" && (
              <Table
                columns={subColumns}
                data={subData}
                hoverable
                caption={
                  <span className='text-xl font-bold'>Substitutions</span>
                }
                actions={(row) => (
                  <div className='flex gap-2'>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        const sub = subs.find((s) => s.id === row.id);
                        if (sub) handleEditSub(sub);
                      }}
                      className='px-3 py-1 text-sm'
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSub(row.id);
                      }}
                      variant='danger'
                    >
                      Delete
                    </Button>
                  </div>
                )}
                actionsLabel='Actions'
                actionsWidth='150px'
              />
            )}
          </>
        )}
      </div>

      {/* Refresh Button */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={loadData} className='px-6 py-2' disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
    </div>
  );
}

export default GameManagementPage;

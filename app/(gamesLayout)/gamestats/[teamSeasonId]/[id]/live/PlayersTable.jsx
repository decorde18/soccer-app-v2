"use client";

import { useMemo, useState, useEffect } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import useGamePlayerTimeStore from "@/stores/gamePlayerTimeStore";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import { formatSecondsToMmss } from "@/lib/dateTimeUtils";

/**
 * Universal Players Table Component
 * @param {Object} props
 * @param {Function} props.filterPlayers - Function to filter which players to show
 * @param {string} props.caption - Table caption/title
 * @param {Array} props.columns - Optional custom columns array
 * @param {Function} props.onActionClick - Handler for action button clicks
 * @param {Function} props.getActionButton - Function to render custom action button per row
 * @param {string} props.size - Table size (xxs, xs, sm, md, lg)
 * @param {string} props.timeMode - 'onField' | 'onBench' | 'none' - Which time columns to show
 * @param {Function} props.getRowClassName - Custom row className function
 */
function PlayersTable({
  filterPlayers,
  caption,
  columns: customColumns,
  onActionClick,
  getActionButton,
  size = "xxs",
  timeMode = "onField", // 'onField', 'onBench', or 'none'
  getRowClassName,
}) {
  const gameStage = useGameStore((s) => s.getGameStage());
  const getGameTime = useGameStore((s) => s.getGameTime);

  const calculateCurrentTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOnField
  );
  const calculateTotalTimeOnField = useGamePlayerTimeStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOffField = useGamePlayerTimeStore(
    (s) => s.calculateCurrentTimeOffField
  );

  const allPlayers = useGamePlayersStore((s) => s.players);

  const isGameLive = gameStage === "during_period";

  // Force re-render every second to update time displays
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isGameLive) return;
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameLive]);

  const gameTime = getGameTime();

  // Default columns based on timeMode
  const getDefaultColumns = () => {
    const baseColumns = [
      { name: "number", label: "#", width: "50px" },
      { name: "name", label: "Name", width: "30%" },
      { name: "shots", label: "Sh", cellClassName: "text-end" },
      { name: "goals", label: "G", cellClassName: "text-end" },
      { name: "assists", label: "A", cellClassName: "text-end" },
    ];

    if (timeMode === "onField") {
      return [
        ...baseColumns,
        { name: "timeIn", label: "Time", cellClassName: "text-end" },
        { name: "timeInRecent", label: "Last In", cellClassName: "text-end" },
      ];
    } else if (timeMode === "onBench") {
      return [
        ...baseColumns,
        { name: "timeIn", label: "Time In", cellClassName: "text-end" },
        { name: "timeOut", label: "Time Out", cellClassName: "text-end" },
      ];
    }

    return baseColumns;
  };

  const columns = customColumns || getDefaultColumns();

  // Default row className
  const defaultGetRowClassName = (row) => {
    if (row.subStatus === "pendingOut") {
      return "bg-red-100 border-l-4 border-red-500 p-0";
    }
    if (row.subStatus === "pendingIn") {
      return "bg-green-100 border-l-4 border-green-500 p-0";
    }
    return "p-0";
  };

  const rowClassName = getRowClassName || defaultGetRowClassName;

  // Default action button
  const defaultGetActionButton = (row) => {
    if (gameStage === "before_start" || gameStage === "end_game") {
      return null;
    }

    const buttonText = row.subStatus === "pendingOut" ? "Cancel" : "Sub";
    const variant = row.subStatus === "pendingOut" ? "outline" : "default";

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onActionClick?.(row);
        }}
        size='sm'
        variant={variant}
      >
        {buttonText}
      </Button>
    );
  };

  const actionButton = getActionButton || defaultGetActionButton;

  const players = useMemo(
    () =>
      allPlayers.filter(filterPlayers).map((player) => {
        // Calculate times based on mode
        let totalTime = 0;
        let secondaryTime = 0;

        if (timeMode === "onField") {
          totalTime = calculateTotalTimeOnField(player, gameTime);
          secondaryTime = calculateCurrentTimeOnField(player, gameTime);
        } else if (timeMode === "onBench") {
          totalTime = calculateTotalTimeOnField(player, gameTime);
          secondaryTime = calculateCurrentTimeOffField(player, gameTime);
        }

        const rowData = {
          id: player.id,
          playerGameId: player.playerGameId,
          number: player.jerseyNumber || "—",
          name: player.fullName || `${player.firstName} ${player.lastName}`,
          position: player.position,
          shots: player.shots || 0,
          goals: player.goals || 0,
          assists: player.assists || 0,
          saves: player.saves || 0,
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
          fieldStatus: player.fieldStatus,
          gameStatus: player.gameStatus,
          subStatus: player.subStatus,
          pendingSubId: player.outs?.find((out) => out.gameTime === null)
            ?.subId,
        };

        // Add time columns based on mode
        if (timeMode === "onField") {
          rowData.timeIn = formatSecondsToMmss(totalTime);
          rowData.timeInRecent = formatSecondsToMmss(secondaryTime);
        } else if (timeMode === "onBench") {
          rowData.timeIn = formatSecondsToMmss(totalTime);
          rowData.timeOut = formatSecondsToMmss(secondaryTime);
        }

        return rowData;
      }),
    [
      allPlayers,
      filterPlayers,
      gameTime,
      calculateTotalTimeOnField,
      calculateCurrentTimeOnField,
      calculateCurrentTimeOffField,
      timeMode,
    ]
  );

  return (
    <Table
      columns={columns}
      data={players}
      size={size}
      hoverable
      caption={caption}
      onRowClick={(row) => console.log("Clicked:", row)}
      rowClassName={rowClassName}
      actions={actionButton}
      actionsLabel='Action'
      actionsWidth='100px'
    />
  );
}

export default PlayersTable;

// ============================================
// FILE 3: PlayerRow.jsx
// ============================================
import Button from "@/components/ui/Button";
import { useState, useRef, useEffect } from "react";

function PlayerRow({ player, handleStatus, section, starterLength }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getActionsBySection = (section, playerStatus) => {
    const actions = [];

    if (section === "available") {
      actions.push(
        { label: "Start", gameStatus: "starter", variant: "primary" },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (section === "starters") {
      actions.push(
        {
          label: "GK",
          gameStatus: "goalkeeper",
          variant: playerStatus === "goalkeeper" ? "success" : "muted",
        },
        { label: "Bench", gameStatus: "dressed", variant: "muted" }
      );
    }

    if (section === "bench") {
      actions.push({
        label: "Start",
        gameStatus: "starter",
        variant: "primary",
      });
    }

    return actions;
  };

  const getSettingsOptions = (section, playerStatus) => {
    if (section === "starters" || section === "bench") {
      return [
        { label: "Not Dressed", value: "not_dressed" },
        { label: "Unavailable", value: "unavailable" },
        { label: "Injured", value: "injured" },
      ];
    }
    if (section === "available") {
      return [
        { label: "Dressed", value: "dressed" },
        { label: "Injured", value: "injured" },
        { label: "Unavailable", value: "unavailable" },
      ];
    }
    if (section === "unavailable") {
      const otherStatus =
        playerStatus === "injured" ? "unavailable" : "injured";
      return [
        {
          label: otherStatus === "injured" ? "Injured" : "Unavailable",
          value: otherStatus,
        },
        { label: "Dressed", value: "dressed" },
        { label: "Not Dressed", value: "not_dressed" },
      ];
    }
    return [];
  };

  const ActionButtons = () => {
    const actions = getActionsBySection(section, player.gameStatus);
    const settingsOptions = getSettingsOptions(section, player.gameStatus);

    return (
      <div className='flex gap-1.5 relative'>
        {actions.map((action) => (
          <Button
            key={action.gameStatus}
            size='xs'
            variant={action.variant}
            onClick={() => handleStatus(player.id, action.gameStatus)}
            disabled={
              (starterLength === 11 && action.gameStatus === "starter") ||
              (action.gameStatus === "goalkeeper" && starterLength === 0)
            }
          >
            {action.label}
          </Button>
        ))}

        {/* Settings Dropdown */}
        {settingsOptions.length > 0 && (
          <div ref={dropdownRef} className='relative'>
            <Button
              size='xs'
              variant='outline'
              onClick={() => setShowDropdown(!showDropdown)}
            >
              ⚙️
            </Button>

            {showDropdown && (
              <div className='absolute right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg z-10 min-w-32'>
                {settingsOptions.map((option) => (
                  <button
                    key={option.value}
                    className='w-full text-left px-3 py-2 text-xs hover:bg-background text-text'
                    onClick={() => {
                      handleStatus(player.id, option.value);
                      setShowDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded border-2 transition-all ${
        player.gameStatus === "goalkeeper"
          ? "bg-success/10 border-success"
          : "bg-surface border-border hover:border-primary"
      }`}
    >
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm'>
          {player.jerseyNumber}
        </div>
        <div className='text-sm font-semibold text-text'>{player.fullName}</div>
        {section === "unavailable" && (
          <div
            className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded ${
              player.gameStatus === "injured"
                ? "bg-danger/10 text-danger"
                : "bg-muted/20 text-muted"
            }`}
          >
            {player.gameStatus.toUpperCase()}
          </div>
        )}
      </div>
      <ActionButtons />
    </div>
  );
}

export default PlayerRow;

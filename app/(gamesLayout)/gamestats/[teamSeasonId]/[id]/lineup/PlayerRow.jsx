import Button from "@/components/ui/Button";

function PlayerRow({ player, handleStatus, section, starterLength }) {
  //make sure that if the starters have 11, you can't add another
  //make sure that if the bench has x -11 you can't add another
  //make sure the gk is highlighted

  const getActionsBySection = (section, playerStatus) => {
    const actions = [];

    if (section === "available") {
      actions.push(
        { label: "Start", gameStatus: "starter", variant: "primary" },
        { label: "Bench", gameStatus: "bench", variant: "muted" }
      );
    }

    if (section === "starters" || section === "bench") {
      if (section === "starters") {
        actions.push(
          {
            label: "Goalkeeper",
            gameStatus: "goalkeeper",
            variant: playerStatus === "goalkeeper" ? "success" : "muted",
          },
          { label: "Bench", gameStatus: "bench", variant: "muted" }
        );
      } else {
        actions.push({
          label: "Start",
          gameStatus: "starter",
          variant: "primary",
        });
      }
      actions.push({
        label: "Remove",
        gameStatus: "available",
        variant: "danger",
      });
    }

    actions.push({ label: "⚙️", gameStatus: "toggle", variant: "outline" });

    return actions;
  };

  const ActionButtons = () => {
    const actions = getActionsBySection(section, player.gameStatus);
    return (
      <div className='flex gap-1'>
        {actions.map((action) => (
          <Button
            key={action.gameStatus}
            size='xs'
            variant={action.variant}
            onClick={() => handleStatus(player.id, action.gameStatus)}
            disabled={starterLength === 11 && action.gameStatus === "starter"}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${"bg-white border-muted hover:border-primary hover:bg-background"}`}
    >
      <div className='flex items-center gap-3'>
        <div className='w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm'>
          {player.jerseyNumber}
        </div>
        <div className='font-medium'>{player.fullName}</div>
        {section === "unavailable" && (
          <div
            className={`text-xs font-semibold ${
              player.gameStatus === "injured" ? "text-red-600" : "text-gray-500"
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

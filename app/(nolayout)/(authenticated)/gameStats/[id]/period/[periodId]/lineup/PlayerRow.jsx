import Button from "@/components/ui/Button";

function PlayerRow({ player, handleStatus, section, starterLength }) {
  //make sure that if the starters have 11, you can't add another
  //make sure that if the bench has x -11 you can't add another
  //make sure the gk is highlighted

  const getActionsBySection = (section, playerStatus) => {
    const actions = [];

    if (section === "available") {
      actions.push(
        { label: "Start", status: "starter", variant: "primary" },
        { label: "Bench", status: "bench", variant: "muted" }
      );
    }

    if (section === "starters" || section === "bench") {
      if (section === "starters") {
        actions.push({
          label: "Goalkeeper",
          status: "goalkeeper",
          variant: playerStatus === "goalkeeper" ? "success" : "muted",
        });
      }
      actions.push({ label: "Remove", status: "available", variant: "danger" });
    }

    actions.push({ label: "⚙️", status: "toggle", variant: "outline" });

    return actions;
  };

  const ActionButtons = () => {
    const actions = getActionsBySection(section, player.status);

    return (
      <div className='flex gap-1'>
        {actions.map((action) => (
          <Button
            key={action.status}
            size='xs'
            variant={action.variant}
            onClick={() => handleStatus(player.id, action.status)}
            disabled={starterLength === 11 && action.status === "starter"}
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
          {player.number}
        </div>
        <div className='font-medium'>{player.name}</div>
        {section === "unavailable" && (
          <div
            className={`text-xs font-semibold ${
              player.status === "injured" ? "text-red-600" : "text-gray-500"
            }`}
          >
            {player.status.toUpperCase()}
          </div>
        )}
      </div>
      <ActionButtons />
    </div>
  );
}

export default PlayerRow;

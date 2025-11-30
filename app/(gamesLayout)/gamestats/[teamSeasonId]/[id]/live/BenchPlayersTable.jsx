function BenchPlayersTable() {
  const players = useGamePlayersStore((s) => s.players);
  const getGameTime = useGameStore((s) => s.getGameTime);
  const calculateTotalTimeOnField = useGamePlayersStore(
    (s) => s.calculateTotalTimeOnField
  );
  const calculateCurrentTimeOffField = useGamePlayersStore(
    (s) => s.calculateCurrentTimeOffField
  );

  // Use the sub management hook
  const { handleSubClick, SubModal } = useSubManagement();

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const gameTime = getGameTime();

  const columns = [
    { name: "number", label: "#" },
    { name: "name", label: "Name", width: "30%" },
    { name: "shots", label: "Sh", cellClassName: "text-end" },
    { name: "goals", label: "G", cellClassName: "text-end" },
    { name: "assists", label: "A", cellClassName: "text-end" },
    { name: "timeIn", label: "Time", cellClassName: "text-end" },
    { name: "timeOffBench", label: "Off Bench", cellClassName: "text-end" },
  ];

  const getButtonText = (fieldStatus) => {
    if (fieldStatus === "subbingIn") return "Cancel";
    return "Sub In";
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingIn") return "bg-green-100";
    return "";
  };

  const benchPlayers = useMemo(
    () =>
      players
        .filter(
          (player) =>
            player.fieldStatus === "onBench" ||
            player.fieldStatus === "subbingIn"
        )
        .map((player) => {
          const totalTime = calculateTotalTimeOnField(player, gameTime);
          const timeOffBench = calculateCurrentTimeOffField(player, gameTime);

          return {
            id: player.id,
            number: player.jerseyNumber,
            name: player.fullName,
            shots: player.shots || 0,
            goals: player.goals || 0,
            assists: player.assists || 0,
            timeIn: formatSecondsToMmss(totalTime),
            timeOffBench: formatSecondsToMmss(timeOffBench),
            fieldStatus: player.fieldStatus,
          };
        }),
    [players, gameTime, calculateTotalTimeOnField, calculateCurrentTimeOffField]
  );

  return (
    <>
      <div className='flex flex-col'>
        <Table
          columns={columns}
          data={benchPlayers}
          size='sm'
          hoverable
          caption={<span className='text-2xl font-bold'>On Bench</span>}
          onRowClick={(row) => console.log("Clicked:", row)}
          rowClassName={getRowClassName}
          actions={(row) => (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSubClick(row.id);
              }}
              variant={row.fieldStatus === "subbingIn" ? "danger" : "success"}
              className='px-3 py-1 rounded'
            >
              {getButtonText(row.fieldStatus)}
            </Button>
          )}
          actionsLabel='Status'
          actionsWidth='100px'
        />
      </div>

      {/* Sub Selection Modal */}
      <SubModal />
    </>
  );
}

export default BenchPlayersTable;

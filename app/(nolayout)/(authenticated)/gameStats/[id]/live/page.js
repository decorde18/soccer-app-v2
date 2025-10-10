import React, { useState, useEffect, useRef } from "react";

const LiveGame = () => {
  // Game settings (would come from database)
  const gameSettings = {
    clockDirection: "down", // 'up' or 'down'
    periodLength: 40 * 60, // 40 minutes in seconds
    currentPeriod: 1,
  };

  // Game state
  const [clockTime, setClockTime] = useState(
    gameSettings.clockDirection === "down" ? gameSettings.periodLength : 0
  );
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeCorners, setHomeCorners] = useState(0);
  const [homeOffsides, setHomeOffsides] = useState(0);
  const [awayCorners, setAwayCorners] = useState(0);
  const [awayOffsides, setAwayOffsides] = useState(0);

  // Modal states
  const [showStoppageModal, setShowStoppageModal] = useState(false);
  const [stoppageType, setStoppageType] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    scorer: null,
    assistedBy: null,
    isHeader: false,
    isPenalty: false,
    notes: "",
  });

  // Players on field (mock data - would be set from period lineup)
  const [onFieldPlayers, setOnFieldPlayers] = useState([
    {
      id: 1,
      name: "John Smith",
      number: 1,
      isGK: true,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 2,
      name: "Mike Johnson",
      number: 3,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 3,
      name: "David Brown",
      number: 5,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 4,
      name: "Chris Wilson",
      number: 7,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 5,
      name: "James Davis",
      number: 9,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 6,
      name: "Robert Miller",
      number: 11,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 7,
      name: "Tom Anderson",
      number: 13,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 8,
      name: "Dan Thomas",
      number: 15,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 9,
      name: "Paul Jackson",
      number: 17,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 10,
      name: "Mark White",
      number: 19,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
    {
      id: 11,
      name: "Steve Harris",
      number: 21,
      isGK: false,
      shiftStart: 0,
      totalPlayed: 0,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    },
  ]);

  // Waiting area for subs
  const [waitingPlayers, setWaitingPlayers] = useState([]);

  // Bench players
  const [benchPlayers, setBenchPlayers] = useState([
    {
      id: 12,
      name: "Kevin Martin",
      number: 2,
      totalPlayed: 0,
      timeOffBench: 0,
    },
    { id: 13, name: "Brian Lee", number: 4, totalPlayed: 0, timeOffBench: 0 },
    { id: 14, name: "Gary Moore", number: 6, totalPlayed: 0, timeOffBench: 0 },
    { id: 15, name: "Eric Taylor", number: 8, totalPlayed: 0, timeOffBench: 0 },
    { id: 16, name: "Ryan Clark", number: 10, totalPlayed: 0, timeOffBench: 0 },
    { id: 17, name: "Jeff Lewis", number: 12, totalPlayed: 0, timeOffBench: 0 },
    {
      id: 18,
      name: "Matt Walker",
      number: 14,
      totalPlayed: 0,
      timeOffBench: 0,
    },
  ]);

  const intervalRef = useRef(null);

  // Clock effect
  useEffect(() => {
    if (isClockRunning) {
      intervalRef.current = setInterval(() => {
        setClockTime((prev) => {
          if (gameSettings.clockDirection === "down") {
            if (prev <= 0) {
              setIsClockRunning(false);
              alert("Period ended!");
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isClockRunning, gameSettings.clockDirection]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCurrentShiftTime = (shiftStart) => {
    return clockTime - shiftStart;
  };

  const updatePlayerStat = (playerId, stat, increment = 1) => {
    setOnFieldPlayers((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, [stat]: p[stat] + increment } : p
      )
    );
  };

  const handleGoalClick = (playerId) => {
    setGoalData({
      scorer: playerId,
      assistedBy: null,
      isHeader: false,
      isPenalty: false,
      notes: "",
    });
    setShowGoalModal(true);
  };

  const submitGoal = () => {
    if (goalData.scorer) {
      updatePlayerStat(goalData.scorer, "goals");
      if (goalData.assistedBy) {
        updatePlayerStat(goalData.assistedBy, "assists");
      }
      setHomeScore(homeScore + 1);
      setShowGoalModal(false);
      setGoalData({
        scorer: null,
        assistedBy: null,
        isHeader: false,
        isPenalty: false,
        notes: "",
      });
    }
  };

  const handleStoppageClick = (type) => {
    setIsClockRunning(false);
    setStoppageType(type);
    setShowStoppageModal(true);
  };

  const handleStoppageResume = () => {
    if (stoppageType === "weather") {
      alert("Navigating to suspension screen...");
    }
    setShowStoppageModal(false);
    setStoppageType(null);
  };

  const moveToWaiting = (playerId, replacingId) => {
    const player = benchPlayers.find((p) => p.id === playerId);
    if (player) {
      setBenchPlayers(benchPlayers.filter((p) => p.id !== playerId));
      setWaitingPlayers([
        ...waitingPlayers,
        { ...player, replacing: replacingId, waitStart: clockTime },
      ]);
    }
  };

  const completeSub = (waitingPlayerId) => {
    const waitingPlayer = waitingPlayers.find((p) => p.id === waitingPlayerId);
    if (!waitingPlayer) return;

    const replacingPlayer = onFieldPlayers.find(
      (p) => p.id === waitingPlayer.replacing
    );
    if (!replacingPlayer) return;

    const newOnFieldPlayer = {
      ...waitingPlayer,
      isGK: replacingPlayer.isGK,
      shiftStart: clockTime,
      shots: 0,
      shotsOnTarget: 0,
      goals: 0,
      assists: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
    };

    const newBenchPlayer = {
      id: replacingPlayer.id,
      name: replacingPlayer.name,
      number: replacingPlayer.number,
      totalPlayed:
        replacingPlayer.totalPlayed + (clockTime - replacingPlayer.shiftStart),
      timeOffBench: clockTime,
    };

    setOnFieldPlayers(
      onFieldPlayers.map((p) =>
        p.id === waitingPlayer.replacing ? newOnFieldPlayer : p
      )
    );
    setBenchPlayers([...benchPlayers, newBenchPlayer]);
    setWaitingPlayers(waitingPlayers.filter((p) => p.id !== waitingPlayerId));
  };

  const cancelWaiting = (playerId) => {
    const player = waitingPlayers.find((p) => p.id === playerId);
    if (player) {
      setWaitingPlayers(waitingPlayers.filter((p) => p.id !== playerId));
      setBenchPlayers([
        ...benchPlayers,
        {
          id: player.id,
          name: player.name,
          number: player.number,
          totalPlayed: player.totalPlayed,
          timeOffBench: player.timeOffBench,
        },
      ]);
    }
  };

  const updateWaitingReplacing = (waitingPlayerId, newReplacingId) => {
    setWaitingPlayers(
      waitingPlayers.map((p) =>
        p.id === waitingPlayerId ? { ...p, replacing: newReplacingId } : p
      )
    );
  };

  return (
    <div className='max-w-full mx-auto p-4 bg-gray-100 min-h-screen'>
      <div className='bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl mb-4 shadow-lg'>
        <div className='flex items-center justify-between mb-4'>
          <div className='text-sm font-semibold'>
            PERIOD {gameSettings.currentPeriod}
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => handleStoppageClick("goal")}
              className='px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold'
            >
              Goal
            </button>
            <button
              onClick={() => handleStoppageClick("card")}
              className='px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold'
            >
              Card
            </button>
            <button
              onClick={() => handleStoppageClick("injury")}
              className='px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold'
            >
              Injury
            </button>
            <button
              onClick={() => handleStoppageClick("weather")}
              className='px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold'
            >
              Weather
            </button>
            <button
              onClick={() => handleStoppageClick("other")}
              className='px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold'
            >
              Other
            </button>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='text-center flex-1'>
            <div className='text-2xl font-bold'>Home Team</div>
            <div className='text-6xl font-black mt-2'>{homeScore}</div>
          </div>

          <div className='text-center px-8'>
            <div className='text-7xl font-black tabular-nums'>
              {formatTime(clockTime)}
            </div>
            <div className='flex gap-2 mt-4'>
              <button
                onClick={() => setIsClockRunning(!isClockRunning)}
                className='px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold'
              >
                {isClockRunning ? "Stop" : "Start"}
              </button>
              <button
                onClick={() =>
                  setClockTime(
                    gameSettings.clockDirection === "down"
                      ? gameSettings.periodLength
                      : 0
                  )
                }
                className='px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-bold'
              >
                Reset
              </button>
            </div>
          </div>

          <div className='text-center flex-1'>
            <div className='text-2xl font-bold'>Away Team</div>
            <div className='text-6xl font-black mt-2'>{awayScore}</div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        <div className='lg:col-span-3 space-y-4'>
          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-lg font-bold text-gray-900 mb-3'>
              On Field (11)
            </h2>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b-2 border-gray-200'>
                    <th className='text-left p-2 font-semibold'>#</th>
                    <th className='text-left p-2 font-semibold'>Player</th>
                    <th className='text-center p-2 font-semibold'>Shift</th>
                    <th className='text-center p-2 font-semibold'>Total</th>
                    <th className='text-center p-2 font-semibold'>S</th>
                    <th className='text-center p-2 font-semibold'>SOT</th>
                    <th className='text-center p-2 font-semibold'>G</th>
                    <th className='text-center p-2 font-semibold'>A</th>
                    <th className='text-center p-2 font-semibold'>F</th>
                    <th className='text-center p-2 font-semibold'>Y</th>
                    <th className='text-center p-2 font-semibold'>R</th>
                    <th className='text-center p-2 font-semibold'>SV</th>
                    <th className='text-right p-2 font-semibold'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {onFieldPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className='border-b border-gray-100 hover:bg-gray-50'
                    >
                      <td className='p-2'>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                            player.isGK ? "bg-green-500" : "bg-blue-600"
                          }`}
                        >
                          {player.number}
                        </div>
                      </td>
                      <td className='p-2 font-medium'>{player.name}</td>
                      <td className='p-2 text-center tabular-nums text-xs'>
                        {formatTime(getCurrentShiftTime(player.shiftStart))}
                      </td>
                      <td className='p-2 text-center tabular-nums text-xs'>
                        {formatTime(
                          player.totalPlayed +
                            getCurrentShiftTime(player.shiftStart)
                        )}
                      </td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() => updatePlayerStat(player.id, "shots")}
                          className='hover:bg-blue-100 px-2 py-1 rounded'
                        >
                          {player.shots}
                        </button>
                      </td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() => {
                            updatePlayerStat(player.id, "shots");
                            updatePlayerStat(player.id, "shotsOnTarget");
                          }}
                          className='hover:bg-blue-100 px-2 py-1 rounded'
                        >
                          {player.shotsOnTarget}
                        </button>
                      </td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() => handleGoalClick(player.id)}
                          className='hover:bg-green-100 px-2 py-1 rounded font-bold'
                        >
                          {player.goals}
                        </button>
                      </td>
                      <td className='p-2 text-center'>{player.assists}</td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() => updatePlayerStat(player.id, "fouls")}
                          className='hover:bg-yellow-100 px-2 py-1 rounded'
                        >
                          {player.fouls}
                        </button>
                      </td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() =>
                            updatePlayerStat(player.id, "yellowCards")
                          }
                          className='hover:bg-yellow-100 px-2 py-1 rounded'
                        >
                          {player.yellowCards}
                        </button>
                      </td>
                      <td className='p-2 text-center'>
                        <button
                          onClick={() =>
                            updatePlayerStat(player.id, "redCards")
                          }
                          className='hover:bg-red-100 px-2 py-1 rounded'
                        >
                          {player.redCards}
                        </button>
                      </td>
                      <td className='p-2 text-center'>
                        {player.isGK && (
                          <button
                            onClick={() => updatePlayerStat(player.id, "saves")}
                            className='hover:bg-green-100 px-2 py-1 rounded'
                          >
                            {player.saves}
                          </button>
                        )}
                      </td>
                      <td className='p-2 text-right'>
                        <button className='px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600'>
                          Sub Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {waitingPlayers.length > 0 && (
            <div className='bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl'>
              <h2 className='text-lg font-bold text-gray-900 mb-3'>
                Waiting to Sub In
              </h2>
              <div className='space-y-2'>
                {waitingPlayers.map((player) => (
                  <div
                    key={player.id}
                    className='flex items-center justify-between bg-white p-3 rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xs'>
                        {player.number}
                      </div>
                      <div>
                        <div className='font-medium'>{player.name}</div>
                        <div className='text-xs text-gray-600'>
                          Replacing:
                          <select
                            value={player.replacing}
                            onChange={(e) =>
                              updateWaitingReplacing(
                                player.id,
                                parseInt(e.target.value)
                              )
                            }
                            className='ml-2 border border-gray-300 rounded px-2 py-0.5'
                          >
                            {onFieldPlayers.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.number} {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => completeSub(player.id)}
                        className='px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600'
                      >
                        Complete Sub
                      </button>
                      <button
                        onClick={() => cancelWaiting(player.id)}
                        className='px-3 py-1 bg-gray-500 text-white rounded text-xs font-semibold hover:bg-gray-600'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-lg font-bold text-gray-900 mb-3'>
              Bench ({benchPlayers.length})
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              {benchPlayers.map((player) => (
                <div
                  key={player.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-xs'>
                      {player.number}
                    </div>
                    <div>
                      <div className='font-medium text-sm'>{player.name}</div>
                      <div className='text-xs text-gray-500'>
                        Played: {formatTime(player.totalPlayed)} | Off:{" "}
                        {formatTime(clockTime - player.timeOffBench)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onFieldPlayers.length > 0) {
                        moveToWaiting(player.id, onFieldPlayers[0].id);
                      }
                    }}
                    className='px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600'
                  >
                    Sub In
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-lg font-bold text-gray-900 mb-4'>Team Stats</h2>

            <div className='space-y-3'>
              <div>
                <div className='text-sm font-semibold text-gray-700 mb-2'>
                  Corners
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setHomeCorners(Math.max(0, homeCorners - 1))}
                    className='w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold'
                  >
                    -
                  </button>
                  <div className='flex-1 text-center font-bold text-lg'>
                    {homeCorners}
                  </div>
                  <button
                    onClick={() => setHomeCorners(homeCorners + 1)}
                    className='w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold'
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className='text-sm font-semibold text-gray-700 mb-2'>
                  Offsides
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      setHomeOffsides(Math.max(0, homeOffsides - 1))
                    }
                    className='w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold'
                  >
                    -
                  </button>
                  <div className='flex-1 text-center font-bold text-lg'>
                    {homeOffsides}
                  </div>
                  <button
                    onClick={() => setHomeOffsides(homeOffsides + 1)}
                    className='w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold'
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 rounded-xl shadow-md'>
            <h2 className='text-lg font-bold text-gray-900 mb-4'>Opposition</h2>

            <div className='space-y-3'>
              <div>
                <div className='text-sm font-semibold text-gray-700 mb-1'>
                  Score
                </div>
                <div className='text-3xl font-bold text-center'>
                  {awayScore}
                </div>
              </div>

              <div>
                <div className='text-sm font-semibold text-gray-700 mb-2'>
                  Corners
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setAwayCorners(Math.max(0, awayCorners - 1))}
                    className='w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold'
                  >
                    -
                  </button>
                  <div className='flex-1 text-center font-bold text-lg'>
                    {awayCorners}
                  </div>
                  <button
                    onClick={() => setAwayCorners(awayCorners + 1)}
                    className='w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded font-bold'
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className='text-sm font-semibold text-gray-700 mb-2'>
                  Offsides
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      setAwayOffsides(Math.max(0, awayOffsides - 1))
                    }
                    className='w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold'
                  >
                    -
                  </button>
                  <div className='flex-1 text-center font-bold text-lg'>
                    {awayOffsides}
                  </div>
                  <button
                    onClick={() => setAwayOffsides(awayOffsides + 1)}
                    className='w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded font-bold'
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStoppageModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl p-6 max-w-md w-full'>
            <h2 className='text-2xl font-bold mb-4'>
              Stoppage: {stoppageType}
            </h2>
            <p className='text-gray-600 mb-6'>
              Clock stopped at {formatTime(clockTime)}. Player times continue
              running.
              {stoppageType === "weather" &&
                " If this is a weather delay requiring suspension, proceed to suspension screen."}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={handleStoppageResume}
                className='flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600'
              >
                {stoppageType === "weather" ? "Suspend Game" : "Resume"}
              </button>
              <button
                onClick={() => {
                  setShowStoppageModal(false);
                  setStoppageType(null);
                }}
                className='flex-1 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl p-6 max-w-lg w-full'>
            <h2 className='text-2xl font-bold mb-4'>Record Goal</h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Scorer
                </label>
                <select
                  value={goalData.scorer || ""}
                  onChange={(e) =>
                    setGoalData({
                      ...goalData,
                      scorer: parseInt(e.target.value),
                    })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                >
                  <option value=''>Select player...</option>
                  {onFieldPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Assisted By (optional)
                </label>
                <select
                  value={goalData.assistedBy || ""}
                  onChange={(e) =>
                    setGoalData({
                      ...goalData,
                      assistedBy: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                >
                  <option value=''>None</option>
                  {onFieldPlayers
                    .filter((p) => p.id !== goalData.scorer)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={goalData.isHeader}
                    onChange={(e) =>
                      setGoalData({ ...goalData, isHeader: e.target.checked })
                    }
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm font-semibold text-gray-700'>
                    Header
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={goalData.isPenalty}
                    onChange={(e) =>
                      setGoalData({ ...goalData, isPenalty: e.target.checked })
                    }
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <span className='text-sm font-semibold text-gray-700'>
                    Penalty Kick
                  </span>
                </label>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Notes
                </label>
                <textarea
                  value={goalData.notes}
                  onChange={(e) =>
                    setGoalData({ ...goalData, notes: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                  rows='3'
                  placeholder='Additional details about the goal...'
                />
              </div>
            </div>

            <div className='flex gap-3 mt-6'>
              <button
                onClick={submitGoal}
                disabled={!goalData.scorer}
                className={`flex-1 py-3 rounded-lg font-bold ${
                  goalData.scorer
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Record Goal
              </button>
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setGoalData({
                    scorer: null,
                    assistedBy: null,
                    isHeader: false,
                    isPenalty: false,
                    notes: "",
                  });
                }}
                className='flex-1 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGame;

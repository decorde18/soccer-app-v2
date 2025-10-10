"use client";

import React, { useState } from "react";

const SetStarters = () => {
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const numberOfPeriods = 2;

  // Mock roster data
  const [roster] = useState([
    { id: 1, name: "John Smith", number: 1, status: "available" },
    { id: 2, name: "Mike Johnson", number: 3, status: "available" },
    { id: 3, name: "David Brown", number: 5, status: "available" },
    { id: 4, name: "Chris Wilson", number: 7, status: "available" },
    { id: 5, name: "James Davis", number: 9, status: "available" },
    { id: 6, name: "Robert Miller", number: 11, status: "available" },
    { id: 7, name: "Tom Anderson", number: 13, status: "available" },
    { id: 8, name: "Dan Thomas", number: 15, status: "available" },
    { id: 9, name: "Paul Jackson", number: 17, status: "available" },
    { id: 10, name: "Mark White", number: 19, status: "available" },
    { id: 11, name: "Steve Harris", number: 21, status: "available" },
    { id: 12, name: "Kevin Martin", number: 2, status: "available" },
    { id: 13, name: "Brian Lee", number: 4, status: "available" },
    { id: 14, name: "Gary Moore", number: 6, status: "available" },
    { id: 15, name: "Eric Taylor", number: 8, status: "available" },
    { id: 16, name: "Ryan Clark", number: 10, status: "available" },
    { id: 17, name: "Jeff Lewis", number: 12, status: "available" },
    { id: 18, name: "Matt Walker", number: 14, status: "available" },
  ]);

  const [playerStatus, setPlayerStatus] = useState({});

  // Starters and bench for each period
  const [periodData, setPeriodData] = useState({
    1: { starters: [], goalkeeper: null, bench: [] },
    2: { starters: [], goalkeeper: null, bench: [] },
  });

  const getPlayerStatus = (playerId) => {
    return playerStatus[playerId] || "available";
  };

  const togglePlayerStatus = (playerId, currentStatus) => {
    const statusCycle = {
      available: "unavailable",
      unavailable: "injured",
      injured: "available",
    };
    setPlayerStatus({
      ...playerStatus,
      [playerId]: statusCycle[currentStatus],
    });

    // Remove from selections if marked unavailable/injured
    if (currentStatus === "available") {
      removePlayerFromAllSelections(playerId);
    }
  };

  const removePlayerFromAllSelections = (playerId) => {
    const newPeriodData = { ...periodData };
    Object.keys(newPeriodData).forEach((period) => {
      newPeriodData[period].starters = newPeriodData[period].starters.filter(
        (id) => id !== playerId
      );
      newPeriodData[period].bench = newPeriodData[period].bench.filter(
        (id) => id !== playerId
      );
      if (newPeriodData[period].goalkeeper === playerId) {
        newPeriodData[period].goalkeeper = null;
      }
    });
    setPeriodData(newPeriodData);
  };

  const toggleStarter = (playerId) => {
    const status = getPlayerStatus(playerId);
    if (status !== "available") return;

    const currentData = periodData[currentPeriod];
    const isStarter = currentData.starters.includes(playerId);
    const isBench = currentData.bench.includes(playerId);

    let newStarters = [...currentData.starters];
    let newBench = [...currentData.bench];

    if (isStarter) {
      // Remove from starters
      newStarters = newStarters.filter((id) => id !== playerId);
      if (currentData.goalkeeper === playerId) {
        // Also remove GK designation
        setPeriodData({
          ...periodData,
          [currentPeriod]: {
            ...currentData,
            starters: newStarters,
            goalkeeper: null,
            bench: newBench,
          },
        });
        return;
      }
    } else if (isBench) {
      // Remove from bench
      newBench = newBench.filter((id) => id !== playerId);
    } else {
      // Add to starters if less than 11
      if (newStarters.length < 11) {
        newStarters.push(playerId);
      }
    }

    setPeriodData({
      ...periodData,
      [currentPeriod]: {
        ...currentData,
        starters: newStarters,
        bench: newBench,
      },
    });
  };

  const toggleBench = (playerId) => {
    const status = getPlayerStatus(playerId);
    if (status !== "available") return;

    const currentData = periodData[currentPeriod];
    const isBench = currentData.bench.includes(playerId);
    const isStarter = currentData.starters.includes(playerId);

    let newBench = [...currentData.bench];
    let newStarters = [...currentData.starters];

    if (isBench) {
      newBench = newBench.filter((id) => id !== playerId);
    } else if (isStarter) {
      // Remove from starters
      newStarters = newStarters.filter((id) => id !== playerId);
      if (currentData.goalkeeper === playerId) {
        setPeriodData({
          ...periodData,
          [currentPeriod]: {
            ...currentData,
            starters: newStarters,
            goalkeeper: null,
            bench: newBench,
          },
        });
        return;
      }
    } else {
      newBench.push(playerId);
    }

    setPeriodData({
      ...periodData,
      [currentPeriod]: {
        ...currentData,
        starters: newStarters,
        bench: newBench,
      },
    });
  };

  const toggleGoalkeeper = (playerId) => {
    const currentData = periodData[currentPeriod];
    if (!currentData.starters.includes(playerId)) return;

    setPeriodData({
      ...periodData,
      [currentPeriod]: {
        ...currentData,
        goalkeeper: currentData.goalkeeper === playerId ? null : playerId,
      },
    });
  };

  const canStartGame = () => {
    // Check all periods have 11 starters and a goalkeeper
    for (let i = 1; i <= numberOfPeriods; i++) {
      const data = periodData[i];
      if (data.starters.length !== 11 || !data.goalkeeper) {
        return false;
      }
    }
    return true;
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      alert("Starting game with configured lineups!");
      // This would navigate to the game interface
    }
  };

  const getPlayerById = (id) => roster.find((p) => p.id === id);

  const currentData = periodData[currentPeriod];
  const availablePlayers = roster.filter((p) => {
    const status = getPlayerStatus(p.id);
    return (
      status === "available" &&
      !currentData.starters.includes(p.id) &&
      !currentData.bench.includes(p.id)
    );
  });

  return (
    <div className='max-w-7xl mx-auto p-5 bg-gray-100 min-h-screen'>
      {/* Header */}
      <div className='bg-white p-6 rounded-xl mb-6 shadow-md'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Set Starting Lineups
        </h1>
        <div className='text-gray-600 text-sm'>
          Team vs Opponent • Season 2024
        </div>
      </div>

      {/* Period Tabs */}
      <div className='flex gap-2 mb-6'>
        {[...Array(numberOfPeriods)].map((_, i) => {
          const period = i + 1;
          const data = periodData[period];
          const isComplete = data.starters.length === 11 && data.goalkeeper;

          return (
            <button
              key={period}
              onClick={() => setCurrentPeriod(period)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              Period {period} {isComplete && "✓"}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Starters Section */}
        <div className='bg-white p-6 rounded-xl shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold text-gray-900'>Starters</h2>
            <span className='text-sm text-gray-600'>
              {currentData.starters.length}/11
            </span>
          </div>

          <div className='flex flex-col gap-2 max-h-96 overflow-y-auto'>
            {currentData.starters.map((playerId) => {
              const player = getPlayerById(playerId);
              const isGK = currentData.goalkeeper === playerId;

              return (
                <div
                  key={playerId}
                  className='flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-600 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isGK ? "bg-green-500" : "bg-blue-600"
                      }`}
                    >
                      {player.number}
                    </div>
                    <div className='font-medium text-gray-900'>
                      {player.name}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => toggleGoalkeeper(playerId)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        isGK
                          ? "bg-green-500 text-white"
                          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      GK
                    </button>
                    <button
                      onClick={() => toggleStarter(playerId)}
                      className='px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded-md text-xs hover:bg-gray-50'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            {currentData.starters.length === 0 && (
              <div className='text-center text-gray-400 py-8'>
                No starters selected
              </div>
            )}
          </div>

          {currentData.starters.length === 11 && !currentData.goalkeeper && (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-400 rounded-lg text-yellow-800 text-sm'>
              ⚠️ Please select a goalkeeper
            </div>
          )}
        </div>

        {/* Bench Section */}
        <div className='bg-white p-6 rounded-xl shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold text-gray-900'>Bench</h2>
            <span className='text-sm text-gray-600'>
              {currentData.bench.length} players
            </span>
          </div>

          <div className='flex flex-col gap-2 max-h-96 overflow-y-auto'>
            {currentData.bench.map((playerId) => {
              const player = getPlayerById(playerId);

              return (
                <div
                  key={playerId}
                  className='flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-300 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm'>
                      {player.number}
                    </div>
                    <div className='font-medium text-gray-900'>
                      {player.name}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBench(playerId)}
                    className='px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded-md text-xs hover:bg-gray-50'
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            {currentData.bench.length === 0 && (
              <div className='text-center text-gray-400 py-8'>
                No bench players selected
              </div>
            )}
          </div>
        </div>

        {/* Available Players */}
        <div className='bg-white p-6 rounded-xl shadow-md lg:col-span-2'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>
            Available Players
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
            {roster.map((player) => {
              const status = getPlayerStatus(player.id);
              const isSelected =
                currentData.starters.includes(player.id) ||
                currentData.bench.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    status !== "available"
                      ? "bg-gray-100 border-gray-200 opacity-50"
                      : isSelected
                      ? "bg-blue-50 border-blue-600"
                      : "bg-gray-50 border-gray-200 hover:border-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm'>
                      {player.number}
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>
                        {player.name}
                      </div>
                      {status !== "available" && (
                        <div
                          className={`text-xs font-semibold ${
                            status === "injured"
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {status.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex gap-1'>
                    {status === "available" && !isSelected && (
                      <>
                        {currentData.starters.length < 11 && (
                          <button
                            onClick={() => toggleStarter(player.id)}
                            className='px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700'
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => toggleBench(player.id)}
                          className='px-2 py-1 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700'
                        >
                          Bench
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => togglePlayerStatus(player.id, status)}
                      className='px-2 py-1 bg-white border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50'
                    >
                      {status === "available" ? "⚙️" : "✓"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <button
        onClick={handleStartGame}
        disabled={!canStartGame()}
        className={`w-full mt-6 py-4 rounded-xl text-lg font-bold transition-all ${
          canStartGame()
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {canStartGame() ? "Start Game" : "Complete All Period Lineups to Start"}
      </button>
    </div>
  );
};

export default SetStarters;

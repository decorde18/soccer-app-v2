"use client";
import React, { useState } from "react";

const GameSetup = () => {
  const [gameData, setGameData] = useState({
    homeTeam: "Franklin High School",
    awayTeam: "",
    league: "",
    season: "2024-2025",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    location: "",
    numberOfPeriods: 2,
    periodLength: 40,
    clockDirection: "down", // 'up' or 'down'
    allowReentry: false,
    maxSubstitutions: 0, // 0 = unlimited
  });

  // Mock data - would come from database
  const [leagues] = useState([
    {
      id: 1,
      name: "TSSAA High School",
      defaultPeriods: 2,
      defaultLength: 40,
      clockDirection: "down",
      allowReentry: false,
    },
    {
      id: 2,
      name: "US Youth Soccer",
      defaultPeriods: 2,
      defaultLength: 40,
      clockDirection: "up",
      allowReentry: true,
    },
    {
      id: 3,
      name: "Adult Rec League",
      defaultPeriods: 2,
      defaultLength: 45,
      clockDirection: "up",
      allowReentry: true,
    },
  ]);

  const [teams] = useState([
    { id: 1, name: "Franklin High School" },
    { id: 2, name: "Brentwood High School" },
    { id: 3, name: "Independence High School" },
    { id: 4, name: "Centennial High School" },
  ]);

  const handleLeagueChange = (leagueId) => {
    const league = leagues.find((l) => l.id === parseInt(leagueId));
    if (league) {
      setGameData({
        ...gameData,
        league: leagueId,
        numberOfPeriods: league.defaultPeriods,
        periodLength: league.defaultLength,
        clockDirection: league.clockDirection,
        allowReentry: league.allowReentry,
      });
    }
  };

  const handleSubmit = () => {
    if (!gameData.awayTeam || !gameData.league) {
      alert("Please fill in all required fields");
      return;
    }

    // Would save to database and redirect to period lineup
    console.log("Game setup:", gameData);
    alert("Game created! Proceeding to set Period 1 lineup...");
    // Navigate to: /games/:gameId/period/1/lineup
  };

  return (
    <div className='max-w-4xl mx-auto p-5 bg-gray-100 min-h-screen'>
      {/* Header */}
      <div className='bg-white p-6 rounded-xl mb-6 shadow-md'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          New Game Setup
        </h1>
        <div className='text-gray-600 text-sm'>
          Configure game settings and teams
        </div>
      </div>

      {/* Main Form */}
      <div className='bg-white p-6 rounded-xl shadow-md'>
        <div className='space-y-6'>
          {/* Teams Section */}
          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>Teams</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Home Team *
                </label>
                <select
                  value={gameData.homeTeam}
                  onChange={(e) =>
                    setGameData({ ...gameData, homeTeam: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Away Team *
                </label>
                <input
                  type='text'
                  value={gameData.awayTeam}
                  onChange={(e) =>
                    setGameData({ ...gameData, awayTeam: e.target.value })
                  }
                  placeholder='Enter opponent name'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                />
              </div>
            </div>
          </div>

          {/* League & Season */}
          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              League & Season
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  League *
                </label>
                <select
                  value={gameData.league}
                  onChange={(e) => handleLeagueChange(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                >
                  <option value=''>Select League</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Season
                </label>
                <input
                  type='text'
                  value={gameData.season}
                  onChange={(e) =>
                    setGameData({ ...gameData, season: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                />
              </div>
            </div>
          </div>

          {/* Date, Time, Location */}
          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              Game Details
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value={gameData.date}
                  onChange={(e) =>
                    setGameData({ ...gameData, date: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Kickoff Time
                </label>
                <input
                  type='time'
                  value={gameData.time}
                  onChange={(e) =>
                    setGameData({ ...gameData, time: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Location
                </label>
                <input
                  type='text'
                  value={gameData.location}
                  onChange={(e) =>
                    setGameData({ ...gameData, location: e.target.value })
                  }
                  placeholder='Field name'
                  className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                />
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              Game Settings
            </h2>
            <div className='bg-gray-50 p-4 rounded-lg space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Number of Periods
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='4'
                    value={gameData.numberOfPeriods}
                    onChange={(e) =>
                      setGameData({
                        ...gameData,
                        numberOfPeriods: parseInt(e.target.value),
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                  />
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Period Length (minutes)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='90'
                    value={gameData.periodLength}
                    onChange={(e) =>
                      setGameData({
                        ...gameData,
                        periodLength: parseInt(e.target.value),
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                  />
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Clock Direction
                  </label>
                  <select
                    value={gameData.clockDirection}
                    onChange={(e) =>
                      setGameData({
                        ...gameData,
                        clockDirection: e.target.value,
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                  >
                    <option value='down'>Count Down</option>
                    <option value='up'>Count Up</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='allowReentry'
                    checked={gameData.allowReentry}
                    onChange={(e) =>
                      setGameData({
                        ...gameData,
                        allowReentry: e.target.checked,
                      })
                    }
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <label
                    htmlFor='allowReentry'
                    className='ml-3 text-sm font-medium text-gray-700'
                  >
                    Allow Player Re-entry
                  </label>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Max Substitutions (0 = Unlimited)
                  </label>
                  <input
                    type='number'
                    min='0'
                    max='20'
                    value={gameData.maxSubstitutions}
                    onChange={(e) =>
                      setGameData({
                        ...gameData,
                        maxSubstitutions: parseInt(e.target.value),
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {gameData.league && (
            <div className='bg-blue-50 border-2 border-blue-200 rounded-lg p-4'>
              <h3 className='font-bold text-blue-900 mb-2'>Game Summary</h3>
              <div className='text-sm text-blue-800 space-y-1'>
                <div>
                  <strong>Matchup:</strong> {gameData.homeTeam} vs{" "}
                  {gameData.awayTeam}
                </div>
                <div>
                  <strong>Format:</strong> {gameData.numberOfPeriods} periods ×{" "}
                  {gameData.periodLength} minutes
                </div>
                <div>
                  <strong>Clock:</strong> Counting{" "}
                  {gameData.clockDirection === "down" ? "Down" : "Up"}
                </div>
                <div>
                  <strong>Substitutions:</strong>{" "}
                  {gameData.maxSubstitutions === 0
                    ? "Unlimited"
                    : `Max ${gameData.maxSubstitutions}`}{" "}
                  {gameData.allowReentry
                    ? "(Re-entry allowed)"
                    : "(No re-entry)"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-4 mt-8'>
          <button
            onClick={() => window.history.back()}
            className='flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!gameData.awayTeam || !gameData.league}
            className={`flex-1 py-4 rounded-xl font-bold transition-all ${
              gameData.awayTeam && gameData.league
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue to Period 1 Lineup
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;

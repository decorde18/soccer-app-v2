"use client";

import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";

function LineupFooter() {
  const { id, teamSeasonId } = useParams();
  const players = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);
  const router = useRouter();

  const canStartPeriod = () => {
    return (
      players.filter((p) => p.gameStatus === "starter").length ===
        game.settings.playersOnField - 1 &&
      players.find((p) => p.gameStatus === "goalkeeper")
    );
  };
  const handleStartPeriod = () => {
    router.push(`/gamestats/${teamSeasonId}/${id}/live`);
  };

  return (
    <div className='flex gap-4 mt-6'>
      <button
        onClick={() => window.history.back()}
        className='flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all'
      >
        Back
      </button>
      <button
        onClick={handleStartPeriod}
        disabled={!canStartPeriod()}
        className={`flex-1 py-4 rounded-xl font-bold transition-all ${
          canStartPeriod()
            ? "bg-success text-white hover:bg-green-600"
            : "bg-muted text-gray-500 cursor-not-allowed"
        }`}
      >
        {canStartPeriod()
          ? `Confirm Lineup`
          : "Select 11 Starters & Goalkeeper"}
      </button>
    </div>
  );
}

export default LineupFooter;

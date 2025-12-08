"use client";

import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import useGameStore from "@/stores/gameStore";
import GameHeader from "@/components/layout/gameLayout/GameHeader";

export default function GameMenuPage() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams();

  const game = useGameStore((s) => s.game);

  const gameStage = useGameStore((s) => s.getGameStage());
  const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);

  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel());

  if (!game) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading game...</p>
        </div>
      </div>
    );
  }

  // Helper to get the correct path based on game stage
  const getGamePath = () => {
    const basePath = `/gamestats/${teamSeasonId}/${id}`;

    switch (gameStage) {
      case GAME_STAGES.BEFORE_START:
        return basePath;
      case GAME_STAGES.DURING_PERIOD:
      case GAME_STAGES.IN_STOPPAGE:
        return `${basePath}/live`;
      case GAME_STAGES.BETWEEN_PERIODS:
        return `${basePath}/period-break`;
      case GAME_STAGES.END_GAME:
        return `${basePath}/summary`;
      default:
        return basePath;
    }
  };

  // Get stage-specific information
  const getStageInfo = () => {
    switch (gameStage) {
      case GAME_STAGES.BEFORE_START:
        return {
          title: "Pre-Game",
          subtitle: "Game has not started yet",
          color: "from-yellow-500 to-orange-500",
          buttons: [
            {
              label: "View Lineup",
              path: `/gamestats/${teamSeasonId}/${id}/lineup`,
              variant: "primary",
            },
            {
              label: "Game Settings",
              path: `/gamestats/${teamSeasonId}/${id}/settings`,
              variant: "secondary",
            },
            {
              label: "Start Game",
              path: `/gamestats/${teamSeasonId}/${id}/live`,
              variant: "success",
            },
          ],
        };
      case GAME_STAGES.DURING_PERIOD:
        return {
          title: getCurrentPeriodLabel,
          subtitle: "Game in progress",
          color: "from-green-500 to-emerald-500",
          buttons: [
            {
              label: "Return to Game",
              path: getGamePath(),
              variant: "primary",
            },
            {
              label: "Live Stats",
              path: `/gamestats/${teamSeasonId}/${id}/stats`,
              variant: "secondary",
            },
            {
              label: "Game Settings",
              path: `/gamestats/${teamSeasonId}/${id}/settings`,
              variant: "secondary",
            },
            {
              label: "Manual Game Management",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.BETWEEN_PERIODS:
        return {
          title: "Period Break",
          subtitle: `Between periods`,
          color: "from-blue-500 to-cyan-500",
          buttons: [
            {
              label: "Return to Break",
              path: getGamePath(),
              variant: "primary",
            },
            {
              label: "View Stats",
              path: `/games/${id}/stats`,
              variant: "secondary",
            },
            {
              label: "Start Next Period",
              path: `/games/${id}/live`,
              variant: "success",
            },
            {
              label: "Manual Game Management",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.IN_STOPPAGE:
        return {
          title: "Stoppage",
          subtitle: "Game temporarily stopped",
          color: "from-orange-500 to-red-500",
          buttons: [
            {
              label: "Return to Game",
              path: getGamePath(),
              variant: "primary",
            },
            {
              label: "Live Stats",
              path: `/games/${id}/stats`,
              variant: "secondary",
            },
            {
              label: "Manual Game Management",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.END_GAME:
        return {
          title: "Game Complete",
          subtitle: "Final whistle",
          color: "from-gray-600 to-gray-800",
          buttons: [
            {
              label: "Game Summary",
              path: `/gamestats/${teamSeasonId}/${id}/summary`,
              variant: "primary",
            },

            {
              label: "Manual Game Management",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              variant: "secondary",
            },
          ],
        };
      default:
        return {
          title: "Game Menu",
          subtitle: "Select an option",
          color: "from-gray-500 to-gray-700",
          buttons: [],
        };
    }
  };

  const stageInfo = getStageInfo();
  const isHome = teamSeasonId === game.home_team_season_id;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center'>
          {/* Header Card */}
          <h1 className='text-4xl font-bold mb-2'>{stageInfo.title}</h1>
          <p className='text-muted text-lg mb-4'>{stageInfo.subtitle}</p>
          <GameHeader gameDetails={game} />
        </div>

        {/* Action Buttons Card */}
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-6'>
            Quick Actions
          </h2>

          <div className='space-y-4'>
            {stageInfo.buttons.map((button, index) => (
              <Button
                key={index}
                onClick={() => router.push(button.path)}
                variant={button.variant}
                className='w-full py-4 text-lg font-semibold'
              >
                {button.label}
              </Button>
            ))}
          </div>

          {/* Additional Info */}
          <div className='mt-8 pt-6 border-t border-gray-200'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-600 mb-1'>Game Format</p>
                <p className='font-semibold text-gray-800'>
                  {game.settings.periodCount} Periods ×{" "}
                  {game.settings.periodDuration / 60} min
                </p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-600 mb-1'>Clock Direction</p>
                <p className='font-semibold text-gray-800 capitalize'>
                  {game.settings.clockDirection}
                </p>
              </div>
              {game.settings.hasOvertime && (
                <>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-gray-600 mb-1'>Overtime</p>
                    <p className='font-semibold text-gray-800'>
                      {game.settings.overtimePeriods} ×{" "}
                      {game.settings.overtimeDuration / 60} min
                    </p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-gray-600 mb-1'>Shootout</p>
                    <p className='font-semibold text-gray-800'>
                      {game.settings.hasShootout ? "Yes" : "No"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Back to Games List */}
          <div className='mt-6'>
            <button
              onClick={() => router.push("/games")}
              className='w-full text-center text-gray-600 hover:text-gray-800 py-3 transition-colors text-sm font-medium'
            >
              ← Back to Games List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useParams } from "next/navigation";
import { 
  Play, 
  Settings, 
  BarChart2, 
  Users, 
  Clock, 
  Calendar, 
  Shield, 
  Zap,
  ChevronRight,
  ClipboardList,
  PauseCircle,
  StopCircle,
  RotateCcw
} from "lucide-react";

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
      <div className='flex items-center justify-center min-h-screen bg-slate-50'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          <p className='text-gray-500 font-medium'>Loading game data...</p>
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
          subtitle: "Get ready for the match",
          statusColor: "bg-amber-500",
          accentColor: "from-amber-500 to-orange-600",
          icon: <Calendar className="w-8 h-8 text-white" />,
          actions: [
            {
              label: "Start Game",
              subLabel: "Begin the match clock",
              path: `/gamestats/${teamSeasonId}/${id}/live`,
              icon: <Play className="w-6 h-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Edit Lineup",
              subLabel: "Set starting players",
              path: `/gamestats/${teamSeasonId}/${id}/lineup`,
              icon: <Users className="w-6 h-6" />,
              variant: "secondary",
            },
            {
              label: "Settings",
              subLabel: "Configure rules",
              path: `/gamestats/${teamSeasonId}/${id}/settings`,
              icon: <Settings className="w-6 h-6" />,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.DURING_PERIOD:
        return {
          title: getCurrentPeriodLabel,
          subtitle: "Match in progress",
          statusColor: "bg-emerald-500",
          accentColor: "from-emerald-500 to-teal-600",
          icon: <Zap className="w-8 h-8 text-white" />,
          actions: [
            {
              label: "Go to Live Game",
              subLabel: "Track stats & events",
              path: getGamePath(),
              icon: <ActivityIcon className="w-6 h-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Live Stats",
              subLabel: "View real-time data",
              path: `/gamestats/${teamSeasonId}/${id}/stats`,
              icon: <BarChart2 className="w-6 h-6" />,
              variant: "secondary",
            },
            {
              label: "Management",
              subLabel: "Refs, clock & more",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              icon: <ClipboardList className="w-6 h-6" />,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.BETWEEN_PERIODS:
        return {
          title: "Period Break",
          subtitle: "Halftime / Intermission",
          statusColor: "bg-blue-500",
          accentColor: "from-blue-500 to-indigo-600",
          icon: <PauseCircle className="w-8 h-8 text-white" />,
          actions: [
            {
              label: "Start Next Period",
              subLabel: "Resume the action",
              path: `/gamestats/${teamSeasonId}/${id}/live`,
              icon: <Play className="w-6 h-6" />,
              variant: "primary",
              span: "col-span-2",
            },
             {
              label: "Period Stats",
              subLabel: "Review performance",
              path: `/gamestats/${teamSeasonId}/${id}/stats`,
              icon: <BarChart2 className="w-6 h-6" />,
              variant: "secondary",
            },
            {
              label: "Adjust Lineup",
              subLabel: "Make substitutions",
              path: `/gamestats/${teamSeasonId}/${id}/lineup`,
              icon: <Users className="w-6 h-6" />,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.IN_STOPPAGE:
        return {
          title: "Stoppage",
          subtitle: "Game paused",
          statusColor: "bg-rose-500",
          accentColor: "from-rose-500 to-red-600",
          icon: <StopCircle className="w-8 h-8 text-white" />,
          actions: [
             {
              label: "Resume Game",
              subLabel: "Back to action",
              path: getGamePath(),
              icon: <Play className="w-6 h-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Management",
              subLabel: "Fix clock/score",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              icon: <ClipboardList className="w-6 h-6" />,
              variant: "secondary",
            },
            {
              label: "Settings",
              subLabel: "Game options",
              path: `/gamestats/${teamSeasonId}/${id}/settings`,
              icon: <Settings className="w-6 h-6" />,
              variant: "secondary",
            },
          ],
        };
      case GAME_STAGES.END_GAME:
        return {
          title: "Game Over",
          subtitle: "Final Score",
          statusColor: "bg-slate-700",
          accentColor: "from-slate-700 to-slate-900",
          icon: <Shield className="w-8 h-8 text-white" />,
          actions: [
            {
              label: "Game Summary",
              subLabel: "View full report",
              path: `/gamestats/${teamSeasonId}/${id}/summary`,
              icon: <BarChart2 className="w-6 h-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Management",
              subLabel: "Edit final details",
              path: `/gamestats/${teamSeasonId}/${id}/manage`,
              icon: <ClipboardList className="w-6 h-6" />,
              variant: "secondary",
            },
            {
              label: "Restart/Reset",
              subLabel: "Re-open game",
              path: `/gamestats/${teamSeasonId}/${id}/manage`, // Assuming logic implies management can reset
              icon: <RotateCcw className="w-6 h-6" />,
              variant: "outline",
            },
          ],
        };
      default:
        return {
          title: "Game Menu",
          subtitle: "Select an option",
          statusColor: "bg-gray-500",
          accentColor: "from-gray-500 to-gray-700",
          icon: <ActivityIcon className="w-8 h-8 text-white" />,
          actions: [],
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className='min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8'>
      <div className='max-w-4xl mx-auto'>
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
           <div>
              <button 
                onClick={() => router.push("/games")}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Games
              </button>
              <h1 className="text-3xl font-bold text-slate-900">Match Dashboard</h1>
              <p className="text-slate-500">Manage your game from here</p>
           </div>
           
           <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-200`}>
              <div className={`w-3 h-3 rounded-full ${stageInfo.statusColor} animate-pulse`} />
              <span className="font-semibold text-slate-700">{stageInfo.title}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Game Status Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br ${stageInfo.accentColor} relative overflow-hidden`}>
               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
               <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-2xl" />
               
               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner border border-white/20">
                     {stageInfo.icon}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-1">{stageInfo.title}</h2>
                  <p className="text-white/80 mb-6 font-medium">{stageInfo.subtitle}</p>
                  
                  <div className="w-full">
                     <GameHeader className="!bg-white/10 !backdrop-blur-md !border-white/20 !shadow-none !p-3" />
                  </div>
               </div>
            </div>

            {/* Config Summary Cards */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Match Config</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 font-medium">Format</p>
                        <p className="text-sm font-bold text-slate-700">
                           {game.settings.periodCount} × {game.settings.periodDuration / 60} min
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <RotateCcw className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 font-medium">Clock</p>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                           {game.settings.clockDirection}
                        </p>
                     </div>
                  </div>

                  {game.settings.hasOvertime && (
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                           <ActivityIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 font-medium">Overtime</p>
                           <p className="text-sm font-bold text-slate-700">
                              {game.settings.overtimePeriods} × {game.settings.overtimeDuration / 60}m
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Actions Grid */}
          <div className="lg:col-span-2">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
             </h3>
             
             <div className="grid grid-cols-2 gap-4">
                {stageInfo.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(action.path)}
                    className={`${action.span || 'col-span-1'} group text-left p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] border border-slate-100 shadow-sm hover:shadow-md
                      ${action.variant === 'primary' 
                        ? 'bg-white hover:border-primary/30' 
                        : 'bg-white hover:border-slate-300'
                      }`}
                  >
                     <div className="flex items-start justify-between mb-3">
                        <div className={`p-3 rounded-xl transition-colors ${
                          action.variant === 'primary'
                            ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                           {action.icon}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                     </div>
                     
                     <h4 className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">
                        {action.label}
                     </h4>
                     <p className="text-sm text-slate-500 mt-1">
                        {action.subLabel}
                     </p>
                  </button>
                ))}
             </div>

             {/* Additional Help / Context */}
             <div className="mt-8 bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit">
                   <Shield className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="font-bold text-blue-900 text-sm">Need Help?</h4>
                   <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                      Make sure your lineup is set before starting the game. You can always adjust settings or fix clock issues in the "Game Management" section.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Fallback icon
function ActivityIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

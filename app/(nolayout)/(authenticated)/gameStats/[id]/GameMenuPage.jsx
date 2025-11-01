"use client";

import Button from "@/components/ui/Button";
import { useGame } from "@/contexts/GameLiveContext";

import { usePathname, useRouter } from "next/navigation";

import { useState } from "react";

export default function GameMenuPage() {
  const { gameId } = useGame();
  const router = useRouter();
  const pathname = usePathname();
  const [gameState, setGameState] = useState("not_started"); // Options: 'not_started', 'in_progress', 'suspended', 'ended'

  //TODO
  // useEffect(()=>{
  // const gameStatus= ()=> LOGIC HERE
  // setGameState(gameStatus)},[])

  //TODO create proper pathnames below
  //TODO change styling/info to look better

  const renderButtons = () => {
    switch (gameState) {
      case "not_started":
        return (
          <>
            <Button onClick={() => router.push(`${pathname}/lineup`)}>
              See Game Lineup
            </Button>
            <Button onClick={() => router.push(`${pathname}/settings`)}>
              Game Settings
            </Button>
          </>
        );
      case "in_progress":
        return (
          <>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Return to Game
            </Button>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Live Stats
            </Button>
            <Button onClick={() => router.push(`${pathname}/settings`)}>
              Game Settings
            </Button>
          </>
        );
      case "suspended":
        return (
          <>
            <Button disabled>Game Suspended</Button>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Resume Game
            </Button>
            <Button onClick={() => router.push(`${pathname}/settings`)}>
              Game Settings
            </Button>
          </>
        );
      case "ended":
        return (
          <>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Game Summary
            </Button>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Final Stats
            </Button>
            <Button onClick={() => router.push(`${pathname}/somewhere`)}>
              Highlights
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className='max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow'>
      <h1 className='text-2xl font-bold mb-4'>Game #{gameId}</h1>
      <div className='space-y-3'>{renderButtons()}</div>
    </div>
  );
}

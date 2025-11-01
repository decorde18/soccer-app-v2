"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useGame } from "@/contexts/GameLiveContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function LiveGameModal() {
  const router = useRouter();
  const {
    game,
    startGame,
    endPeriod,
    startNextPeriod,
    startStoppage,
    endStoppage,
    gameStage,
  } = useGame();

  const [isOpen, setIsOpen] = useState("empty");
  //   BEFORE_START: "before_start",
  // DURING_PERIOD: "during_period",
  // BETWEEN_PERIODS: "between_periods",
  // IN_STOPPAGE: "in_stoppage",
  // END_GAME: "end_game",
  const modalType = [
    {
      id: "empty",
      title: "Loading Game",
      caption: "Please Wait While Game Loads",
      buttons: [],
    },
    {
      id: "before_start",
      title: "Game Start",
      caption: "Press start when game starts",
      size: "lg",
      buttons: [
        {
          variant: "primary",
          caption: "Start Game",
          action: () => {
            startGame();
            setIsOpen(false);
          },
        },
        {
          variant: "success",
          caption: "Change Lineup",
          action: () => console.log("Change Lineup"),
        },
      ],
    },
    {
      id: "between_periods",
      title: "Begin Period",
      caption: "Press start when period stats",
      size: "lg",
      buttons: [
        {
          variant: "primary",
          caption: "Start Period",
          action: () => {
            startNextPeriod();
            setIsOpen(false);
          },
        },
        {
          variant: "muted",
          caption: "Postpone Game",
          action: () => console.log("Postpone Game"),
        },
        {
          variant: "danger",
          caption: "End Game",
          action: () => console.log("End Game"),
        },
      ],
    },
    {
      id: "in_stoppage",
      title: "Stoppage",
      caption: "Press resume when the stoppage is over",
      size: "full",

      buttons: [
        {
          variant: "primary",
          caption: "Resume Game",
          action: () => console.log("Resume Game"),
        },
        {
          variant: "muted",
          caption: "Postpone Game",
          action: () => console.log("Postpone Game"),
        },
        {
          variant: "danger",
          caption: "End Game",
          action: () => console.log("End Game"),
        },
      ],
    },

    {
      id: "in_stoppage",
      title: "Stoppage",
      caption: "Press resume when the stoppage is over",
      size: "full",

      buttons: [
        {
          variant: "primary",
          caption: "Resume Game",
          action: () => console.log("Resume Game"),
        },
        {
          variant: "muted",
          caption: "Postpone Game",
          action: () => console.log("Postpone Game"),
        },
        {
          variant: "danger",
          caption: "End Game",
          action: () => console.log("End Game"),
        },
      ],
    },
    {
      id: 4,
      title: "Substitution Holding Area",
      caption: "THIS IS WHERE THE CURRENT SUBS WILL GO",
      size: "full",

      buttons: [
        {
          variant: "primary",
          caption: "Enter All Subs",
          action: () => console.log("Enter All Subs"),
        },
        {
          variant: "danger",
          caption: "Cancel All Sub",
          action: () => console.log("Cancel All Sub"),
        },
      ],
    },
  ];
  useEffect(() => {
    if (gameStage === "end_game") {
      // Navigate away when game ends
      router.push(`/gameStats/${game.id}/summary`);
      setIsOpen("empty");
      return;
    }

    // Update modal state for all other stages
    const shouldBeOpen = gameStage !== "during_period" ? gameStage : null;
    setIsOpen(shouldBeOpen);
  }, [gameStage, game.id, router]);

  return (
    isOpen && (
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={modalType.find((type) => type.id === isOpen).title}
        size={modalType.find((type) => type.id === isOpen).size}
        footer={modalType
          .find((type) => type.id === isOpen)
          .buttons.map((btn, id) => (
            <Button key={id} variant={btn.variant} onClick={btn.action}>
              {btn.caption}
            </Button>
          ))}
      >
        <p>{modalType.find((type) => type.id === isOpen).caption}</p>
      </Modal>
    )
  );
}

export default LiveGameModal;

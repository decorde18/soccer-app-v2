"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useGame } from "@/contexts/GameLiveContext";
import { useState } from "react";

function LiveGameModal() {
  const { game, startPeriod } = useGame();
  const [isOpen, setIsOpen] = useState(2);
  const modalType = [
    {
      id: 1,
      title: "Game Start",
      caption: "Press start when game starts",
      size: "lg",
      buttons: [
        {
          variant: "primary",
          caption: "Start Game",
          action: () => console.log("Start Game"),
        },
        {
          variant: "success",
          caption: "Change Lineup",
          action: () => console.log("Change Lineup"),
        },
      ],
    },
    {
      id: 2,
      title: "Begin Period",
      caption: "Press start when period stats",
      size: "lg",
      buttons: [
        {
          variant: "primary",
          caption: "Start Period",
          action: () => {
            startPeriod();
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
      id: 3,
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
  ];
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

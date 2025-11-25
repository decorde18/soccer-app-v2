"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Form from "@/components/ui/Form";
import { toDateInputValue, toTimeInputValue } from "@/lib/dateTimeUtils";

export default function GameModal({ isOpen, onClose, onSave, game }) {
  const [formData, setFormData] = useState({
    game_date: "",
    game_time: "",
    opponent: "",
    location: "",
    home_away: "home",
    score_us: "",
    score_them: "",
    status: "scheduled",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only populate form when modal opens
    if (!isOpen) return;
    if (game) {
      setFormData({
        game_date: toDateInputValue(game.game_date || game.start_date) || "",
        game_time: toTimeInputValue(game.game_time || game.start_time) || "",
        opponent: game.opponent || "",
        location: game.location || game.location_name || "",
        home_away: game.home_away || "home",
        score_us: game.score_us ?? "",
        score_them: game.score_them ?? "",
        status: game.status || "scheduled",
      });
    } else {
      // Adding new game - clear all fields
      setFormData({
        game_date: "",
        game_time: "",
        opponent: "",
        location: "",
        home_away: "home",
        score_us: "",
        score_them: "",
        status: "scheduled",
        //todo don't forget end_time, end_date
      });
    }
  }, [isOpen, game]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Convert empty strings to null for scores
      const dataToSave = {
        ...formData,
        score_us: formData.score_us === "" ? null : parseInt(formData.score_us),
        score_them:
          formData.score_them === "" ? null : parseInt(formData.score_them),
      };
      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "game_date",
      label: "Game Date",
      type: "date",
      required: true,
    },
    {
      name: "game_time",
      label: "Game Time",
      type: "time",
      required: true,
    },
    {
      name: "opponent",
      label: "Opponent",
      type: "text",
      placeholder: "Enter opponent name",
      required: true,
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "Enter game location",
      required: true,
    },
    {
      name: "home_away",
      label: "Home/Away",
      type: "select",
      required: true,
      options: [
        { value: "home", label: "Home" },
        { value: "away", label: "Away" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "scheduled", label: "Scheduled" },
        { value: "completed", label: "Completed" },
        { value: "canceled", label: "Canceled" },
      ],
    },
    {
      name: "score_us",
      label: "Our Score",
      type: "number",
      min: 0,
      placeholder: "Leave empty if not played",
      helperText: "Only enter if game has been played",
    },
    {
      name: "score_them",
      label: "Opponent Score",
      type: "number",
      min: 0,
      placeholder: "Leave empty if not played",
      helperText: "Only enter if game has been played",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={game ? "Edit Game" : "Add Game"}
      size='lg'
    >
      <Form
        fields={fields}
        data={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isEditing={!!game}
        loading={loading}
        submitText={game ? "Update Game" : "Add Game"}
      />
    </Modal>
  );
}

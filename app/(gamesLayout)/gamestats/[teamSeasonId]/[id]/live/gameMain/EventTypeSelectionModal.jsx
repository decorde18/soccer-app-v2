"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

/**
 * EventTypeSelectionModal - First step in event recording
 * User selects event type and whether clock should stop
 * Then proceeds to LiveGameModal for detailed event recording
 */
function EventTypeSelectionModal({ isOpen, onClose, onEventTypeSelected }) {
  const [stopClock, setStopClock] = useState(true);

  const eventTypes = [
    { value: "goal", label: "Goal", variant: "success", icon: "⚽" },
    {
      value: "discipline",
      label: "Card/Discipline",
      variant: "danger",
      icon: "🟨",
    },
    { value: "penalty", label: "Penalty Kick", variant: "warning", icon: "📍" },
    { value: "injury", label: "Injury", variant: "outline", icon: "🩹" },
    {
      value: "weather",
      label: "Weather Delay",
      variant: "outline",
      icon: "⛈️",
    },
    {
      value: "equipment",
      label: "Equipment Issue",
      variant: "outline",
      icon: "🔧",
    },
    { value: "var", label: "VAR Review", variant: "outline", icon: "📹" },
    { value: "other", label: "Other Stoppage", variant: "outline", icon: "⏸️" },
  ];

  const handleEventTypeClick = (eventType) => {
    onEventTypeSelected(eventType, stopClock);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='What Happened?' size='md'>
      <div className='space-y-6'>
        {/* Stop Clock Toggle */}
        <div className='bg-surface p-4 rounded-lg border border-border'>
          <div className='flex items-center justify-between'>
            <div>
              <label className='text-sm font-semibold text-text'>
                Stop Game Clock?
              </label>
              <p className='text-xs text-muted mt-1'>
                Choose whether the clock should stop for this event
              </p>
            </div>
            <button
              onClick={() => setStopClock(!stopClock)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                stopClock ? "bg-success" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  stopClock ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Event Type Grid */}
        <div>
          <label className='block text-sm font-semibold text-text mb-3'>
            Select Event Type
          </label>
          <div className='grid grid-cols-2 gap-3'>
            {eventTypes.map((type) => (
              <Button
                key={type.value}
                onClick={() => handleEventTypeClick(type.value)}
                variant={type.variant}
                className='h-20 flex flex-col items-center justify-center gap-2 text-base'
              >
                <span className='text-2xl'>{type.icon}</span>
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Info Message */}
        <div className='bg-blue-50 border border-blue-200 p-3 rounded-lg'>
          <p className='text-xs text-blue-800'>
            <strong>Note:</strong> After selecting an event type, you'll be able
            to enter detailed information and manage the game clock.
          </p>
        </div>

        {/* Cancel Button */}
        <Button onClick={onClose} variant='outline' className='w-full'>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export default EventTypeSelectionModal;

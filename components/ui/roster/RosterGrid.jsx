"use client";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RosterGrid({
  players,
  teamSeasonId,
  // Optional admin props
  onEdit,
  onDelete,
  showActions = false,
}) {
  if (!players || players.length === 0) {
    return (
      <Card className='text-center'>
        <p className='text-muted'>No players on the roster yet.</p>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {players.map((player) => {
        // Player header with jersey number
        const playerHeader = (
          <div className='flex items-center gap-3'>
            <span className='text-3xl font-bold text-primary'>
              #{player.jersey_number}
            </span>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-text'>
                {player.first_name} {player.last_name}
              </h3>
              {player.position && (
                <span className='text-sm text-muted'>{player.position}</span>
              )}
            </div>
          </div>
        );

        // Player body with additional info
        const playerBody = (
          <div className='space-y-2'>
            {player.email && (
              <p className='text-sm text-muted flex items-center gap-2'>
                <span>📧</span>
                <span>{player.email}</span>
              </p>
            )}
            {player.phone && (
              <p className='text-sm text-muted flex items-center gap-2'>
                <span>📱</span>
                <span>{player.phone}</span>
              </p>
            )}
            {player.grade && (
              <p className='text-sm text-muted'>
                <span className='font-medium'>Grade:</span> {player.grade}
              </p>
            )}
            {player.school && (
              <p className='text-sm text-muted'>
                <span className='font-medium'>School:</span> {player.school}
              </p>
            )}
          </div>
        );

        // Optional admin actions footer
        const playerFooter =
          showActions && onEdit && onDelete ? (
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onEdit(player)}
              >
                Edit
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onDelete(player.id || player.player_id)}
                className='text-danger hover:bg-danger/10'
              >
                Remove
              </Button>
            </div>
          ) : undefined;

        return (
          <Card
            key={player.id || player.player_id}
            header={playerHeader}
            footer={playerFooter}
            variant='hover'
          >
            {playerBody}
          </Card>
        );
      })}
    </div>
  );
}

import { Card } from "../Card";

// Stat Leaders Card Component
function StatLeadersCard({ statLeaders }) {
  if (!statLeaders) {
    return (
      <Card variant='outlined' padding='md' className='h-full'>
        <div className='flex items-center gap-3 mb-4'>
          <span className='text-3xl'>⭐</span>
          <h3 className='font-semibold text-lg text-text'>Team Leaders</h3>
        </div>
        <div className='text-center text-muted py-8'>
          <p className='text-sm'>No stats available</p>
        </div>
      </Card>
    );
  }

  const statCategories = [
    {
      key: "goals",
      label: "Goals",
      icon: "⚽",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      key: "assists",
      label: "Assists",
      icon: "🎯",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      key: "clean_sheets",
      label: "Clean Sheets",
      icon: "🧤",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <Card
      variant='hover'
      shadow
      padding='md'
      title='Team Leaders'
      icon='⭐'
      className='h-full'
    >
      <div className='space-y-3'>
        {statCategories.map((category) => {
          const leader = statLeaders[category.key];
          if (!leader) return null;

          return (
            <div
              key={category.key}
              className='p-3 bg-surface rounded-lg border border-border hover:border-primary/30 transition'
            >
              <div className='flex items-center gap-3'>
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center text-xl`}
                >
                  {category.icon}
                </div>

                {/* Player Info */}
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium text-text truncate'>
                    {leader.player_name}
                  </div>
                  <div className='text-xs text-muted'>{category.label}</div>
                </div>

                {/* Stat Value */}
                <div className={`text-2xl font-bold ${category.color}`}>
                  {leader.value}
                </div>
              </div>
            </div>
          );
        })}

        {/* Optional: Total Team Stats Summary */}
        {statLeaders.team_totals && (
          <div className='mt-4 pt-3 border-t border-border'>
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div>
                <div className='text-lg font-bold text-text'>
                  {statLeaders.team_totals.goals || 0}
                </div>
                <div className='text-xs text-muted'>Total Goals</div>
              </div>
              <div>
                <div className='text-lg font-bold text-text'>
                  {statLeaders.team_totals.assists || 0}
                </div>
                <div className='text-xs text-muted'>Total Assists</div>
              </div>
              <div>
                <div className='text-lg font-bold text-text'>
                  {statLeaders.team_totals.clean_sheets || 0}
                </div>
                <div className='text-xs text-muted'>Clean Sheets</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatLeadersCard;

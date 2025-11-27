// components/ui/game-form/GameLocation.jsx
export function GameLocation({
  data,
  onChange,
  locations,
  sublocations,
  onAddLocation,
}) {
  const filteredSublocations = sublocations.filter((sub) =>
    data.location_id ? sub.location_id === data.location_id : false
  );

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Location</h3>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Venue <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-2'>
          <select
            value={data.location_id || ""}
            onChange={(e) =>
              onChange(
                "location_id",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            required
            className='flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value=''>Select venue...</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_name}
              </option>
            ))}
          </select>
          <button
            type='button'
            onClick={onAddLocation}
            className='px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors'
            title='Add new location'
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Field / Court</label>
        <select
          value={data.sublocation_id || ""}
          onChange={(e) =>
            onChange(
              "sublocation_id",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          disabled={!data.location_id}
          className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/10 disabled:cursor-not-allowed'
        >
          <option value=''>
            {data.location_id
              ? "Select field (optional)..."
              : "Select a venue first"}
          </option>
          {filteredSublocations.map((sub) => (
            <option key={sub.sublocation_id} value={sub.sublocation_id}>
              {sub.sublocation_name}
            </option>
          ))}
        </select>
        {data.location_id && filteredSublocations.length === 0 && (
          <p className='text-xs text-muted mt-1'>
            No fields available for this venue
          </p>
        )}
      </div>
    </div>
  );
}

// components/ui/game-form/GameBasicInfo.jsx
export function GameBasicInfo({ data, onChange }) {
  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-lg mb-3'>Game Details</h3>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Game Date <span className='text-accent'>*</span>
          </label>
          <input
            type='date'
            value={data.start_date || ""}
            onChange={(e) => onChange("start_date", e.target.value)}
            required
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Game Time</label>
          <input
            type='time'
            value={data.start_time || ""}
            onChange={(e) => onChange("start_time", e.target.value)}
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Time Zone <span className='text-accent'>*</span>
          </label>
          <select
            value={data.timezone_label || "CDT"}
            onChange={(e) => onChange("timezone_label", e.target.value)}
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='CDT'>CDT</option>
            <option value='CST'>CST</option>
            <option value='EDT'>EDT</option>
            <option value='EST'>EST</option>
            <option value='MDT'>MDT</option>
            <option value='MST'>MST</option>
            <option value='PDT'>PDT</option>
            <option value='PST'>PST</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>
            Game Type <span className='text-accent'>*</span>
          </label>
          <select
            value={data.game_type || "league"}
            onChange={(e) => onChange("game_type", e.target.value)}
            required
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
          >
            <option value='league'>League</option>
            <option value='tournament'>Tournament</option>
            <option value='playoff'>Playoff</option>
            <option value='friendly'>Friendly</option>
            <option value='scrimmage'>Scrimmage</option>
            <option value='exhibition'>Exhibition</option>
          </select>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>
          Home/Away <span className='text-accent'>*</span>
        </label>
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={() => onChange("home_away", "home")}
            className={`flex-1 py-2 px-4 rounded-md border-2 transition-all ${
              data.home_away === "home"
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border hover:border-primary/50"
            }`}
          >
            Home
          </button>
          <button
            type='button'
            onClick={() => onChange("home_away", "away")}
            className={`flex-1 py-2 px-4 rounded-md border-2 transition-all ${
              data.home_away === "away"
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border hover:border-primary/50"
            }`}
          >
            Away
          </button>
        </div>
      </div>
    </div>
  );
}

// app/teams/[teamSeasonId]/(teamAccess)/events/page.jsx
import { getCurrentUser, checkServerTeamAccess } from "@/lib/serverAuth";

export default async function EventsPage({ params }) {
  const { teamSeasonId } = await params;

  // Get user and access (guaranteed by layout)
  const user = await getCurrentUser();
  const access = await checkServerTeamAccess(teamSeasonId, user);

  const events = [
    {
      id: 101,
      event_name: "Training Session",
      event_type: "Practice",
      event_date: "2025-03-12",
      start_time: "17:00:00",
      end_time: "18:30:00",
      location: "Main Field",
      notes: "Focus on possession and quick transitions",
    },
    {
      id: 102,
      event_name: "Fitness & Agility",
      event_type: "Workout",
      event_date: "2025-03-11",
      start_time: "16:30:00",
      end_time: "17:30:00",
      location: "Gym",
      notes: "SAQ ladder work + core circuit",
    },
    {
      id: 103,
      event_name: "League Match vs Wolves SC",
      event_type: "Game",
      event_date: "2025-03-09",
      start_time: "14:00:00",
      end_time: "15:30:00",
      location: "Wolves SC Complex",
      notes: "Arrive 45 min early for warmup",
    },
    {
      id: 104,
      event_name: "Film Review",
      event_type: "Meeting",
      event_date: "2025-03-08",
      start_time: "18:00:00",
      end_time: "19:00:00",
      location: "Team Room",
      notes: "Analyze defensive shape from previous match",
    },
    {
      id: 105,
      event_name: "Tactical Walkthrough",
      event_type: "Practice",
      event_date: "2025-03-07",
      start_time: "17:30:00",
      end_time: "18:30:00",
      location: "Aux Field",
      notes: null,
    },
    {
      id: 106,
      event_name: "Scrimmage vs 14U Boys",
      event_type: "Scrimmage",
      event_date: "2025-03-05",
      start_time: "17:00:00",
      end_time: "18:30:00",
      location: "Main Field",
      notes: "High-tempo; no more than 3 touches",
    },
    {
      id: 107,
      event_name: "Team Dinner",
      event_type: "Social",
      event_date: "2025-03-04",
      start_time: "19:00:00",
      end_time: "20:30:00",
      location: "Luigi’s Pizza",
      notes: "Parents invited",
    },
    {
      id: 108,
      event_name: "League Match vs Rangers FC",
      event_type: "Game",
      event_date: "2025-03-02",
      start_time: "13:00:00",
      end_time: "14:30:00",
      location: "Home Field",
      notes: "White jerseys",
    },
    {
      id: 109,
      event_name: "Goalkeeping Training",
      event_type: "Practice",
      event_date: "2025-03-01",
      start_time: "16:00:00",
      end_time: "17:00:00",
      location: "GK Area",
      notes: "Footwork + handling",
    },
    {
      id: 110,
      event_name: "Parent Meeting",
      event_type: "Meeting",
      event_date: "2025-02-28",
      start_time: "18:00:00",
      end_time: "18:45:00",
      location: "Classroom A1",
      notes: "Discuss spring tournament schedule",
    },
  ];

  return (
    <div className='p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold'>Team Events</h1>
          {access.can_edit && (
            <a
              href={`/teams/${teamSeasonId}/manage/events/new`}
              className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              + Add Event
            </a>
          )}
        </div>

        {events.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center text-gray-500'>
            No events scheduled yet.
          </div>
        ) : (
          <div className='space-y-4'>
            {events.map((event) => (
              <div
                key={event.id}
                className='bg-white rounded-lg shadow p-6 hover:shadow-md transition'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='text-lg font-semibold'>
                      {event.event_name}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      {event.event_type}
                    </p>
                  </div>
                  <span className='px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded'>
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </div>

                {event.location && (
                  <p className='mt-3 text-gray-700'>📍 {event.location}</p>
                )}

                {event.start_time && (
                  <p className='mt-2 text-gray-600'>
                    🕐 {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </p>
                )}

                {event.notes && (
                  <p className='mt-3 text-gray-600 text-sm'>{event.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

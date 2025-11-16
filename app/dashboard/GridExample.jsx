import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useMemo, useState, useEffect } from "react";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);
// Mock data
const mockStandingsData = [
  {
    position: 1,
    team_name: "Manchester City",
    team_season_id: 1,
    logo_url:
      "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/manchester-city.png",
    matches_played: 38,
    wins: 28,
    draws: 7,
    losses: 3,
    goals_for: 94,
    goals_against: 33,
    goal_difference: 61,
    points: 91,
  },
  {
    position: 2,
    team_name: "Arsenal",
    team_season_id: 2,
    logo_url: "https://share.google/images/Abi1xbcZzRL3hWcnE",
    matches_played: 38,
    wins: 26,
    draws: 6,
    losses: 6,
    goals_for: 88,
    goals_against: 43,
    goal_difference: 45,
    points: 84,
  },
  {
    position: 3,
    team_name: "Liverpool",
    team_season_id: 3,
    logo_url:
      "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/liverpool.png",
    matches_played: 38,
    wins: 24,
    draws: 10,
    losses: 4,
    goals_for: 86,
    goals_against: 41,
    goal_difference: 45,
    points: 82,
  },
  {
    position: 4,
    team_name: "Aston Villa",
    team_season_id: 4,
    logo_url: null,
    matches_played: 38,
    wins: 20,
    draws: 8,
    losses: 10,
    goals_for: 76,
    goals_against: 61,
    goal_difference: 15,
    points: 68,
  },
  {
    position: 5,
    team_name: "Tottenham Hotspur",
    team_season_id: 5,
    logo_url: null,
    matches_played: 38,
    wins: 20,
    draws: 6,
    losses: 12,
    goals_for: 74,
    goals_against: 61,
    goal_difference: 13,
    points: 66,
  },
  {
    position: 6,
    team_name: "Chelsea",
    team_season_id: 6,
    logo_url:
      "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/chelsea.png",
    matches_played: 38,
    wins: 18,
    draws: 9,
    losses: 11,
    goals_for: 77,
    goals_against: 63,
    goal_difference: 14,
    points: 63,
  },
  {
    position: 7,
    team_name: "Newcastle United",
    team_season_id: 7,
    logo_url: null,
    matches_played: 38,
    wins: 18,
    draws: 6,
    losses: 14,
    goals_for: 85,
    goals_against: 62,
    goal_difference: 23,
    points: 60,
  },
  {
    position: 8,
    team_name: "Manchester United",
    team_season_id: 8,
    logo_url:
      "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/manchester-united.png",
    matches_played: 38,
    wins: 18,
    draws: 6,
    losses: 14,
    goals_for: 57,
    goals_against: 58,
    goal_difference: -1,
    points: 60,
  },
  {
    position: 9,
    team_name: "West Ham United",
    team_season_id: 9,
    logo_url: null,
    matches_played: 38,
    wins: 14,
    draws: 10,
    losses: 14,
    goals_for: 60,
    goals_against: 74,
    goal_difference: -14,
    points: 52,
  },
  {
    position: 10,
    team_name: "Crystal Palace",
    team_season_id: 10,
    logo_url: null,
    matches_played: 38,
    wins: 13,
    draws: 10,
    losses: 15,
    goals_for: 57,
    goals_against: 58,
    goal_difference: -1,
    points: 49,
  },
  {
    position: 11,
    team_name: "Brighton",
    team_season_id: 11,
    logo_url: null,
    matches_played: 38,
    wins: 12,
    draws: 12,
    losses: 14,
    goals_for: 55,
    goals_against: 62,
    goal_difference: -7,
    points: 48,
  },
  {
    position: 12,
    team_name: "Bournemouth",
    team_season_id: 12,
    logo_url: null,
    matches_played: 38,
    wins: 13,
    draws: 9,
    losses: 16,
    goals_for: 54,
    goals_against: 67,
    goal_difference: -13,
    points: 48,
  },
  {
    position: 13,
    team_name: "Fulham",
    team_season_id: 13,
    logo_url: null,
    matches_played: 38,
    wins: 13,
    draws: 8,
    losses: 17,
    goals_for: 55,
    goals_against: 61,
    goal_difference: -6,
    points: 47,
  },
  {
    position: 14,
    team_name: "Wolverhampton",
    team_season_id: 14,
    logo_url: null,
    matches_played: 38,
    wins: 13,
    draws: 7,
    losses: 18,
    goals_for: 50,
    goals_against: 65,
    goal_difference: -15,
    points: 46,
  },
  {
    position: 15,
    team_name: "Everton",
    team_season_id: 15,
    logo_url: null,
    matches_played: 38,
    wins: 13,
    draws: 9,
    losses: 16,
    goals_for: 40,
    goals_against: 51,
    goal_difference: -11,
    points: 40,
  },
  {
    position: 16,
    team_name: "Brentford",
    team_season_id: 16,
    logo_url: null,
    matches_played: 38,
    wins: 10,
    draws: 9,
    losses: 19,
    goals_for: 56,
    goals_against: 65,
    goal_difference: -9,
    points: 39,
  },
  {
    position: 17,
    team_name: "Nottingham Forest",
    team_season_id: 17,
    logo_url: null,
    matches_played: 38,
    wins: 9,
    draws: 9,
    losses: 20,
    goals_for: 49,
    goals_against: 67,
    goal_difference: -18,
    points: 32,
  },
  {
    position: 18,
    team_name: "Luton Town",
    team_season_id: 18,
    logo_url: null,
    matches_played: 38,
    wins: 6,
    draws: 8,
    losses: 24,
    goals_for: 52,
    goals_against: 85,
    goal_difference: -33,
    points: 26,
  },
  {
    position: 19,
    team_name: "Burnley",
    team_season_id: 19,
    logo_url: null,
    matches_played: 38,
    wins: 5,
    draws: 9,
    losses: 24,
    goals_for: 41,
    goals_against: 78,
    goal_difference: -37,
    points: 24,
  },
  {
    position: 20,
    team_name: "Sheffield United",
    team_season_id: 20,
    logo_url: null,
    matches_played: 38,
    wins: 3,
    draws: 7,
    losses: 28,
    goals_for: 35,
    goals_against: 104,
    goal_difference: -69,
    points: 16,
  },
];

export default function StandingsTable({ leagueId = 1, seasonId = 1 }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch with mock data
    const fetchStandings = async () => {
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setRowData(mockStandingsData);
      } catch (error) {
        console.error("Error fetching standings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId && seasonId) {
      fetchStandings();
    }
  }, [leagueId, seasonId]);

  // Column definitions with custom styling and formatting
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Pos",
        field: "position",
        width: 70,
        pinned: "left",
        cellStyle: (params) => ({
          fontWeight: "bold",
          color:
            params.value <= 3
              ? "#22c55e"
              : params.value >= rowData.length - 2
              ? "#ef4444"
              : "inherit",
        }),
      },
      {
        headerName: "Team",
        field: "team_name",
        flex: 1,
        minWidth: 200,
        pinned: "left",
        cellRenderer: (params) => {
          return (
            <div className='flex items-center gap-2'>
              {params.data.logo_url && (
                <img
                  src={params.data.logo_url}
                  className='w-6 h-6 object-contain'
                  alt=''
                />
              )}
              <span className='font-medium'>{params.value}</span>
            </div>
          );
        },
      },
      {
        headerName: "MP",
        field: "matches_played",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "W",
        field: "wins",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "D",
        field: "draws",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "L",
        field: "losses",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "GF",
        field: "goals_for",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "GA",
        field: "goals_against",
        width: 70,
        type: "numericColumn",
      },
      {
        headerName: "GD",
        field: "goal_difference",
        width: 70,
        type: "numericColumn",
        cellStyle: (params) => ({
          color:
            params.value > 0
              ? "#22c55e"
              : params.value < 0
              ? "#ef4444"
              : "inherit",
        }),
        valueFormatter: (params) =>
          params.value > 0 ? `+${params.value}` : params.value,
      },
      {
        headerName: "Pts",
        field: "points",
        width: 80,
        type: "numericColumn",
        pinned: "right",
        cellStyle: { fontWeight: "bold", fontSize: "16px" },
      },
    ],
    [rowData.length]
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    []
  );

  if (loading) {
    return (
      <div className='text-center py-8 text-gray-500'>Loading standings...</div>
    );
  }

  return (
    <div className='w-full'>
      <div className='ag-theme-alpine' style={{ height: 600, width: "100%" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection='single'
          onRowClicked={(params) => {
            // Navigate to team page on row click
            console.log("Team clicked:", params.data.team_name);
            // window.location.href = `/teams/${params.data.team_season_id}`;
          }}
        />
      </div>

      {/* Custom Styling for Dark Mode Support */}
      <style jsx global>{`
        .ag-theme-alpine {
          --ag-background-color: #ffffff;
          --ag-foreground-color: #000000;
          --ag-border-color: #e5e7eb;
          --ag-header-background-color: #f3f4f6;
          --ag-odd-row-background-color: #ffffff;
          --ag-row-hover-color: rgba(0, 0, 0, 0.05);
        }

        .ag-row {
          cursor: pointer;
        }

        .ag-header-cell-text {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

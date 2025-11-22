// app/teams/[teamSeasonId]/roster/RosterClient.jsx
"use client";

import { useState } from "react";
import { Permissions } from "@/lib/clientPermissions";
import { Plus, Edit, Trash2, Lock } from "lucide-react";
import Link from "next/link";

export default function RosterClient({
  roster,
  access,
  isAuthenticated,
  teamSeasonId,
}) {
  const [players, setPlayers] = useState(roster);

  // ✅ Safe permission checks
  const canManage = access ? Permissions.canManageRoster(access) : false;

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold'>Team Roster</h2>

        {/* ✅ Show different UI based on auth state */}
        {canManage ? (
          <button className='flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
            <Plus className='w-4 h-4' />
            <span>Add Player</span>
          </button>
        ) : !isAuthenticated ? (
          <Link
            href={`/auth/login?redirect=/teams/${teamSeasonId}/roster`}
            className='flex items-center space-x-2 text-gray-500 text-sm'
          >
            <Lock className='w-4 h-4' />
            <span>Sign in to manage roster</span>
          </Link>
        ) : null}
      </div>

      {/* Roster Table */}
      <div className='bg-white rounded-lg border overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase'>
                #
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase'>
                Position
              </th>
              {canManage && (
                <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase'>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className='divide-y'>
            {players.map((player) => (
              <tr key={player.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 font-semibold'>
                  {player.jersey_number}
                </td>
                <td className='px-6 py-4'>
                  {player.first_name} {player.last_name}
                </td>
                <td className='px-6 py-4 text-gray-600'>{player.position}</td>
                {canManage && (
                  <td className='px-6 py-4 text-right space-x-2'>
                    <button className='text-blue-600 hover:text-blue-800'>
                      <Edit className='w-4 h-4' />
                    </button>
                    <button className='text-red-600 hover:text-red-800'>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {players.length === 0 && (
        <div className='text-center py-12 text-gray-500'>
          No players on the roster yet.
        </div>
      )}
    </div>
  );
}

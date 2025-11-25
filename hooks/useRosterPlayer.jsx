import { useState, useCallback } from "react";
import { apiFetch } from "@/app/api/fetcher";

/**
 * Hook for managing roster players
 * Handles creating players and adding them to team rosters
 */
export function useRosterPlayer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Add a player to the roster
   * Creates the player in people table if they don't exist
   * Then adds them to the team_seasons roster
   *
   * @param {number} teamSeasonId - The team season ID
   * @param {Object} playerData - Player information
   * @param {string} playerData.first_name - Player's first name
   * @param {string} playerData.last_name - Player's last name
   * @param {string} playerData.email - Player's email (optional, for lookup)
   * @param {number} playerData.jersey_number - Jersey number
   * @param {string} playerData.position - Player position
   * @param {number} playerData.person_id - Existing person ID (optional)
   * @returns {Promise<Object>} The roster entry
   */
  const addPlayerToRoster = useCallback(async (teamSeasonId, playerData) => {
    try {
      setLoading(true);
      setError(null);

      let personId = playerData.person_id;

      // Step 1: Check if player exists or create new one
      if (!personId) {
        // Check if player exists by email or name
        const existingPerson = await findExistingPerson(
          playerData.first_name,
          playerData.last_name,
          playerData.email
        );

        if (existingPerson) {
          personId = existingPerson.id;
        } else {
          // Create new person
          const newPerson = await apiFetch("people", "POST", {
            first_name: playerData.first_name,
            last_name: playerData.last_name,
            email: playerData.email || null,
          });
          personId = newPerson.id;
        }
      }

      // Step 2: Add player to team roster
      const rosterEntry = await apiFetch("team_seasons", "POST", {
        team_season_id: teamSeasonId,
        person_id: personId,
        jersey_number: playerData.jersey_number,
        position: playerData.position,
      });

      return rosterEntry;
    } catch (err) {
      console.error("Failed to add player to roster:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Find existing person by email or name
   */
  const findExistingPerson = useCallback(async (firstName, lastName, email) => {
    try {
      // First try to find by email if provided
      if (email) {
        const byEmail = await apiFetch("people", "GET", null, null, {
          filters: { email },
          limit: 1,
        });
        if (byEmail && byEmail.length > 0) {
          return byEmail[0];
        }
      }

      // Then try to find by name
      const byName = await apiFetch("people", "GET", null, null, {
        filters: {
          first_name: firstName,
          last_name: lastName,
        },
        limit: 1,
      });

      if (byName && byName.length > 0) {
        return byName[0];
      }

      return null;
    } catch (err) {
      console.error("Error finding person:", err);
      return null;
    }
  }, []);

  /**
   * Update roster entry (jersey number, position, etc.)
   */
  const updateRosterEntry = useCallback(async (rosterEntryId, updates) => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFetch(
        "team_seasons",
        "PATCH",
        updates,
        rosterEntryId
      );
      return result;
    } catch (err) {
      console.error("Failed to update roster entry:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove player from roster
   */
  const removeFromRoster = useCallback(async (rosterEntryId) => {
    try {
      setLoading(true);
      setError(null);

      await apiFetch("team_seasons", "DELETE", null, rosterEntryId);
      return true;
    } catch (err) {
      console.error("Failed to remove from roster:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    addPlayerToRoster,
    updateRosterEntry,
    removeFromRoster,
    findExistingPerson,
  };
}

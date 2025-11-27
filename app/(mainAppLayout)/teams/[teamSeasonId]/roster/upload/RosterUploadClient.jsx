"use client";
import React, { useState } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/app/api/fetcher";
import { toDateInputValue } from "@/lib/dateTimeUtils";

function RosterUpload({ teamSeasonId, canManage }) {
  const [fileData, setFileData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState([]);

  // Helper function to normalize phone numbers
  const normalizePhone = (phone) => {
    if (!phone) return null;
    return phone.replace(/\D/g, "");
  };

  // Parse parent data from row into person object
  const parseParentData = (row, parentNum) => {
    const prefix = `parent${parentNum}`;
    const firstName = row[`${prefix}_first`];
    const lastName = row[`${prefix}_last`];
    const phone = row[`${prefix}_phone`];

    // Only return if we have the essential fields
    if (!firstName || !lastName || !phone) {
      return null;
    }

    return {
      first_name: firstName,
      last_name: lastName,
      email: row[`${prefix}_email`] || null,
      phone: normalizePhone(phone),
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseData(text);
    };
    reader.readAsText(file);
  };

  const handlePasteData = (e) => {
    const text = e.target.value;
    if (text.trim()) {
      parseData(text);
    }
  };

  const parseData = (text) => {
    if (!text || typeof text !== "string") {
      setError("No data provided.");
      return;
    }

    // Split into lines, remove blank lines
    let lines = text
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError("No readable rows found.");
      return;
    }

    // --- Detect delimiter (TSV preferred, fallback to CSV) ---
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    // --- Detect header row (case-insensitive) ---
    const lower = firstLine.toLowerCase();
    const isHeader =
      lower.includes("player_id") ||
      (lower.includes("first_name") && lower.includes("last_name"));

    if (isHeader) {
      lines = lines.slice(1);
    }

    // If no data after removing header
    if (lines.length === 0) {
      setError("No data rows found below header.");
      return;
    }

    // --- Helper: normalize phone ---
    const cleanPhone = (raw) => {
      if (!raw) return "";
      return raw.replace(/\D/g, ""); // digits only
    };

    // --- Helper: normalize date ---
    const cleanDate = (raw) => {
      if (!raw) return "";
      const trimmed = raw.trim();
      // Allow MM/DD/YYYY or YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
      return ""; // invalid date
    };

    const parsed = [];

    lines.forEach((line, rowIndex) => {
      const cols = line.split(delimiter).map((c) => c.trim());

      // Guarantee at least 14 columns
      while (cols.length < 14) cols.push("");

      let player_id_raw = cols[0].trim();
      let player_id = /^\d+$/.test(player_id_raw)
        ? Number(player_id_raw)
        : null;

      const row = {
        player_id,
        first_name: cols[1] || "",
        last_name: cols[2] || "",
        birth_date: cleanDate(cols[3]),
        grade: cols[4] || "",
        jersey_number: cols[5] || "",
        parent1_email: cols[6] || "",
        parent1_first: cols[7] || "",
        parent1_last: cols[8] || "",
        parent1_phone: cleanPhone(cols[9]),
        parent2_email: cols[10] || "",
        parent2_first: cols[11] || "",
        parent2_last: cols[12] || "",
        parent2_phone: cleanPhone(cols[13]),
      };

      parsed.push(row);
    });

    setFileData(parsed);
    setPreview(parsed.slice(0, 5));
    setError("");
  };

  // Check if player exists by ID or by name + DOB
  const findOrCreatePlayer = async (playerData) => {
    const birthDate = toDateInputValue(playerData.birth_date);

    // If player_id provided, fetch and update
    if (playerData.player_id) {
      try {
        const player = await apiFetch("people", "GET", null, null, {
          filters: { id: playerData.player_id },
        });

        if (!player || player.length === 0) {
          throw new Error(`Player ID ${playerData.player_id} not found.`);
        }

        // update player
        await apiFetch(
          "people",
          "PATCH",
          {
            first_name: playerData.first_name,
            last_name: playerData.last_name,
            birth_date: birthDate,
          },
          playerData.player_id
        );

        return { id: playerData.player_id, created: false };
      } catch (err) {
        throw new Error(`Invalid player_id: ${playerData.player_id}`);
      }
    }

    // Search for existing player by name and DOB
    try {
      const players = await apiFetch("people", "GET", null, null, {
        filters: {
          first_name: playerData.first_name,
          last_name: playerData.last_name,
          birth_date: birthDate,
        },
      });

      if (players && players.length > 0) {
        return { id: players[0].id, created: false };
      }
    } catch (err) {
      console.error("Error searching for player:", err);
    }

    // Create new player
    try {
      const newPlayer = await apiFetch("people", "POST", {
        first_name: playerData.first_name,
        last_name: playerData.last_name,
        birth_date: birthDate,
      });
      return { id: newPlayer.id, created: true };
    } catch (err) {
      throw new Error(`Failed to create player: ${err.message}`);
    }
  };

  // Check if player_team record exists
  const findOrCreatePlayerTeam = async (playerId, teamData) => {
    try {
      // Check if record exists
      const records = await apiFetch("player_teams", "GET", null, null, {
        filters: {
          player_id: playerId,
          team_season_id: teamSeasonId,
        },
      });

      if (records && records.length > 0) {
        // Update existing record
        await apiFetch(
          "player_teams",
          "PATCH",
          {
            grade: teamData.grade,
            jersey_number: teamData.jersey_number,
          },
          records[0].id
        );
        return { id: records[0].id, created: false };
      }

      // Create new record
      const newRecord = await apiFetch("player_teams", "POST", {
        player_id: playerId,
        team_season_id: teamSeasonId,
        grade: teamData.grade,
        jersey_number: teamData.jersey_number,
        status: "interested",
      });
      return { id: newRecord.id, created: true };
    } catch (err) {
      throw new Error(`Failed to create player_team: ${err.message}`);
    }
  };

  // Find or create parent by first, last, phone
  const findOrCreateParent = async (parentData) => {
    if (!parentData) return null;

    try {
      // Search for existing parent
      const parents = await apiFetch("people", "GET", null, null, {
        filters: {
          first_name: parentData.first_name,
          last_name: parentData.last_name,
          phone: parentData.phone,
        },
      });

      if (parents && parents.length > 0) {
        const parent = parents[0];
        // Update email if provided and different
        if (parentData.email && parentData.email !== parent.email) {
          await apiFetch(
            "people",
            "PATCH",
            {
              email: parentData.email,
            },
            parent.id
          );
        }
        return { id: parent.id, created: false };
      }

      // Create new parent
      const newParent = await apiFetch("people", "POST", parentData);
      return { id: newParent.id, created: true };
    } catch (err) {
      throw new Error(`Failed to create parent: ${err.message}`);
    }
  };

  // Check if relationship exists before creating
  const findOrCreateRelationship = async (playerId, parentId) => {
    try {
      // Check if relationship exists
      const relationships = await apiFetch(
        "player_relationships",
        "GET",
        null,
        null,
        {
          filters: {
            player_id: playerId,
            related_person_id: parentId,
            relationship: "parent",
          },
        }
      );

      if (relationships && relationships.length > 0) {
        return { id: relationships[0].id, created: false };
      }

      // Create new relationship
      const newRelationship = await apiFetch("player_relationships", "POST", {
        player_id: playerId,
        related_person_id: parentId,
        relationship: "parent",
      });
      return { id: newRelationship.id, created: true };
    } catch (err) {
      throw new Error(`Failed to create relationship: ${err.message}`);
    }
  };

  const processImport = async () => {
    if (fileData.length === 0) {
      setError("Please upload or paste data");
      return;
    }

    setProcessing(true);
    setError("");

    const importResults = {
      players: { processed: 0, created: 0, updated: 0 },
      parents: { processed: 0, created: 0, linked: 0 },
      player_teams: { processed: 0, created: 0, updated: 0 },
      errors: [],
    };

    try {
      for (const row of fileData) {
        try {
          // Step 1: Handle Player
          const playerResult = await findOrCreatePlayer(row);
          importResults.players.processed++;
          if (playerResult.created) {
            importResults.players.created++;
          } else {
            importResults.players.updated++;
          }

          // Step 2: Handle Player Team
          const teamResult = await findOrCreatePlayerTeam(playerResult.id, row);
          importResults.player_teams.processed++;
          if (teamResult.created) {
            importResults.player_teams.created++;
          } else {
            importResults.player_teams.updated++;
          }

          // Step 3: Handle Parents
          for (let i = 1; i <= 2; i++) {
            const parentData = parseParentData(row, i);
            if (parentData) {
              const parentResult = await findOrCreateParent(parentData);
              if (parentResult) {
                importResults.parents.processed++;
                if (parentResult.created) {
                  importResults.parents.created++;
                }

                // Step 4: Link parent to player
                const relResult = await findOrCreateRelationship(
                  playerResult.id,
                  parentResult.id
                );
                if (relResult.created) {
                  importResults.parents.linked++;
                }
              }
            }
          }
        } catch (rowError) {
          importResults.errors.push(
            `Error processing ${row.first_name} ${row.last_name}: ${rowError.message}`
          );
        }
      }

      setResults(importResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const clearData = () => {
    setFileData([]);
    setPreview([]);
    setResults(null);
    setError("");
  };

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <Link
          href={`/teams/${teamSeasonId}/roster`}
          className='flex items-center text-[hsl(var(--color-text-label))] hover:text-[hsl(var(--color-text))] mb-4'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Roster
        </Link>
        <h2 className='text-2xl font-bold text-[hsl(var(--color-text))]'>
          Upload Roster
        </h2>
        <p className='text-[hsl(var(--color-text-label))] mt-2'>
          Upload a CSV/TSV file to bulk import players
        </p>
      </div>

      {/* Upload Area */}
      <div className='bg-[hsl(var(--color-surface))] rounded-[var(--radius-default)] border border-[hsl(var(--color-border))] p-6 mb-6'>
        <div className='border-2 border-dashed border-[hsl(var(--color-border))] rounded-[var(--radius-default)] p-8 text-center'>
          <FileSpreadsheet className='w-12 h-12 mx-auto text-[hsl(var(--color-muted))] mb-4' />

          <div className='mb-4'>
            <label
              htmlFor='file-upload'
              className='cursor-pointer inline-flex items-center space-x-2 bg-[hsl(var(--color-primary))] text-white px-4 py-2 rounded-[var(--radius-default)] hover:bg-[hsl(var(--color-accent-hover))]'
            >
              <Upload className='w-4 h-4' />
              <span>Choose File</span>
            </label>
            <input
              id='file-upload'
              type='file'
              accept='.csv,.tsv,.txt'
              onChange={handleFileUpload}
              className='hidden'
              disabled={processing}
            />
          </div>

          <div className='text-center text-[hsl(var(--color-muted))] my-4'>
            - OR -
          </div>

          <div>
            <label className='block text-sm font-medium text-[hsl(var(--color-text))] mb-2'>
              Paste Data (Tab-separated)
            </label>
            <textarea
              onChange={handlePasteData}
              placeholder='player_id	first_name	last_name	birth_date	grade	jersey_number	parent1_email	parent1_first	parent1_last	parent1_phone	parent2_email	parent2_first	parent2_last	parent2_phone'
              className='w-full h-32 px-4 py-2 border border-[hsl(var(--color-border))] rounded-[var(--radius-default)] focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent font-mono text-sm'
              disabled={processing}
            />
          </div>

          {fileData.length > 0 && (
            <div className='mt-4 p-4 bg-[hsl(var(--color-success)/0.1)] border border-[hsl(var(--color-success))] rounded-[var(--radius-default)]'>
              <p className='text-[hsl(var(--color-success))] font-medium'>
                ✓ {fileData.length} rows loaded
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className='mt-6'>
            <h3 className='font-semibold mb-3 text-[hsl(var(--color-text))]'>
              Preview (first 5 rows):
            </h3>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm border border-[hsl(var(--color-border))]'>
                <thead className='bg-[hsl(var(--color-background))]'>
                  <tr>
                    {Object.keys(preview[0]).map((header) => (
                      <th
                        key={header}
                        className='px-3 py-2 text-left border border-[hsl(var(--color-border))] text-[hsl(var(--color-text))]'
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className='border-t'>
                      {Object.values(row).map((value, i) => (
                        <td
                          key={i}
                          className='px-3 py-2 border border-[hsl(var(--color-border))] text-[hsl(var(--color-text))]'
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className='mt-6 p-4 bg-[hsl(var(--color-primary)/0.05)] border border-[hsl(var(--color-primary)/0.2)] rounded-[var(--radius-default)]'>
          <h3 className='font-semibold text-sm mb-2 text-[hsl(var(--color-primary))]'>
            📋 Data Format Requirements:
          </h3>
          <ul className='text-sm text-[hsl(var(--color-text-label))] space-y-1 list-disc list-inside'>
            <li>Tab-separated columns (copy from spreadsheet)</li>
            <li>
              <strong>Columns:</strong> player_id (optional), first_name,
              last_name, birth_date (MM/DD/YYYY), grade, jersey_number
            </li>
            <li>
              <strong>Parent 1:</strong> parent1_email, parent1_first,
              parent1_last, parent1_phone
            </li>
            <li>
              <strong>Parent 2 (optional):</strong> parent2_email,
              parent2_first, parent2_last, parent2_phone
            </li>
            <li>
              Leave player_id blank for new players (will search by name + DOB)
            </li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mt-4 p-4 bg-[hsl(var(--color-danger)/0.1)] border border-[hsl(var(--color-danger))] rounded-[var(--radius-default)] flex items-start'>
            <AlertCircle className='w-5 h-5 text-[hsl(var(--color-danger))] mr-3 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-[hsl(var(--color-danger))]'>
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className='mt-6 p-6 bg-[hsl(var(--color-surface))] border border-[hsl(var(--color-border))] rounded-[var(--radius-default)]'>
            <h2 className='text-lg font-semibold text-[hsl(var(--color-text))] mb-4'>
              Import Results
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='bg-[hsl(var(--color-success)/0.1)] border border-[hsl(var(--color-success))] rounded-[var(--radius-default)] p-4'>
                <p className='text-sm text-[hsl(var(--color-success))] font-medium'>
                  Players Processed
                </p>
                <p className='text-3xl font-bold text-[hsl(var(--color-success))]'>
                  {results.players?.processed || 0}
                </p>
                <p className='text-xs text-[hsl(var(--color-success))] mt-1'>
                  {results.players?.created || 0} created,{" "}
                  {results.players?.updated || 0} updated
                </p>
              </div>

              <div className='bg-[hsl(var(--color-primary)/0.1)] border border-[hsl(var(--color-primary))] rounded-[var(--radius-default)] p-4'>
                <p className='text-sm text-[hsl(var(--color-primary))] font-medium'>
                  Parents Processed
                </p>
                <p className='text-3xl font-bold text-[hsl(var(--color-primary))]'>
                  {results.parents?.processed || 0}
                </p>
                <p className='text-xs text-[hsl(var(--color-primary))] mt-1'>
                  {results.parents?.created || 0} created,{" "}
                  {results.parents?.linked || 0} linked
                </p>
              </div>

              <div className='bg-[hsl(var(--color-purple)/0.1)] border border-[hsl(var(--color-purple))] rounded-[var(--radius-default)] p-4'>
                <p className='text-sm text-[hsl(var(--color-purple))] font-medium'>
                  Team Records
                </p>
                <p className='text-3xl font-bold text-[hsl(var(--color-purple))]'>
                  {results.player_teams?.processed || 0}
                </p>
                <p className='text-xs text-[hsl(var(--color-purple))] mt-1'>
                  {results.player_teams?.created || 0} created,{" "}
                  {results.player_teams?.updated || 0} updated
                </p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className='bg-[hsl(var(--color-warningbg))] border border-[hsl(var(--color-warningborder))] rounded-[var(--radius-default)] p-4'>
                <p className='font-semibold text-[hsl(var(--color-warningtext))] mb-2'>
                  ⚠️ Warnings:
                </p>
                <ul className='text-sm text-[hsl(var(--color-warningtext))] space-y-1 ml-5 list-disc'>
                  {results.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end space-x-3'>
        <Button variant='outline' onClick={clearData} disabled={processing}>
          Clear
        </Button>
        <Button
          variant='primary'
          onClick={processImport}
          disabled={processing || fileData.length === 0}
        >
          {processing ? (
            <div className='flex items-center gap-2'>
              <div className='animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full' />
              <span>Processing...</span>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <CheckCircle className='w-4 h-4' />
              <span>Process Import</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

export default RosterUpload;

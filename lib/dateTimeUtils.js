// lib/dateTimeUtils.js

// ==================== CONVERSION FUNCTIONS ====================

/**
 * Converts various date inputs to Unix timestamp in milliseconds.
 * @param {string|number|Date} dateInput - Date input in various formats
 * @returns {number} - Unix timestamp in milliseconds
 */
export function toTimestamp(dateInput) {
  if (!dateInput) return 0;

  let dateObject;

  // If it's a MySQL datetime string (YYYY-MM-DD HH:MM:SS), treat it as UTC
  if (
    typeof dateInput === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateInput)
  ) {
    dateObject = new Date(dateInput.replace(" ", "T") + "Z");
  } else {
    // Handle everything else (timestamps, ISO strings, Date objects, etc.)
    dateObject = new Date(dateInput);
  }

  if (isNaN(dateObject.getTime())) {
    throw new Error("Invalid date input. Could not parse to a Date object.");
  }

  return dateObject.getTime();
}

/**
 * Converts Unix timestamp (ms) to MySQL DATETIME format (UTC).
 * @param {number} [timestamp=Date.now()] - Unix timestamp in milliseconds
 * @returns {string} - MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
 */
export function toMySqlDateTime(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Converts MySQL DATETIME string to Unix timestamp (ms).
 * @param {string} mysqlDateTime - MySQL DATETIME (e.g., "2025-11-29 14:30:00")
 * @returns {number} - Unix timestamp in milliseconds
 */
export function fromMySqlDateTime(mysqlDateTime) {
  if (!mysqlDateTime) return 0;
  return new Date(mysqlDateTime.replace(" ", "T") + "Z").getTime();
}

// ==================== FORMATTING FUNCTIONS ====================

/**
 * Converts seconds to time string format.
 * @param {number} totalSeconds - Total duration in seconds
 * @param {Object} options - Formatting options
 * @param {boolean} [options.includeSeconds=true] - Include seconds in output
 * @param {boolean} [options.use12Hour=false] - Use 12-hour format
 * @returns {string} - Formatted time string
 */
export function secondsToTime(totalSeconds, options = {}) {
  const { includeSeconds = true, use12Hour = false } = options;

  const secondsFloor = Math.floor(totalSeconds);
  const SECONDS_IN_DAY = 86400;
  const secondsInDay = secondsFloor % SECONDS_IN_DAY;

  let hours24 = Math.floor(secondsInDay / 3600);
  const minutes = Math.floor((secondsInDay % 3600) / 60);
  const seconds = secondsInDay % 60;

  const pad = (num) => String(num).padStart(2, "0");

  let timeString;
  let period = "";

  if (use12Hour) {
    period = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    timeString = `${hours12}:${pad(minutes)}`;
  } else {
    timeString = `${pad(hours24)}:${pad(minutes)}`;
  }

  if (includeSeconds) {
    timeString += `:${pad(seconds)}`;
  }

  if (use12Hour) {
    timeString += ` ${period}`;
  }

  return timeString;
}

/**
 * Converts seconds to MM:SS format.
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time as MM:SS
 */
export function formatSecondsToMmss(seconds) {
  if (!seconds || seconds < 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Converts MySQL DATETIME to local date and time display strings.
 * @param {string} mysqlDateTime - MySQL DATETIME in UTC
 * @returns {{date: string, time: string}} - Formatted date and time
 */
export function formatMySqlDateTime(mysqlDateTime) {
  if (!mysqlDateTime) return { date: "", time: "" };

  const dateObj = new Date(mysqlDateTime.replace(" ", "T") + "Z");

  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);
  const date = `${month}/${day}/${year}`;

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time = `${hours}:${minutes} ${ampm}`;

  return { date, time };
}

/**
 * Formats Unix timestamp to various display formats.
 * @param {number} timestampMs - Unix timestamp in milliseconds
 * @param {string} formatType - 'date', 'timeShort', 'timeLong', or 'datetime'
 * @param {string} [timeZone='America/Chicago'] - IANA timezone string
 * @returns {string} - Formatted date/time string
 */
export function formatTimestamp(
  timestampMs,
  formatType,
  timeZone = "America/Chicago"
) {
  if (typeof timestampMs !== "number" || timestampMs < 0) return "";

  const date = new Date(timestampMs);
  const options = { timeZone, hour12: true };

  switch (formatType.toLowerCase()) {
    case "date":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      break;

    case "timeshort":
      options.hour = "numeric";
      options.minute = "2-digit";
      break;

    case "timelong":
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      break;

    case "datetime":
    default:
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      break;
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

// ==================== GAME TIME CALCULATIONS ====================

/**
 * Calculates total game time (wall clock time since game started).
 * Game time never pauses.
 * @param {number} firstPeriodStartMs - Unix timestamp when game started (ms)
 * @param {number} currentMs - Current Unix timestamp (ms)
 * @returns {number} - Game time in seconds
 */
export function calculateGameTime(firstPeriodStartMs, currentMs) {
  if (!firstPeriodStartMs || !currentMs) return 0;
  return Math.floor((currentMs - firstPeriodStartMs) / 1000);
}

/**
 * Calculates period time (playing time, excluding stoppages).
 * @param {number} periodStartMs - Period start timestamp (ms)
 * @param {number} periodEndMs - Period end timestamp (ms) or current time
 * @param {Array<{startTime: number, endTime: number}>} stoppages - Stoppages in game seconds
 * @returns {number} - Period time in seconds (excluding stoppages)
 */
export function calculatePeriodTime(
  periodStartMs,
  periodEndMs,
  stoppages = []
) {
  if (!periodStartMs || !periodEndMs) return 0;

  const totalPeriodSeconds = Math.floor((periodEndMs - periodStartMs) / 1000);

  const stoppageSeconds = stoppages
    .filter((s) => s.endTime !== null)
    .reduce((total, s) => total + (s.endTime - s.startTime), 0);

  return Math.max(0, totalPeriodSeconds - stoppageSeconds);
}

/**
 * Calculates player's actual time on field (playing time, excluding stoppages).
 * @param {Array<{gameTime: number}>} playerIns - Sub-in times (game seconds)
 * @param {Array<{gameTime: number}>} playerOuts - Sub-out times (game seconds)
 * @param {boolean} isStarter - Whether player started
 * @param {number} currentGameTime - Current game time (seconds)
 * @param {Array<{startTime: number, endTime: number}>} stoppages - Stoppages (game seconds)
 * @returns {number} - Playing time in seconds
 */
export function calculatePlayerTimeOnField(
  playerIns,
  playerOuts,
  isStarter,
  currentGameTime,
  stoppages = []
) {
  const completedIns = (playerIns || []).filter((sub) => sub.gameTime !== null);
  const completedOuts = (playerOuts || []).filter(
    (sub) => sub.gameTime !== null
  );

  // Build time ranges when player was on field
  const ranges = [];

  if (isStarter) {
    if (completedOuts.length > 0) {
      ranges.push({ start: 0, end: completedOuts[0].gameTime });
    } else {
      ranges.push({ start: 0, end: currentGameTime });
    }
  }

  // Process ins and outs
  for (let i = 0; i < completedIns.length; i++) {
    const inTime = completedIns[i].gameTime;
    const outTime =
      completedOuts[i + (isStarter ? 1 : 0)]?.gameTime || currentGameTime;
    ranges.push({ start: inTime, end: outTime });
  }

  // Calculate time excluding stoppages
  let totalTime = 0;
  for (const range of ranges) {
    let rangeTime = range.end - range.start;

    // Subtract overlapping stoppages
    for (const stoppage of stoppages) {
      if (!stoppage.endTime) continue;

      const overlapStart = Math.max(range.start, stoppage.startTime);
      const overlapEnd = Math.min(range.end, stoppage.endTime);

      if (overlapStart < overlapEnd) {
        rangeTime -= overlapEnd - overlapStart;
      }
    }

    totalTime += rangeTime;
  }

  return Math.max(0, totalTime);
}

// ==================== HELPER FUNCTIONS ====================

function pad(num) {
  return String(num).padStart(2, "0");
}

/**
 * Converts local date/time to MySQL format for form inputs.
 */
export function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(timeValue) {
  if (!timeValue) return "";
  if (/^\d{2}:\d{2}$/.test(timeValue)) return timeValue;
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) return timeValue.substring(0, 5);
  return timeValue;
}
export function formatMySqlTime(mysqlTimeString) {
  if (!mysqlTimeString) return null;

  const [hours, minutes] = mysqlTimeString.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
}
export function formatMySqlDate(mysqlDateString) {
  if (!mysqlDateString) return "";

  const dateObj = new Date(mysqlDateString + "T00:00:00.000Z");
  if (isNaN(dateObj.getTime())) return "";

  const options = {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

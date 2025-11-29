// lib/dateTimeUtils.js

export function datetimeToSs(dateInput) {
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

  return dateObject.getTime() / 1000;
}

/**
 * Converts a total number of seconds into an HH:MM:SS or HH:MM string format.
 *
 * @param {number} totalSeconds - The total duration in seconds.
 * @param {boolean} [includeSeconds=true] - If true, returns HH:MM:SS. If false, returns HH:MM.
 * @returns {string} The formatted time string.
 */
export function secondsToTime(totalSeconds, options = {}) {
  // Default options
  const { includeSeconds = true, use12Hour = false } = options;

  // 1. Drop the decimal portion
  const secondsFloor = Math.floor(totalSeconds);

  // 2. Calculate the total seconds into the CURRENT DAY (UTC)
  const SECONDS_IN_DAY = 86400;
  const secondsInDay = secondsFloor % SECONDS_IN_DAY;

  // 3. Calculate components (24-hour basis)
  let hours24 = Math.floor(secondsInDay / 3600);
  const minutes = Math.floor((secondsInDay % 3600) / 60);
  const seconds = secondsInDay % 60;

  // Helper function to ensure two digits (e.g., 5 -> "05")
  const pad = (num) => String(num).padStart(2, "0");

  let timeString;
  let period = ""; // AM or PM indicator

  // --- 12-Hour Conversion ---
  if (use12Hour) {
    // Determine AM/PM
    period = hours24 >= 12 ? "PM" : "AM";

    // Convert 0 (midnight) to 12, and hours > 12 to hours - 12
    let hours12 = hours24 % 12;
    if (hours12 === 0) {
      hours12 = 12; // Midnight is 12 AM
    }

    // 12-hour format does NOT use leading zeros on the hour
    timeString = `${hours12}:${pad(minutes)}`;
  } else {
    // --- 24-Hour Format ---
    timeString = `${pad(hours24)}:${pad(minutes)}`;
  }

  // Append seconds if requested
  if (includeSeconds) {
    timeString += `:${pad(seconds)}`;
  }

  // Append AM/PM if using 12-hour format
  if (use12Hour) {
    timeString += ` ${period}`;
  }

  return timeString;
}

/**
 * Converts a MySQL DATETIME string (UTC) to local date and time display strings.
 *
 * @param {string} mysqlDateTimeString - MySQL DATETIME in UTC (e.g., "2025-10-25T19:34:46.000Z" or "2025-10-25 19:34:46")
 * @returns {{date: string, time: string}} - Formatted date (MM/DD/YY) and time (h:mm AM/PM) in local timezone
 */
export function formatMySqlDateTime(mysqlDateTimeString) {
  if (!mysqlDateTimeString) {
    return { date: "", time: "" };
  }

  const dateObj = new Date(mysqlDateTimeString);

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
 * Converts local date/time strings to MySQL DATETIME format (UTC).
 *
 * @param {string} dateString - Date string (MM/DD/YY format)
 * @param {string} timeString - Time string (h:mm AM/PM format)
 * @returns {string|null} - MySQL DATETIME string in UTC (YYYY-MM-DD HH:MM:SS)
 */
export function toMySqlDateTime(date = new Date()) {
  // .toISOString() => "2025-11-28T18:00:04.950Z"
  // slice(0,19) => "2025-11-28T18:00:04"
  // replace T => space => "2025-11-28 18:00:04"
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Converts local date/time strings to separate MySQL DATE and TIME (UTC).
 *
 * @param {string} dateString - Date string (MM/DD/YY format)
 * @param {string} timeString - Time string (h:mm AM/PM format)
 * @returns {{date: string|null, time: string|null}} - MySQL DATE and TIME in UTC
 */
export function toMySqlDateAndTime(dateString, timeString) {
  if (!dateString || !timeString) {
    return { date: null, time: null };
  }

  const localDate = new Date(`${dateString} ${timeString}`);
  const utcIsoString = localDate.toISOString();

  return {
    date: utcIsoString.substring(0, 10),
    time: utcIsoString.substring(11, 19),
  };
}

/**
 * Converts MySQL TIME string to 12-hour format display.
 *
 * @param {string} mysqlTimeString - MySQL TIME (e.g., "13:30:00")
 * @returns {string|null} - Formatted time (h:mm AM/PM)
 */
export function formatMySqlTime(mysqlTimeString) {
  if (!mysqlTimeString) return null;

  const [hours, minutes] = mysqlTimeString.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Converts MySQL DATE string to display format (MM/DD/YY).
 *
 * @param {string} mysqlDateString - MySQL DATE (e.g., "2025-10-25")
 * @returns {string} - Formatted date (MM/DD/YY)
 */
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

/**
 * Converts seconds to MM:SS format for display.
 *
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time as MM:SS
 */
export function formatSecondsToMmss(seconds) {
  if (!seconds || seconds < 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Converts a Unix timestamp (milliseconds) to formatted date/time.
 *
 * @param {number} timestampMs - Unix timestamp in milliseconds
 * @param {('date'|'timeShort'|'timeLong'|'datetime')} formatType - Output format
 * @param {string} [timeZone='America/Chicago'] - IANA timezone string
 * @returns {string} - Formatted date/time string
 */
export function formatTimestamp(
  timestampMs,
  formatType,
  timeZone = "America/Chicago"
) {
  if (typeof timestampMs !== "number" || timestampMs < 0) {
    return "";
  }

  const date = new Date(timestampMs);
  const options = { timeZone, hour12: true };

  switch (formatType.toLowerCase()) {
    case "date":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      return new Intl.DateTimeFormat("en-US", options).format(date);

    case "timeshort":
      options.hour = "numeric";
      options.minute = "2-digit";
      return new Intl.DateTimeFormat("en-US", options).format(date);

    case "timelong":
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      return new Intl.DateTimeFormat("en-US", options).format(date);

    case "datetime":
    default:
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      return new Intl.DateTimeFormat("en-US", options).format(date);
  }
}

// ==================== GAME-SPECIFIC TIME FUNCTIONS ====================

/**
 * Converts a MySQL DATETIME (UTC) to Unix timestamp (milliseconds).
 *
 * @param {string} mysqlDateTime - MySQL DATETIME (e.g., "2025-11-29 14:30:00")
 * @returns {number} - Unix timestamp in milliseconds
 */
export function mysqlDateTimeToTimestamp(mysqlDateTime) {
  if (!mysqlDateTime) return 0;
  return new Date(mysqlDateTime).getTime();
}

/**
 * Converts Unix timestamp (milliseconds) to MySQL DATETIME format (UTC).
 *
 * @param {number} timestampMs - Unix timestamp in milliseconds
 * @returns {string|null} - MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
 */
export function timestampToMysqlDateTime(timestampMs) {
  if (!timestampMs) return null;
  const date = new Date(timestampMs);
  return date.toISOString().substring(0, 19).replace("T", " ");
}

/**
 * Calculates game time in seconds since the first period started.
 * Game time never pauses - it's wall clock time.
 *
 * @param {number} firstPeriodStartTimestamp - Unix timestamp (ms) when period 1 started
 * @param {number} [currentTimestamp] - Unix timestamp (ms) of current time (defaults to now)
 * @returns {number} - Game time in seconds
 */
/**
 * Calculates the total elapsed time of the game in seconds.
 * * NOTE: The start and current timestamps MUST be in SECONDS since the Unix epoch.
 *
 * @param {number} firstPeriodStartTimestamp - Unix timestamp in seconds for the start of the game.
 * @param {number} currentTimestamp - Unix timestamp in seconds for the current moment
 * (or the game's end time).
 * @returns {number} The total elapsed time in seconds.
 */
export function calculateGameTime(
  firstPeriodStartTimestamp,
  currentTimestamp // This is now REQUIRED to be passed in from the caller
) {
  if (!firstPeriodStartTimestamp || !currentTimestamp) return 0;

  // Both inputs are already in seconds, so we just subtract to get the difference.
  // The Math.floor from your original function is retained for safety.
  return Math.floor(currentTimestamp - firstPeriodStartTimestamp);
}

/**
 * Calculates period time (actual playing time, excluding stoppages).
 * Used for period clock display.
 *
 * @param {number} periodStartTimestamp - Unix timestamp (ms) when period started
 * @param {number} periodEndTimestamp - Unix timestamp (ms) when period ended (null if ongoing)
 * @param {Array<{startTime: number, endTime: number}>} stoppages - Array of stoppage times in game seconds
 * @param {number} firstPeriodStartTimestamp - Unix timestamp (ms) when game started
 * @returns {number} - Period time in seconds (excluding stoppages)
 */
export function calculatePeriodTime(
  periodStartTime,
  periodEndTime,
  stoppages,
  firstPeriodStart
) {
  if (!periodStartTime || !firstPeriodStart) return 0;
  const startTime = Math.trunc(periodStartTime);
  const endTime = Math.trunc(periodEndTime);
  const periodTime = endTime - startTime;
  console.log(periodTime);
  const stoppageTime = (stoppages || [])
    .filter((s) => {
      const isComplete = s.endTime !== null;
      return isComplete;
    })
    .reduce((total, s) => total + (s.endTime - s.startTime), 0);

  return Math.max(0, periodTime - stoppageTime);
}

/**
 * Calculates a player's actual time on field (playing time).
 * Excludes time during stoppages.
 *
 * @param {Array<{gameTime: number}>} playerIns - Array of sub-in times (game seconds)
 * @param {Array<{gameTime: number}>} playerOuts - Array of sub-out times (game seconds)
 * @param {boolean} isStarter - Whether player started the game
 * @param {number} currentGameTime - Current game time in seconds
 * @param {Array<{startTime: number, endTime: number}>} stoppages - All game stoppages
 * @returns {number} - Actual playing time in seconds
 */
export function calculatePlayerTimeOnField(
  playerIns,
  playerOuts,
  isStarter,
  currentGameTime,
  stoppages
) {
  // Filter completed subs only
  const completedIns = (playerIns || []).filter((sub) => sub.gameTime !== null);
  const completedOuts = (playerOuts || []).filter(
    (sub) => sub.gameTime !== null
  );

  // Build time ranges when player was on field
  const ranges = [];

  if (isStarter) {
    // Starter begins at 0
    if (completedOuts.length > 0) {
      ranges.push({ start: 0, end: completedOuts[0].gameTime });
    } else {
      // Still on field
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

  // Calculate time, excluding stoppages
  let totalTime = 0;
  for (const range of ranges) {
    let rangeTime = range.end - range.start;

    // Subtract stoppages that overlap this range
    for (const stoppage of stoppages || []) {
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

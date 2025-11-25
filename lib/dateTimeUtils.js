/*// Display DATETIME from database
const { date, time } = formatMySqlDateTime(row.created_at);

// Display separate DATE and TIME columns
const displayDate = formatMySqlDate(row.event_date);
const displayTime = formatMySqlTime(row.event_time);

// Save to database as DATETIME
const datetime = toMySqlDateTime("10/25/25", "2:34 PM");

// Save to separate DATE and TIME columns
const { date, time } = toMySqlDateAndTime("10/25/25", "2:34 PM");

// Display timer/duration
const duration = formatSecondsToMmss(125); // "02:05"




/**
 * Converts a MySQL DATETIME string (UTC) to local date and time display strings.
 *
 * @param {string} mysqlDateTimeString - MySQL DATETIME in UTC (e.g., "2025-10-25T19:34:46.000Z" or "2025-10-25 19:34:46")
 * @returns {{date: string, time: string}} - Formatted date (MM/DD/YY) and time (h:mm AM/PM) in local timezone
 *
 * @example
 * formatMySqlDateTime("2025-10-25T19:34:46.000Z")
 * // Returns: { date: "10/25/25", time: "2:34 PM" }
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
 * @param {string} dateString - Date string (MM/DD/YY format, e.g., "10/25/25")
 * @param {string} timeString - Time string (h:mm AM/PM format, e.g., "2:34 PM")
 * @returns {string|null} - MySQL DATETIME string in UTC (YYYY-MM-DD HH:MM:SS) or null if invalid
 *
 * @example
 * toMySqlDateTime("10/25/25", "2:34 PM")
 * // Returns: "2025-10-25 19:34:00" (if local time converts to this UTC)
 */
export function toMySqlDateTime(dateString, timeString) {
  if (!dateString || !timeString) return null;

  const localDate = new Date(`${dateString} ${timeString}`);
  const utcIsoString = localDate.toISOString();

  // Convert ISO format to MySQL DATETIME format
  return utcIsoString.substring(0, 19).replace("T", " ");
}

/**
 * Converts local date/time strings to separate MySQL DATE and TIME (UTC).
 * Use this when your database has separate DATE and TIME columns.
 *
 * @param {string} dateString - Date string (MM/DD/YY format, e.g., "10/25/25")
 * @param {string} timeString - Time string (h:mm AM/PM format, e.g., "2:34 PM")
 * @returns {{date: string|null, time: string|null}} - MySQL DATE (YYYY-MM-DD) and TIME (HH:MM:SS) in UTC
 *
 * @example
 * toMySqlDateAndTime("10/25/25", "2:34 PM")
 * // Returns: { date: "2025-10-25", time: "19:34:00" }
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
 * Converts MySQL TIME string (HH:MM:SS) to 12-hour format display.
 *
 * @param {string} mysqlTimeString - MySQL TIME in 24-hour format (e.g., "13:30:00" or "13:30")
 * @returns {string|null} - Formatted time (h:mm AM/PM) or null if invalid
 *
 * @example
 * formatMySqlTime("13:30:00") // Returns: "1:30 PM"
 * formatMySqlTime("09:15:00") // Returns: "9:15 AM"
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
 * Converts MySQL DATE string (YYYY-MM-DD) to display format.
 *
 * @param {string} mysqlDateString - MySQL DATE (e.g., "2025-10-25")
 * @returns {string} - Formatted date (MM/DD/YY) or empty string if invalid
 *
 * @example
 * formatMySqlDate("2025-10-25") // Returns: "10/25/25"
 */
export function formatMySqlDate(mysqlDateString) {
  if (!mysqlDateString) return "";

  const dateObj = new Date(mysqlDateString + "T00:00:00");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);

  return `${month}/${day}/${year}`;
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
 * Converts seconds to MM:SS format for display (e.g., duration, timer).
 *
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time as MM:SS
 *
 * @example
 * formatSecondsToMmss(125) // Returns: "02:05"
 * formatSecondsToMmss(45)  // Returns: "00:45"
 */
export function formatSecondsToMmss(seconds) {
  if (!seconds || seconds < 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

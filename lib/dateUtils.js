import { useCallback } from "react";

/**
 * Converts a MySQL UTC date string ("YYYY-MM-DDTHH:MM:SS.000Z")
 * into separate formatted date and 12-hour time strings based on the user's local time.
 *
 * @param {string} mysqlDateString The MySQL datetime string (e.g., "2025-10-25T19:34:46.000Z").
 * @returns {{formattedDate: string, formattedTime: string}} An object with the formatted date (mm/dd/yy) and time (hh:mm AM/PM).
 */
export function formatMySqlDate(mysqlDateString) {
  if (!mysqlDateString) {
    return { formattedDate: "", formattedTime: "" };
  }

  // 1. Create a Date object
  const dateObject = new Date(mysqlDateString);

  // --- 2. Format Date (mm/dd/yy) ---
  const month = (dateObject.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is 0-indexed
  const day = dateObject.getDate().toString().padStart(2, "0");
  // .slice(-2) gets the last two digits of the year (e.g., 2025 -> 25)
  const year = dateObject.getFullYear().toString().slice(-2);

  const date = `${month}/${day}/${year}`;

  // --- 3. Format Time (hh:mm 12-hour) ---
  let hours = dateObject.getHours();
  const minutes = dateObject.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour to 12-hour format
  hours = hours % 12;
  // The hour '0' (midnight) should be '12'
  hours = hours ? hours : 12;
  const formattedHours = hours.toString().padStart(2, "0");

  const time = `${formattedHours}:${minutes} ${ampm}`;

  return {
    date, // e.g., "10/25/25"
    time, // e.g., "02:34 PM"
  };
}

/**
 * Converts separate formatted date (mm/dd/yy) and time (hh:mm AM/PM)
 * strings from a form into MySQL-compatible date and time strings (UTC).
 * * @param {string} dateString The formatted date string (e.g., "10/25/25").
 * @param {string} timeString The formatted 12-hour time string (e.g., "02:34 PM").
 * @returns {{mysqlDate: string, mysqlTime: string}} An object with the formatted date (YYYY-MM-DD) and time (HH:MM:SS) in UTC.
 */
export function convertToMySqlFormat(dateString, timeString) {
  if (!dateString || !timeString) {
    return { mysqlDate: null, mysqlTime: null };
  }

  // 1. Combine and prepare for Date Object creation
  // The format "MM/DD/YY HH:MM AM/PM" is commonly understood by the Date constructor.
  const combinedDateTime = `${dateString} ${timeString}`;

  // Creates a Date object based on the user's LOCAL time zone
  const localDate = new Date(combinedDateTime);

  // 2. Convert to UTC ISO String
  // This is the safest way to ensure the time stored in the DB is standardized.
  // e.g., "2025-10-26T20:47:00.000Z"
  const utcIsoString = localDate.toISOString();

  // 3. Extract Date (YYYY-MM-DD) and Time (HH:MM:SS)
  // The date is the part before 'T'
  const mysqlDate = utcIsoString.substring(0, 10); // "2025-10-26"

  // The time is the part between 'T' and '.' (we strip the Z for the separate TIME column)
  const mysqlTime = utcIsoString.substring(11, 19); // "20:47:00" (24-hour UTC)

  return {
    mysqlDate, // YYYY-MM-DD format (UTC day)
    mysqlTime, // HH:MM:SS 24-hour format (UTC time)
  };
}

export const changeSecondsToMmss = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

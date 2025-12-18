const EASTERN_TIMEZONE = "America/New_York"

/**
 * Format a date in Eastern Time (ET) using native Intl API
 * @param date - Date string or Date object
 * @param formatStr - Format string (simplified: "MMM d, yyyy", "MMM d, yyyy HH:mm", "HH:mm", etc.)
 * @param showTimezone - Whether to append timezone (default: true)
 */
export function formatInEasternTime(date: string | Date, formatStr = "MMM d, yyyy HH:mm", showTimezone = true): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  // Parse the format string to determine what to display
  const includesDate = formatStr.includes("MMM") || formatStr.includes("d") || formatStr.includes("yyyy")
  const includesTime =
    formatStr.includes("HH") || formatStr.includes("mm") || formatStr.includes("h") || formatStr.includes("a")

  let formatted = ""

  if (includesDate && includesTime) {
    // Full date and time
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: formatStr.includes("a"),
    })
    formatted = formatter.format(dateObj)
  } else if (includesDate) {
    // Date only
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    formatted = formatter.format(dateObj)
  } else if (includesTime) {
    // Time only
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: formatStr.includes("a"),
    })
    formatted = formatter.format(dateObj)
  } else {
    // Fallback to full date and time
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    formatted = formatter.format(dateObj)
  }

  if (showTimezone && includesTime) {
    // Determine if DST is in effect
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIMEZONE,
      timeZoneName: "short",
    })
    const parts = formatter.formatToParts(dateObj)
    const tzName = parts.find((part) => part.type === "timeZoneName")?.value || "ET"
    return `${formatted} ${tzName}`
  }

  return formatted
}

/**
 * Format a date range in Eastern Time
 */
export function formatDateRangeInEasternTime(startDate: string | Date, endDate: string | Date): string {
  const start = formatInEasternTime(startDate, "MMM d, yyyy", false)
  const startTime = formatInEasternTime(startDate, "HH:mm", false)
  const endTime = formatInEasternTime(endDate, "HH:mm", true)

  return `${start} ${startTime} - ${endTime}`
}

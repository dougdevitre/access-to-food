// Shared .ics (iCalendar) builder + download, used by the Events and Volunteer
// pages so a user can add a distribution event or a volunteer shift to their
// own calendar app.

function formatICSDate(d: Date): string {
  // UTC basic format, e.g. 20260714T150000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escape per RFC 5545: backslash, comma, semicolon, and newlines.
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date; // defaults to start + 2h
  uid: string;
}

export function buildICS(ev: CalendarEvent): string {
  const end = ev.end ?? new Date(ev.start.getTime() + 2 * 60 * 60 * 1000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//access-to-food//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(ev.start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    ...(ev.location ? [`LOCATION:${escapeICS(ev.location)}`] : []),
    ...(ev.description ? [`DESCRIPTION:${escapeICS(ev.description)}`] : []),
    `UID:${ev.uid}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadICS(ev: CalendarEvent, filename: string): void {
  const blob = new Blob([buildICS(ev)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so the browser has started the download before the object URL
  // is released (revoking synchronously can cancel the download).
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

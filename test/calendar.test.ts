import { describe, it, expect } from 'vitest';
import { buildICS } from '../src/lib/calendar';

describe('buildICS', () => {
  const start = new Date('2026-07-14T15:00:00Z');

  it('produces a valid VEVENT with UTC times and escaped fields', () => {
    const ics = buildICS({
      title: 'Mobile Market, Downtown',
      description: 'Fresh produce; free to all',
      location: '123 Main St',
      start,
      uid: 'e1@access-to-food',
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20260714T150000Z');
    // default end is start + 2h
    expect(ics).toContain('DTEND:20260714T170000Z');
    // RFC 5545 escaping of comma and semicolon
    expect(ics).toContain('SUMMARY:Mobile Market\\, Downtown');
    expect(ics).toContain('DESCRIPTION:Fresh produce\\; free to all');
    expect(ics).toContain('LOCATION:123 Main St');
    expect(ics).toContain('UID:e1@access-to-food');
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('\r\n'); // CRLF line endings per spec
  });

  it('honors an explicit end time', () => {
    const ics = buildICS({ title: 'X', start, end: new Date('2026-07-14T16:30:00Z'), uid: 'u' });
    expect(ics).toContain('DTEND:20260714T163000Z');
  });

  it('omits optional lines when not provided', () => {
    const ics = buildICS({ title: 'No extras', start, uid: 'u2' });
    expect(ics).not.toContain('LOCATION:');
    expect(ics).not.toContain('DESCRIPTION:');
  });
});

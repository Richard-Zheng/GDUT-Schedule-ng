function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const zeroPad = (num: string | number, places: number) => String(num).padStart(places, '0')

function getICalDateTime(date: Date, useUTC = false) {
    if (useUTC) {
        return `${zeroPad(date.getUTCFullYear(), 4)}${zeroPad(date.getUTCMonth() + 1, 2)}${zeroPad(date.getUTCDate(), 2)}T${zeroPad(date.getUTCHours(), 2)}${zeroPad(date.getUTCMinutes(), 2)}${zeroPad(date.getUTCSeconds(), 2)}Z`;
    } else {
        return `${zeroPad(date.getFullYear(), 4)}${zeroPad(date.getMonth() + 1, 2)}${zeroPad(date.getDate(), 2)}T${zeroPad(date.getHours(), 2)}${zeroPad(date.getMinutes(), 2)}${zeroPad(date.getSeconds(), 2)}`;
    }
}

interface RRule {
    freq: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY',
    /** for x times */
    count?: number,
    until?: Date,
}

function getRecurrenceRuleString(rRule: RRule) {
    if (rRule.count) {
        return `RRULE:FREQ=${rRule.freq};COUNT=${rRule.count}`;
    } else {
        return `RRULE:FREQ=${rRule.freq};` + (rRule.until ? `UNTIL=${getICalDateTime(rRule.until)}` : '');
    }
}

function icsEvent(subject: string, start: Date, end: Date, tzid?: string, description?: string, location?: string, rrule?: string | RRule, transparency: 'TRANSPARENT' | 'OPAQUE' = 'OPAQUE', uid?: string) {
    return [
        'BEGIN:VEVENT',
        'UID:' + (uid ? uid : uuidv4()),
        'CLASS:PUBLIC',
        ...(description ? ['DESCRIPTION:' + description] : []),
        ...(rrule ? [typeof rrule === 'string' ? rrule : getRecurrenceRuleString(rrule)] : []),
        'DTSTAMP;VALUE=DATE-TIME:' + getICalDateTime(new Date()),
        tzid ? `DTSTART;TZID=${tzid}:${getICalDateTime(start)}` : `DTSTART:${getICalDateTime(start, true)}`,
        tzid ? `DTEND;TZID=${tzid}:${getICalDateTime(end)}` : `DTEND:${getICalDateTime(end, true)}`,
        ...(location ? ['LOCATION:' + location] : []),
        'SUMMARY:' + subject,
        'TRANSP:' + transparency,
        'END:VEVENT'
    ];
}

class ICSCalendar {
    calendarEvents: string[];
    calendarStart: string;
    calendarEnd: string;

    constructor() {
        this.calendarEvents = []
        this.calendarStart = [
            'BEGIN:VCALENDAR',
            'PRODID:-//citadel.org//NONSGML Citadel calendar//EN',
            'VERSION:2.0',
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Shanghai',
            'LAST-MODIFIED:20211207T194144Z',
            'X-LIC-LOCATION:Asia/Shanghai',
            'BEGIN:STANDARD',
            'TZNAME:CST',
            'TZOFFSETFROM:+0800',
            'TZOFFSETTO:+0800',
            'DTSTART:19700101T000000',
            'END:STANDARD',
            'END:VTIMEZONE',
        ].join('\r\n');
        this.calendarEnd = '\r\nEND:VCALENDAR';
    }

    addEvent(subject: string, start: Date, end: Date, tzid = 'Asia/Shanghai', description?: string, location?: string, rrule?: string | RRule, transparency: 'TRANSPARENT' | 'OPAQUE' = 'OPAQUE', uid?: string) {
        this.calendarEvents.push(icsEvent(subject, start, end, tzid, description, location, rrule, transparency, uid).join('\r\n'));
    }

    toString() {
        return this.calendarStart + '\r\n' + this.calendarEvents.join('\r\n') + this.calendarEnd;
    }
}

export { ICSCalendar }

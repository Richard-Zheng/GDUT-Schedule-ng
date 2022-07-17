function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const zeroPad = (num: string | number, places: number) => String(num).padStart(places, '0')

function getICalDateTime(date: Date) {
    return `${zeroPad(date.getFullYear(), 4)}${zeroPad(date.getMonth() + 1, 2)}${zeroPad(date.getDate(), 2)}T${zeroPad(date.getHours(), 2)}${zeroPad(date.getMinutes(), 2)}${zeroPad(date.getSeconds(), 2)}`;
}

interface RRule {
    freq: 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY',
    /** every x [freq] */
    interval: number,
    /** for x times */
    count?: number,
    until?: Date,
}

function getRecurrenceRuleString(rRule: RRule) {
    if (rRule.until) {
        return `RRULE:FREQ=${rRule.freq};INTERVAL=${rRule.interval};UNTIL=${getICalDateTime(rRule.until)}`;
    } else {
        return `RRULE:FREQ=${rRule.freq};INTERVAL=${rRule.interval};` + (rRule.count ? `COUNT=${rRule.count}` : '');
    }
}

function icsEvent(subject: string, start: Date, end: Date, description?: string, location?: string, rrule?: string | RRule, transparency: 'TRANSPARENT' | 'OPAQUE' = 'OPAQUE', uid?: string) {
    return [
        'BEGIN:VEVENT',
        'UID:' + (uid ? uid : uuidv4()),
        'CLASS:PUBLIC',
        ...(description ? ['DESCRIPTION:' + description] : []),
        ...(rrule ? [typeof rrule === 'string' ? rrule : getRecurrenceRuleString(rrule)] : []),
        'DTSTAMP;VALUE=DATE-TIME:' + getICalDateTime(new Date()),
        'DTSTART;VALUE=DATE-TIME:' + getICalDateTime(start),
        'DTEND;VALUE=DATE-TIME:' + getICalDateTime(end),
        ...(location ? ['LOCATION:' + location] : []),
        'SUMMARY:' + subject,
        'TRANSP:' + transparency,
        'END:VEVENT'
    ];
}

console.log(icsEvent('高等数学', new Date('2020-01-01 13:00'), new Date('2020-01-01 14:00'), '高等数学课程', '教1-101', {freq: 'WEEKLY', interval: 1, count: 2}));
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinutes = exports.getHours = exports.validateTime = exports.parseTime = exports.makeTimeOptions = exports.pmSuffix = exports.amSuffix = void 0;
exports.amSuffix = ' AM';
exports.pmSuffix = ' PM';
exports.makeTimeOptions = (stepMinutes, hour12, delimiter) => {
    const res = [];
    const iter = new Date(new Date().setHours(0, 0, 0, 0));
    const iterDay = iter.getDay();
    while (iter.getDay() === iterDay) {
        let hour = iter.getHours();
        let suffix = exports.amSuffix;
        if (hour12) {
            if (hour === 0) {
                hour = 12; // 12am
            }
            else if (hour >= 12) {
                suffix = exports.pmSuffix;
            }
            if (hour > 12) {
                hour %= 12;
            }
        }
        res.push((hour12 ? hour.toString() : hour.toString().padStart(2, '0')) +
            delimiter +
            iter
                .getMinutes()
                .toString()
                .padStart(2, '0') +
            (hour12 ? suffix : ''));
        iter.setMinutes(iter.getMinutes() + stepMinutes);
    }
    return res;
};
exports.parseTime = (time, timeRegex, delimiter, is12Hour) => {
    const date = new Date(time);
    // if default time is a ISO 8601 formatted date string, we parse it to hh:mm(am/pm) format
    if (!isNaN(date.getDate()) && (time instanceof Date || time.includes('T'))) {
        const hours = is12Hour
            ? `${date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}`
            : `${date.getHours()}`.padStart(2, '0');
        const minutes = `${date.getMinutes()}`.padStart(2, '0');
        let ampm = '';
        if (is12Hour && date.getHours() > 11) {
            ampm = exports.pmSuffix;
        }
        else if (is12Hour) {
            ampm = exports.amSuffix;
        }
        return `${hours}${delimiter}${minutes}${ampm}`;
    }
    else if (typeof time === 'string') {
        time = time.trim();
        if (is12Hour && time !== '' && exports.validateTime(time, timeRegex, delimiter, is12Hour)) {
            // Format AM/PM according to design
            let ampm = '';
            if (time.toUpperCase().includes(exports.amSuffix.toUpperCase().trim())) {
                time = time
                    .toUpperCase()
                    .replace(exports.amSuffix.toUpperCase().trim(), '')
                    .trim();
                ampm = exports.amSuffix;
            }
            else if (time.toUpperCase().includes(exports.pmSuffix.toUpperCase().trim())) {
                time = time
                    .toUpperCase()
                    .replace(exports.pmSuffix.toUpperCase().trim(), '')
                    .trim();
                ampm = exports.pmSuffix;
            }
            else {
                // if this 12 hour time is missing am/pm but otherwise valid,
                // append am/pm depending on time of day
                ampm = new Date().getHours() > 11 ? exports.pmSuffix : exports.amSuffix;
            }
            return `${time}${ampm}`;
        }
    }
    return time.toString();
};
exports.validateTime = (time, timeRegex, delimiter, is12Hour) => {
    // ISO 8601 format is valid
    const date = new Date(time);
    if (!isNaN(date.getDate()) && time.includes('T')) {
        return true;
    }
    // hours only valid if they are [0-23] or [0-12]
    const hours = parseInt(time.split(delimiter)[0]);
    const validHours = hours >= 0 && hours <= (is12Hour ? 12 : 23);
    // minutes verified by timeRegex
    // empty string is valid
    return time === '' || (timeRegex.test(time) && validHours);
};
exports.getHours = (time, timeRegex) => {
    const parts = time.match(timeRegex);
    if (parts && parts.length) {
        return /am/i.test(parts[4]) ? parseInt(parts[1]) : parseInt(parts[1]) + 12;
    }
    return null;
};
exports.getMinutes = (time, timeRegex) => {
    const parts = time.match(timeRegex);
    return parts && parts.length ? parseInt(parts[2]) : null;
};
//# sourceMappingURL=TimePickerUtils.js.map
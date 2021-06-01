export declare const amSuffix = " AM";
export declare const pmSuffix = " PM";
export declare const makeTimeOptions: (stepMinutes: number, hour12: boolean, delimiter: string) => string[];
export declare const parseTime: (time: string | Date, timeRegex: RegExp, delimiter: string, is12Hour: boolean) => string;
export declare const validateTime: (time: string, timeRegex: RegExp, delimiter: string, is12Hour: boolean) => boolean;
export declare const getHours: (time: string, timeRegex: RegExp) => number;
export declare const getMinutes: (time: string, timeRegex: RegExp) => number;
//# sourceMappingURL=TimePickerUtils.d.ts.map
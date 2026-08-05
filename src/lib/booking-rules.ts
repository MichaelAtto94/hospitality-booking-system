export type BookingState="PENDING"|"CONFIRMED"|"CHECKED_IN"|"CHECKED_OUT"|"CANCELLED"|"NO_SHOW";
export function calculateNights(checkIn:Date,checkOut:Date){const day=86_400_000;const start=Date.UTC(checkIn.getUTCFullYear(),checkIn.getUTCMonth(),checkIn.getUTCDate());const end=Date.UTC(checkOut.getUTCFullYear(),checkOut.getUTCMonth(),checkOut.getUTCDate());return Math.round((end-start)/day)}
export function calculateStayTotal(rate:number,nights:number){if(!Number.isFinite(rate)||rate<0)throw new Error("Invalid room rate");if(!Number.isInteger(nights)||nights<1)throw new Error("Invalid number of nights");return Math.round(rate*nights*100)/100}
export function dateRangesOverlap(firstStart:Date,firstEnd:Date,secondStart:Date,secondEnd:Date){return firstStart<secondEnd&&firstEnd>secondStart}
const transitions:Record<BookingState,BookingState[]>={PENDING:["CONFIRMED","CANCELLED"],CONFIRMED:["CHECKED_IN","CANCELLED","NO_SHOW"],CHECKED_IN:["CHECKED_OUT"],CHECKED_OUT:[],CANCELLED:[],NO_SHOW:[]};
export function canTransition(from:BookingState,to:BookingState){return transitions[from].includes(to)}

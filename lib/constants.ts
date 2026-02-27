export const FRANCHISES = [
  "MI",
  "CSK",
  "RCB",
  "KKR",
  "DC",
  "SRH",
  "RR",
  "PBKS",
  "GT",
  "LSG",
] as const;

export type Franchise = (typeof FRANCHISES)[number];

export const DEVICE_LIMIT = 13;

export const TEAM_PURSE_CR = 90;

export const AUCTION_START_TIMER_SECONDS = 30;

export const AUCTION_BID_TIMER_SECONDS = 15;

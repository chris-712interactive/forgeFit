export interface LocalWeekProgramClear {
  id: string;
  userId: string;
  /** Monday ISO date YYYY-MM-DD for the cleared plan week. */
  weekStartIso: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

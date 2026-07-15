export interface LocalWorkoutDayAssignment {
  id: string;
  userId: string;
  templateId: string;
  /** Local calendar date YYYY-MM-DD */
  scheduledDateIso: string;
  /** When true, hide the program workout card for this date on the hub. */
  replacesProgram: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

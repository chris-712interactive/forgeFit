export const MIN_PROFILE_AGE = 13;
export const MAX_PROFILE_AGE = 120;

export interface ProfileIdentityFields {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
}

function parseDateOnly(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function computeAgeFromDateOfBirth(
  dateOfBirth: string,
  asOf = new Date()
): number {
  const dob = parseDateOnly(dateOfBirth);
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export function isValidDateOfBirth(
  dateOfBirth: string,
  asOf = new Date()
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return false;
  }

  const dob = parseDateOnly(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }

  const age = computeAgeFromDateOfBirth(dateOfBirth, asOf);
  return age >= MIN_PROFILE_AGE && age <= MAX_PROFILE_AGE;
}

export function maxDateOfBirthIso(asOf = new Date()): string {
  const date = new Date(asOf);
  date.setFullYear(date.getFullYear() - MIN_PROFILE_AGE);
  return date.toISOString().slice(0, 10);
}

export function minDateOfBirthIso(asOf = new Date()): string {
  const date = new Date(asOf);
  date.setFullYear(date.getFullYear() - MAX_PROFILE_AGE);
  return date.toISOString().slice(0, 10);
}

export function profileFirstName(profile: ProfileIdentityFields): string | null {
  const first = profile.first_name?.trim();
  if (first) return first;

  const display = profile.display_name?.trim();
  if (!display) return null;

  return display.split(/\s+/)[0] ?? null;
}

export function profileFullName(profile: ProfileIdentityFields): string | null {
  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();

  if (first && last) {
    return `${first} ${last}`;
  }

  const display = profile.display_name?.trim();
  return display || first || last || null;
}

export function resolveProfileAge(
  profile: ProfileIdentityFields,
  asOf = new Date()
): number | null {
  if (profile.date_of_birth && isValidDateOfBirth(profile.date_of_birth, asOf)) {
    return computeAgeFromDateOfBirth(profile.date_of_birth, asOf);
  }

  if (profile.age != null && profile.age >= MIN_PROFILE_AGE) {
    return profile.age;
  }

  return null;
}

export function isBirthdayToday(
  dateOfBirth: string | null | undefined,
  asOf = new Date()
): boolean {
  if (!dateOfBirth) {
    return false;
  }

  const dob = parseDateOnly(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }

  return (
    dob.getMonth() === asOf.getMonth() && dob.getDate() === asOf.getDate()
  );
}

export function birthdayGreeting(firstName: string | null): string {
  const prefix = firstName ? `${firstName}, ` : "";
  return `${prefix}happy birthday! Hope your day is a good one — celebrate the work you've put in.`;
}

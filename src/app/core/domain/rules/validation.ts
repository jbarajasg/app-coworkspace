export type RuleCode =
  | 'INVALID_RANGE'
  | 'OUTSIDE_BUSINESS_HOURS'
  | 'DURATION_TOO_SHORT'
  | 'DURATION_TOO_LONG'
  | 'OVERLAP'
  | 'CAPACITY_EXCEEDED'
  | 'SPACE_UNAVAILABLE';

export interface RuleViolation {
  readonly code: RuleCode;
  readonly message: string;
}

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly violations: readonly RuleViolation[] };

export function invalid(violations: readonly RuleViolation[]): ValidationResult {
  return { valid: false, violations };
}

export const VALID: ValidationResult = { valid: true };

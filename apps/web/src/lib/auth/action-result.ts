/** Reads a string error from server-action result unions safely. */
export function readActionError(result: unknown): string | undefined {
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  ) {
    return (result as { error: string }).error;
  }
  return undefined;
}

export function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function asPositiveNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

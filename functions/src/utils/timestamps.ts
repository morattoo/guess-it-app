/**
 * Converts a Firestore Timestamp (or any timestamp-like value) to a plain
 * serializable object { seconds, nanoseconds } for consistent JSON responses.
 *
 * Without this conversion, Express serializes Firestore Timestamps as
 * { _seconds, _nanoseconds } (underscore-prefixed internal fields), which is
 * inconsistent with manually constructed timestamp objects.
 */
export const convertTimestamp = (
  timestamp: any,
): { seconds: number; nanoseconds: number } | null => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === "function") {
    return { seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds };
  }
  return timestamp;
};

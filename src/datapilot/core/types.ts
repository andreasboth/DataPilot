/**
 * DataPilot Platform Core Contracts & Base Types
 * Industry-agnostic, modular, Local-First Foundation
 */

export type UUID = string;
export type ISO8601Timestamp = string;

export function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function currentTimestamp(): ISO8601Timestamp {
  return new Date().toISOString();
}

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { success: true, value };
  },
  err<E>(error: E): Result<never, E> {
    return { success: false, error };
  },
};

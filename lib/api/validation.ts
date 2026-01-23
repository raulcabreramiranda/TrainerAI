import { z } from "zod";

const normalizeRequired = (value: unknown) =>
  value === undefined || value === null ? "" : value;

export const requiredString = (message: string) =>
  z.preprocess(normalizeRequired, z.string().min(1, message));

export const requiredTrimmedString = (message: string) =>
  z.preprocess(normalizeRequired, z.string().trim().min(1, message));

export const requiredEmail = (requiredMessage: string, invalidMessage: string) =>
  z.preprocess(
    normalizeRequired,
    z.string().trim().min(1, requiredMessage).email(invalidMessage)
  );

export const requiredMinString = (
  minLength: number,
  requiredMessage: string,
  minMessage: string
) =>
  z.preprocess(
    normalizeRequired,
    z.string().min(1, requiredMessage).min(minLength, minMessage)
  );

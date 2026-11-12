import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import { z } from 'zod';
import { ValidationError } from './errors.ts';

/**
 * Hono request validator that turns schema failures into a ValidationError,
 * so every endpoint returns the same 400 error shape.
 */
export const validate = <Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) throw new ValidationError(z.flattenError(result.error));
  });

/**
 * Application error hierarchy. Services throw these; the HTTP layer maps them to responses.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number = 500,
    readonly code: string = 'INTERNAL_ERROR',
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Invalid request', 400, 'VALIDATION_ERROR', details);
  }
}

import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      const firstError = error.issues[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        error: firstError,
        details: errorMessages,
      });
    }
    next(error);
  }
};

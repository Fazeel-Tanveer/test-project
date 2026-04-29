import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from './errors';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainException) {
      return res.status(exception.status).json({
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] }).message ?? exception.message;
      return res.status(status).json({
        code: 'VALIDATION_ERROR',
        message: Array.isArray(message) ? message.join('; ') : message,
      });
    }

    this.logger.error('Unhandled error', exception instanceof Error ? exception.stack : exception);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttp
      ? exception.getResponse()
      : { message: "Internal server error" };

    // Log errors (5xx) and warnings (4xx)
    if (status >= 500) {
      const err = exception as any;
      const msg = err?.message ?? String(err);

      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${msg}`,
        err?.stack,
        HttpExceptionFilter.name
      );

      // Log DB-specific context when available (Sequelize errors expose original + sql)
      if (err?.original) {
        const detail = err.original.detail ?? err.original.message;
        if (detail) this.logger.error(`DB detail: ${detail}`);
        if (err.sql) this.logger.error(`SQL: ${err.sql}`);
      }
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${
          typeof payload === "string" ? payload : JSON.stringify(payload)
        }`
      );
    }

    response.status(status).json({
      path: request.url,
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...((typeof payload === "string"
        ? { message: payload }
        : payload) as Record<string, unknown>),
    });
  }
}

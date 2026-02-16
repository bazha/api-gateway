import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface CommonException extends Error {
  details?: string;
  code?: number;
  status?: number;
}

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception: CommonException | HttpException | any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
    } else {
      // Handle gRPC errors
      const statusMap = {
        5: HttpStatus.NOT_FOUND,
        14: HttpStatus.SERVICE_UNAVAILABLE,
      };
      status =
        statusMap[exception?.code] ||
        exception?.status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception?.message || 'No details';
    }

    // Log error
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      message,
    };

    return response.status(status).json(errorResponse);
  }
}

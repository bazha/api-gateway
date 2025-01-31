import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

class CommonException extends HttpException {
  public details?: string;
  public code?: number;

  constructor(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    details?: string,
    code?: number,
  ) {
    super(message, statusCode);
    this.code = code;
    this.details = details;
  }
}

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: CommonException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      path: request.path,
    };

    const statusMap = {
      5: HttpStatus.NOT_FOUND,
      14: HttpStatus.SERVICE_UNAVAILABLE,
    };

    const status =
      statusMap[exception.code] ||
      exception.getStatus() ||
      HttpStatus.INTERNAL_SERVER_ERROR;

    const res = exception.getResponse();

    return response.status(status).json({
      ...errorResponse,
      details: exception?.message || res,
      statusCode: status,
    });
  }
}

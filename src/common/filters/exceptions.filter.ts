import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

interface CommonException extends Error{
  details: string,
  code: number,
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

    const status = statusMap[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR

    return response.status(status).json({
      ...errorResponse,
      details: exception.details,
      statusCode: status,
    });
  }
}

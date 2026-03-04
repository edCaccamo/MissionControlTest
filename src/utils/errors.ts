
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

export class NasaApiError extends AppError {
  constructor(message: string = "NASA API request failed") {
    super(message, 502);
    this.name = "NasaApiError";
  }
}

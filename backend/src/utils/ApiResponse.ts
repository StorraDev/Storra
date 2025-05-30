class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;

  constructor(statusCode: number, message: string = "Success", data: T) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export { ApiResponse };

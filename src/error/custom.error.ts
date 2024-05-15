import { EErrorCode } from '@enum';

class CustomError extends Error {
  public code: EErrorCode;

  constructor(code: EErrorCode, message: string) {
    super(message);

    this.code = code;
  }
}

export { CustomError };

import { EErrorCode } from '../enum';

export class CustomError extends Error {
  public code: EErrorCode;

  constructor(code: EErrorCode, message: string) {
    super(message);

    this.code = code;
  }
}

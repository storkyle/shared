import { EErrorCode } from '@enum';
import { CustomError } from '@error';
import { formatURL } from '@utilities';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class ExternalService {
  private _domain: string;

  constructor({ domain }: { domain: string }) {
    this._domain = domain;
  }

  // --- Protected: fetchData ---
  protected async fetchData<DataResponseType = { [key: string]: any }>(
    path: string,
    payload?: { [key: string]: any }
  ): Promise<{ data: DataResponseType | undefined; status: boolean }> {
    const url = formatURL(`${this._domain}${path}`);

    if (!url) {
      throw new CustomError(EErrorCode.INTERNAL_SERVER_ERROR, 'application.error.500');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-service-token': <string>process.env.X_SERVICE_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      return { data: undefined, status: false };
    }

    return { data: await response.json(), status: true };
  }

  // --- Public: healthCheck ---
  public async healthCheck(): Promise<boolean> {
    const { data: _data, status } = await this.fetchData<boolean>('/health-check');

    if (!status) {
      return false;
    }

    return true;
  }

  public async emitEvent<T = any>(eventName: string, target: T): Promise<boolean> {
    const { status } = await this.fetchData<boolean>('/hook/event', {
      event_name: eventName,
      target,
    });
    return status;
  }
}

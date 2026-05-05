declare module '@grpc/grpc-js' {
  export namespace credentials {
    function createInsecure(): unknown;
    function createSsl(): unknown;
  }
  export class Client {
    constructor(target: string, creds: unknown);
    makeUnaryRequest(method: string, serialize: unknown, deserialize: unknown, request: unknown, callback: unknown): void;
    close(): void;
  }
  export interface ChannelCredentials {}
  export interface ServiceError {
    message: string;
  }
}

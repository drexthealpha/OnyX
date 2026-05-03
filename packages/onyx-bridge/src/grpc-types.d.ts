declare module '@grpc/grpc-js' {
  export namespace credentials {
    function createInsecure(): any;
    function createSsl(): any;
  }
  export class Client {
    constructor(target: string, creds: any);
    makeUnaryRequest(method: string, serialize: any, deserialize: any, request: any, callback: any): void;
    close(): void;
  }
  export interface ChannelCredentials {}
  export interface ServiceError {
    message: string;
  }
}

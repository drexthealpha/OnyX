import type { X402PrivatePaymentParams, X402PaymentResult, X402PaymentVerification } from './types.js';
export declare function createPrivateX402Payment(params: X402PrivatePaymentParams): Promise<X402PaymentResult>;
export declare function processPrivateX402Payment(params: {
    paymentToken: string;
}): Promise<X402PaymentVerification>;
//# sourceMappingURL=x402-private.d.ts.map
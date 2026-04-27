import type { PaymentLink } from './types.js';
import type { UmbraClient } from './client.js';
export declare function createPaymentLink(params: Omit<PaymentLink, 'id' | 'url'>): PaymentLink;
export declare function parsePaymentLink(url: string): Omit<PaymentLink, 'url'>;
export declare function payFromLink(client: UmbraClient, link: PaymentLink): Promise<string[]>;
//# sourceMappingURL=payment-link.d.ts.map
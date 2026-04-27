import type { Invoice } from './types.js';
import type { UmbraClient } from './client.js';
export declare function createInvoice(params: Omit<Invoice, 'id' | 'status' | 'paymentLink'>): Invoice;
export declare function payInvoice(client: UmbraClient, invoice: Invoice): Promise<string[]>;
export declare function markInvoicePaid(invoice: Invoice, signatures: string[]): Invoice;
//# sourceMappingURL=billing.d.ts.map
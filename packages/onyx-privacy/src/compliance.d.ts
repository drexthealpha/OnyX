import type { ComplianceReport } from './types.js';
import type { UmbraClient } from './client.js';
export declare function grantViewingAccess(client: UmbraClient, auditorPublicKey: string): Promise<string>;
export declare function revokeViewingAccess(client: UmbraClient, auditorPublicKey: string): Promise<string>;
export declare function generateComplianceReport(client: UmbraClient, viewingKey: string, startTimestamp: number, endTimestamp: number): Promise<ComplianceReport>;
//# sourceMappingURL=compliance.d.ts.map
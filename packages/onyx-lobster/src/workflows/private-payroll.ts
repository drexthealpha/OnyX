import { Pipeline } from '../pipeline.js';
import { umbraShield } from '../stdlib/umbra-shield.js';

const USDC_MINT = process.env.USDC_MINT ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export interface Employee {
  address: string;
  amountUsdc: number;
}

export async function runPayroll(employees: Employee[]): Promise<void> {
  for (const employee of employees) {
    const amountLamports = BigInt(Math.round(employee.amountUsdc * 1_000_000));

    const pipeline = new Pipeline()
      .step('shield-usdc', async (_input) => {
        const receipt = await umbraShield(USDC_MINT, amountLamports);
        return { employee: employee.address, receipt, amountUsdc: employee.amountUsdc };
      })
      .step('store-record', async (input) => {
        const mem = await import('@onyx/mem');
        const record = input as { employee: string; receipt: { signature: string }; amountUsdc: number };
        await mem.store(`payroll:${record.employee}:${Date.now()}`, JSON.stringify({
          address: record.employee,
          amountUsdc: record.amountUsdc,
          signature: record.receipt.signature,
          paidAt: new Date().toISOString(),
        }));
        return record;
      });

    const result = await pipeline.run(employee);
    if (!result.success) {
      throw new Error(`Payroll failed for ${employee.address}: ${result.steps.find(s => !s.success)?.error}`);
    }
  }
}
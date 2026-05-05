import { 
  address, 
  appendTransactionMessageInstruction, 
  createSolanaRpc, 
  createTransactionMessage, 
  fetchEncodedAccount, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  Address,
  Rpc,
  SolanaRpcApi,
  TransactionSigner,
} from '@solana/kit';
import { getStructCodec, getBytesCodec, getU8Codec, getU64Codec } from '@solana/codecs';
import { IKA_PROGRAM_ID, DISC_GAS_DEPOSIT, GAS_DEPOSIT_LEN, GasDepositOptions } from './types';

export async function getGasDepositPda(userPubkey: Uint8Array, programId?: string): Promise<[Address, number]> {
  const programIdObj = address(programId || IKA_PROGRAM_ID);
  const { getProgramDerivedAddress } = await import('@solana/addresses');
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: programIdObj,
    seeds: [new TextEncoder().encode('gas_deposit'), userPubkey],
  });
  return [pda, bump];
}

export const INSTRUCTION_CREATE_DEPOSIT = 36;
export const INSTRUCTION_TOP_UP = 37;
export const INSTRUCTION_REQUEST_WITHDRAW = 44;
export const INSTRUCTION_WITHDRAW = 45;

export const IKA_BALANCE_OFFSET = 34;
export const SOL_BALANCE_OFFSET = 42;

export async function createGasDeposit(options: GasDepositOptions): Promise<string> {
  const { rpc, userPubkey, amountLamports, isIkaBalance, payer } = options;
  
  const [gasDepositPda, bump] = await getGasDepositPda(userPubkey);
  
  // Doc layout: disc(1) + bump(1) + enc_amount(8 LE u64) + gas_amount(8 LE u64) = 18 bytes
  const data = new Uint8Array(18);
  const view = new DataView(data.buffer);
  view.setUint8(0, INSTRUCTION_CREATE_DEPOSIT);
  view.setUint8(1, bump);
  view.setBigUint64(2, amountLamports, true);
  view.setBigUint64(10, 0n, true); // gas_amount — caller may top up separately
  const instructionData = data;
  
  const programId = address(IKA_PROGRAM_ID);
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: programId,
          accounts: [
            { address: gasDepositPda, role: 3 },
            { address: payer.address, role: 3 },
            { address: address('11111111111111111111111111111111'), role: 0 },
          ],
          data: instructionData,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function topUpGasDeposit(options: GasDepositOptions): Promise<string> {
  const { rpc, userPubkey, amountLamports, isIkaBalance, payer } = options;
  
  const [gasDepositPda] = await getGasDepositPda(userPubkey);
  
  // Doc layout: disc(1) + enc_amount(8 LE u64) + gas_amount(8 LE u64) = 17 bytes
  const data = new Uint8Array(17);
  const view = new DataView(data.buffer);
  view.setUint8(0, INSTRUCTION_TOP_UP);
  view.setBigUint64(1, amountLamports, true);
  view.setBigUint64(9, 0n, true); // gas_amount
  const instructionData = data;
  
  const programId = address(IKA_PROGRAM_ID);
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: programId,
          accounts: [
            { address: gasDepositPda, role: 3 },
            { address: payer.address, role: 3 },
            { address: address('11111111111111111111111111111111'), role: 0 },
          ],
          data: instructionData,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function requestWithdraw(options: {
  rpc: Rpc<SolanaRpcApi>;
  userPubkey: Uint8Array;
  recipient: Address;
  amountLamports: bigint;
  payer: TransactionSigner;
}): Promise<string> {
  const { rpc, userPubkey, recipient, amountLamports, payer } = options;
  
  const [gasDepositPda] = await getGasDepositPda(userPubkey);
  
  const { fixCodecSize } = await import('@solana/codecs');
  const requestWithdrawIxCodec = getStructCodec([
    ['discriminator', getU8Codec()],
    ['padding', fixCodecSize(getBytesCodec(), 2)],
    ['amount', getU64Codec()],
    ['recipient', fixCodecSize(getBytesCodec(), 32)],
  ]);

  const { getAddressEncoder } = await import('@solana/addresses');
  const instructionData = requestWithdrawIxCodec.encode({
    discriminator: INSTRUCTION_REQUEST_WITHDRAW,
    padding: new Uint8Array(2),
    amount: BigInt(amountLamports),
    recipient: getAddressEncoder().encode(recipient),
  });
  
  const programId = address(IKA_PROGRAM_ID);
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: programId,
          accounts: [
            { address: gasDepositPda, role: 3 },
            { address: payer.address, role: 1 },
          ],
          data: instructionData,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function withdrawGas(options: {
  rpc: Rpc<SolanaRpcApi>;
  userPubkey: Uint8Array;
  recipient: Address;
  amountLamports: bigint;
  payer: TransactionSigner;
}): Promise<string> {
  const { rpc, userPubkey, recipient, amountLamports, payer } = options;
  
  const [gasDepositPda] = await getGasDepositPda(userPubkey);
  
  const { fixCodecSize } = await import('@solana/codecs');
  const withdrawIxCodec = getStructCodec([
    ['discriminator', getU8Codec()],
    ['padding', fixCodecSize(getBytesCodec(), 2)],
    ['amount', getU64Codec()],
    ['recipient', fixCodecSize(getBytesCodec(), 32)],
  ]);

  const { getAddressEncoder } = await import('@solana/addresses');
  const instructionData = withdrawIxCodec.encode({
    discriminator: INSTRUCTION_WITHDRAW,
    padding: new Uint8Array(2),
    amount: BigInt(amountLamports),
    recipient: getAddressEncoder().encode(recipient),
  });
  
  const programId = address(IKA_PROGRAM_ID);
  
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress: programId,
          accounts: [
            { address: gasDepositPda, role: 3 },
            { address: recipient, role: 3 },
            { address: payer.address, role: 1 },
          ],
          data: instructionData,
        },
        m,
      ),
  );

  const fullySignedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  const { getBase64EncodedWireTransaction } = await import('@solana/transactions');
  const wireTransaction = getBase64EncodedWireTransaction(fullySignedTransaction);
  
  return await rpc.sendTransaction(wireTransaction).send();
}

export async function readGasDepositBalance(rpc: Rpc<SolanaRpcApi>, userPubkey: Uint8Array): Promise<{
  ikaBalance: bigint;
  solBalance: bigint;
}> {
  const [gasDepositPda] = await getGasDepositPda(userPubkey);
  
  try {
    const account = await fetchEncodedAccount(rpc, gasDepositPda);
    if (!account.exists || account.data.length < GAS_DEPOSIT_LEN) {
      return { ikaBalance: 0n, solBalance: 0n };
    }
    
    const data = account.data;
    const discriminator = data[0];
    
    if (discriminator !== DISC_GAS_DEPOSIT) {
      return { ikaBalance: 0n, solBalance: 0n };
    }
    
    const balanceCodec = getStructCodec([
      ['ikaBalance', getU64Codec()],
      ['solBalance', getU64Codec()],
    ]);
    
    const balances = balanceCodec.decode(data.subarray(34, 50));
    
    return { ikaBalance: balances.ikaBalance, solBalance: balances.solBalance };
  } catch {
    return { ikaBalance: 0n, solBalance: 0n };
  }
}
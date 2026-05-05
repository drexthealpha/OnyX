use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};

declare_id!("8tsJQaXZQGRdwUo28dicc9XwSMuCkbeiRvr9KYGcWpFs");

#[cfg(not(feature = "no-entrypoint"))]
solana_security_txt::security_txt! {
    name: "OnyX FHE Vault",
    project_url: "https://onyx.os",
    contacts: "email:security@onyx.os",
    policy: "https://github.com/drexthealpha/onyx/blob/main/SECURITY.md",
    preferred_languages: "en",
    source_code: "https://github.com/drexthealpha/onyx"
}

pub const CPI_AUTHORITY_SEED: &[u8] = b"__encrypt_cpi_authority";
pub const DISC_CREATE_PLAINTEXT: u8 = 2;
pub const DISC_EXECUTE_GRAPH: u8 = 4;

#[program]
pub mod onyx_fhe_vault {
    use super::*;

    /// create_vault — initializes two ciphertext accounts to encrypted zero
    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_id: [u8; 32],
        cpi_authority_bump: u8,
    ) -> Result<()> {
        let encrypt_pid = ctx.accounts.encrypt_accounts.encrypt_program.key();
        let seeds: &[&[u8]] = &[CPI_AUTHORITY_SEED, &[cpi_authority_bump]];
        let signer_seeds = &[seeds];

        // create_plaintext_ciphertext data: [disc=2][fhe_type=4(EUint64)][0u64 LE]
        let mut ix_data = vec![DISC_CREATE_PLAINTEXT, 4u8];
        ix_data.extend_from_slice(&0u64.to_le_bytes());

        // Initialize from_balance ciphertext = encrypted 0
        invoke_signed(
            &Instruction {
                program_id: encrypt_pid,
                accounts: build_plaintext_metas(
                    &ctx.accounts.encrypt_accounts,
                    ctx.accounts.from_balance_ct.key(),
                ),
                data: ix_data.clone(),
            },
            &build_plaintext_infos(
                &ctx.accounts.encrypt_accounts,
                ctx.accounts.from_balance_ct.to_account_info(),
            ),
            signer_seeds,
        )?;

        // Initialize to_balance ciphertext = encrypted 0
        invoke_signed(
            &Instruction {
                program_id: encrypt_pid,
                accounts: build_plaintext_metas(
                    &ctx.accounts.encrypt_accounts,
                    ctx.accounts.to_balance_ct.key(),
                ),
                data: ix_data,
            },
            &build_plaintext_infos(
                &ctx.accounts.encrypt_accounts,
                ctx.accounts.to_balance_ct.to_account_info(),
            ),
            signer_seeds,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.vault_id = vault_id;
        vault.from_balance = ctx.accounts.from_balance_ct.key().to_bytes();
        vault.to_balance = ctx.accounts.to_balance_ct.key().to_bytes();
        vault.bump = ctx.bumps.vault;

        emit!(VaultCreated {
            vault: ctx.accounts.vault.key(),
            from_ct: ctx.accounts.from_balance_ct.key(),
            to_ct: ctx.accounts.to_balance_ct.key(),
        });
        Ok(())
    }

    /// execute_transfer — forwards pre-built FHE graph bytes to Encrypt program CPI
    /// The TypeScript client builds the graph_bytes (transfer conditional graph)
    pub fn execute_transfer(
        ctx: Context<ExecuteTransfer>,
        cpi_authority_bump: u8,
        graph_bytes: Vec<u8>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        require!(
            vault.authority == ctx.accounts.authority.key(),
            VaultError::Unauthorized
        );
        require!(
            ctx.accounts.from_balance_ct.key().to_bytes() == vault.from_balance,
            VaultError::InvalidCiphertext
        );
        require!(
            ctx.accounts.to_balance_ct.key().to_bytes() == vault.to_balance,
            VaultError::InvalidCiphertext
        );

        let encrypt_pid = ctx.accounts.encrypt_accounts.encrypt_program.key();
        let seeds: &[&[u8]] = &[CPI_AUTHORITY_SEED, &[cpi_authority_bump]];
        let signer_seeds = &[seeds];

        // execute_graph ix data: [disc=4][graph_len u16 LE][graph_bytes][num_inputs=3 u16 LE]
        let mut ix_data = Vec::new();
        ix_data.push(DISC_EXECUTE_GRAPH);
        ix_data.extend_from_slice(&(graph_bytes.len() as u16).to_le_bytes());
        ix_data.extend_from_slice(&graph_bytes);
        ix_data.extend_from_slice(&3u16.to_le_bytes()); // 3 inputs: from, to, amount

        let enc = &ctx.accounts.encrypt_accounts;

        // Account order for execute_graph CPI path
        let accounts = vec![
            AccountMeta::new_readonly(enc.config.key(), false),
            AccountMeta::new(enc.deposit.key(), false),
            AccountMeta::new_readonly(enc.cpi_authority.key(), false),
            AccountMeta::new_readonly(enc.caller_program.key(), false),
            AccountMeta::new_readonly(enc.network_encryption_key.key(), false),
            AccountMeta::new(enc.payer.key(), true),
            AccountMeta::new_readonly(enc.event_authority.key(), false),
            AccountMeta::new_readonly(enc.encrypt_program.key(), false),
            // inputs (read-only)
            AccountMeta::new_readonly(ctx.accounts.from_balance_ct.key(), false),
            AccountMeta::new_readonly(ctx.accounts.to_balance_ct.key(), false),
            AccountMeta::new_readonly(ctx.accounts.amount_ct.key(), false),
            // outputs (writable — update mode overwrites same accounts)
            AccountMeta::new(ctx.accounts.from_balance_ct.key(), false),
            AccountMeta::new(ctx.accounts.to_balance_ct.key(), false),
        ];

        invoke_signed(
            &Instruction {
                program_id: encrypt_pid,
                accounts,
                data: ix_data,
            },
            &[
                enc.config.to_account_info(),
                enc.deposit.to_account_info(),
                enc.cpi_authority.to_account_info(),
                enc.caller_program.to_account_info(),
                enc.network_encryption_key.to_account_info(),
                enc.payer.to_account_info(),
                enc.event_authority.to_account_info(),
                enc.encrypt_program.to_account_info(),
                ctx.accounts.from_balance_ct.to_account_info(),
                ctx.accounts.to_balance_ct.to_account_info(),
                ctx.accounts.amount_ct.to_account_info(),
            ],
            signer_seeds,
        )?;

        emit!(TransferExecuted {
            vault: ctx.accounts.vault.key()
        });
        Ok(())
    }
}

// ── Helpers ───────────────────────────────────────────────────
fn build_plaintext_metas(enc: &EncryptAccounts, ciphertext: Pubkey) -> Vec<AccountMeta> {
    vec![
        AccountMeta::new_readonly(enc.config.key(), false),
        AccountMeta::new(enc.deposit.key(), false),
        AccountMeta::new(ciphertext, false),
        AccountMeta::new_readonly(enc.cpi_authority.key(), false),
        AccountMeta::new_readonly(enc.network_encryption_key.key(), false),
        AccountMeta::new(enc.payer.key(), true),
        AccountMeta::new_readonly(enc.system_program.key(), false),
        AccountMeta::new_readonly(enc.event_authority.key(), false),
        AccountMeta::new_readonly(enc.encrypt_program.key(), false),
    ]
}

fn build_plaintext_infos<'info>(
    enc: &EncryptAccounts<'info>,
    ct: AccountInfo<'info>,
) -> Vec<AccountInfo<'info>> {
    vec![
        enc.config.to_account_info(),
        enc.deposit.to_account_info(),
        ct,
        enc.cpi_authority.to_account_info(),
        enc.network_encryption_key.to_account_info(),
        enc.payer.to_account_info(),
        enc.system_program.to_account_info(),
        enc.event_authority.to_account_info(),
        enc.encrypt_program.to_account_info(),
    ]
}

// ── Account Structs ───────────────────────────────────────────
#[derive(Accounts)]
#[instruction(vault_id: [u8; 32])]
pub struct CreateVault<'info> {
    #[account(
        init, payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", vault_id.as_ref()], bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: fresh keypair, Encrypt program creates it
    #[account(mut)]
    pub from_balance_ct: UncheckedAccount<'info>,
    /// CHECK: fresh keypair, Encrypt program creates it
    #[account(mut)]
    pub to_balance_ct: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub encrypt_accounts: EncryptAccounts<'info>,
}

#[derive(Accounts)]
pub struct ExecuteTransfer<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
    /// CHECK: validated against vault.from_balance
    #[account(mut)]
    pub from_balance_ct: UncheckedAccount<'info>,
    /// CHECK: validated against vault.to_balance
    #[account(mut)]
    pub to_balance_ct: UncheckedAccount<'info>,
    /// CHECK: EUint64 ciphertext from Encrypt gRPC
    #[account(mut)]
    pub amount_ct: UncheckedAccount<'info>,
    pub encrypt_accounts: EncryptAccounts<'info>,
}

#[derive(Accounts)]
pub struct EncryptAccounts<'info> {
    /// CHECK: Encrypt program 4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8
    pub encrypt_program: UncheckedAccount<'info>,
    /// CHECK: EncryptConfig PDA seeds=[b"encrypt_config"]
    pub config: UncheckedAccount<'info>,
    /// CHECK: EncryptDeposit PDA seeds=[b"encrypt_deposit", payer]
    #[account(mut)]
    pub deposit: UncheckedAccount<'info>,
    /// CHECK: CPI authority PDA seeds=[b"__encrypt_cpi_authority"] from THIS program
    pub cpi_authority: UncheckedAccount<'info>,
    /// CHECK: This program's executable account
    pub caller_program: UncheckedAccount<'info>,
    /// CHECK: NetworkEncryptionKey PDA
    pub network_encryption_key: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: event authority PDA seeds=[b"__event_authority"]
    pub event_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// ── State ─────────────────────────────────────────────────────
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub vault_id: [u8; 32],
    pub from_balance: [u8; 32],
    pub to_balance: [u8; 32],
    pub bump: u8,
}

// ── Events ────────────────────────────────────────────────────
#[event]
pub struct VaultCreated {
    pub vault: Pubkey,
    pub from_ct: Pubkey,
    pub to_ct: Pubkey,
}

#[event]
pub struct TransferExecuted {
    pub vault: Pubkey,
}

// ── Errors ────────────────────────────────────────────────────
#[error_code]
pub enum VaultError {
    #[msg("Signer is not the vault authority")]
    Unauthorized,
    #[msg("Ciphertext account does not match vault state")]
    InvalidCiphertext,
}

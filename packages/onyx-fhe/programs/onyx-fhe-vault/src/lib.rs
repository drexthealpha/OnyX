use anchor_lang::prelude::*;
use encrypt_anchor::EncryptContext;
use encrypt_dsl::prelude::encrypt_fn;
use encrypt_types::encrypted::EUint64;
use encrypt_types::types::Uint64;

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

#[encrypt_fn]
fn transfer_graph(from: EUint64, to: EUint64, amount: EUint64) -> (EUint64, EUint64) {
    let has_funds = from >= amount;
    let new_from = if has_funds { from - amount } else { from };
    let new_to = if has_funds { to + amount } else { to };
    (new_from, new_to)
}

#[program]
pub mod onyx_fhe_vault {
    use super::*;

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_id: [u8; 32],
        cpi_authority_bump: u8,
    ) -> Result<()> {
        // Validate Encrypt Program ID
        require_keys_eq!(
            ctx.accounts.encrypt_program.key(),
            "4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8".parse::<Pubkey>().unwrap(),
            VaultError::InvalidEncryptProgram
        );

        let encrypt_ctx = EncryptContext {
            encrypt_program: ctx.accounts.encrypt_program.to_account_info(),
            config: ctx.accounts.config.to_account_info(),
            deposit: ctx.accounts.deposit.to_account_info(),
            cpi_authority: ctx.accounts.cpi_authority.to_account_info(),
            caller_program: ctx.accounts.onyx_fhe_vault.to_account_info(),
            network_encryption_key: ctx.accounts.network_encryption_key.to_account_info(),
            payer: ctx.accounts.authority.to_account_info(),
            event_authority: ctx.accounts.event_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            cpi_authority_bump,
        };

        // Initialize balances to encrypted zero
        encrypt_ctx.create_plaintext_typed::<Uint64>(&0u64, &ctx.accounts.from_balance_ct)?;
        encrypt_ctx.create_plaintext_typed::<Uint64>(&0u64, &ctx.accounts.to_balance_ct)?;

        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.vault_id = vault_id;
        vault.from_balance = ctx.accounts.from_balance_ct.key();
        vault.to_balance = ctx.accounts.to_balance_ct.key();
        vault.bump = ctx.bumps.vault;

        Ok(())
    }

    pub fn execute_transfer(
        ctx: Context<ExecuteTransfer>,
        cpi_authority_bump: u8,
    ) -> Result<()> {
        // Validate Encrypt Program ID
        require_keys_eq!(
            ctx.accounts.encrypt_program.key(),
            "4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8".parse::<Pubkey>().unwrap(),
            VaultError::InvalidEncryptProgram
        );

        let vault = &ctx.accounts.vault;
        require!(
            vault.authority == ctx.accounts.authority.key(),
            VaultError::Unauthorized
        );

        let encrypt_ctx = EncryptContext {
            encrypt_program: ctx.accounts.encrypt_program.to_account_info(),
            config: ctx.accounts.config.to_account_info(),
            deposit: ctx.accounts.deposit.to_account_info(),
            cpi_authority: ctx.accounts.cpi_authority.to_account_info(),
            caller_program: ctx.accounts.onyx_fhe_vault.to_account_info(),
            network_encryption_key: ctx.accounts.network_encryption_key.to_account_info(),
            payer: ctx.accounts.authority.to_account_info(),
            event_authority: ctx.accounts.event_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            cpi_authority_bump,
        };

        let from_ct = ctx.accounts.from_balance_ct.to_account_info();
        let to_ct = ctx.accounts.to_balance_ct.to_account_info();
        let amount_ct = ctx.accounts.amount_ct.to_account_info();

        // Update mode: from_ct and to_ct are both inputs AND outputs
        encrypt_ctx.transfer_graph(
            from_ct.clone(), 
            to_ct.clone(), 
            amount_ct,
            from_ct,
            to_ct,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(vault_id: [u8; 32], cpi_authority_bump: u8)]
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
    
    // Encrypt CPI Accounts
    /// CHECK: 4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8
    pub encrypt_program: UncheckedAccount<'info>,
    /// CHECK: ["encrypt_config"]
    #[account(
        seeds = [b"encrypt_config"],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub config: UncheckedAccount<'info>,
    /// CHECK: ["encrypt_deposit", authority]
    #[account(
        mut,
        seeds = [b"encrypt_deposit", authority.key().as_ref()],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub deposit: UncheckedAccount<'info>,
    /// CHECK: ["__encrypt_cpi_authority"]
    #[account(
        seeds = [b"__encrypt_cpi_authority"],
        bump = cpi_authority_bump
    )]
    pub cpi_authority: UncheckedAccount<'info>,
    /// CHECK: ["network_encryption_key", key]
    #[account(
        seeds = [b"network_encryption_key", config.to_account_info().data.borrow()[2..34].as_ref()],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub network_encryption_key: UncheckedAccount<'info>,
    /// CHECK: ["__event_authority"]
    #[account(
        seeds = [b"__event_authority"],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub event_authority: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub onyx_fhe_vault: Program<'info, crate::program::OnyxFheVault>,
}

#[derive(Accounts)]
#[instruction(cpi_authority_bump: u8)]
pub struct ExecuteTransfer<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub authority: Signer<'info>,
    /// CHECK: validated in logic
    #[account(mut)]
    pub from_balance_ct: UncheckedAccount<'info>,
    /// CHECK: validated in logic
    #[account(mut)]
    pub to_balance_ct: UncheckedAccount<'info>,
    /// CHECK: amount ciphertext
    pub amount_ct: UncheckedAccount<'info>,

    // Encrypt CPI Accounts
    /// CHECK: 4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8
    pub encrypt_program: UncheckedAccount<'info>,
    /// CHECK: ["encrypt_config"]
    #[account(
        seeds = [b"encrypt_config"],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub config: UncheckedAccount<'info>,
    /// CHECK: ["encrypt_deposit", authority]
    #[account(
        mut,
        seeds = [b"encrypt_deposit", authority.key().as_ref()],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub deposit: UncheckedAccount<'info>,
    /// CHECK: ["__encrypt_cpi_authority"]
    #[account(
        seeds = [b"__encrypt_cpi_authority"],
        bump = cpi_authority_bump
    )]
    pub cpi_authority: UncheckedAccount<'info>,
    /// CHECK: ["network_encryption_key", key]
    #[account(
        seeds = [b"network_encryption_key", config.to_account_info().data.borrow()[2..34].as_ref()],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub network_encryption_key: UncheckedAccount<'info>,
    /// CHECK: ["__event_authority"]
    #[account(
        seeds = [b"__event_authority"],
        seeds::program = encrypt_program.key(),
        bump
    )]
    pub event_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub onyx_fhe_vault: Program<'info, crate::program::OnyxFheVault>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub vault_id: [u8; 32],
    pub from_balance: Pubkey,
    pub to_balance: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum VaultError {
    #[msg("Signer is not the vault authority")]
    Unauthorized,
    #[msg("Ciphertext account does not match vault state")]
    InvalidCiphertext,
    #[msg("Invalid Encrypt program ID")]
    InvalidEncryptProgram,
}

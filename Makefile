.PHONY: setup-localnet start-validator clean

setup-localnet:
	@echo "Setting up local testnet..."

start-validator:
	@echo "Starting solana-test-validator and cloning upgradeable programs (Ika & Encrypt)..."
	solana-test-validator \
		--clone-upgradeable-program 87W54kGYFQ1rgWqMeu4XTPHWXWmXSQCcjm8vCTfiq1oY \
		--clone-upgradeable-program 4ebfzWdKnrnGseuQpezXdG8yCdHqwQ1SSBHD3bWArND8 \
		--url devnet \
		--reset

clean:
	rm -rf test-ledger

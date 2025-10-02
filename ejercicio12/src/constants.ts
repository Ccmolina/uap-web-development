
import { FAUCET_TOKEN_ABI, FAUCET_TOKEN_ADDRESS } from './lib/abi/faucetToken'

export const CONTRACT = {
  address: FAUCET_TOKEN_ADDRESS,
  abi: FAUCET_TOKEN_ABI
} as const

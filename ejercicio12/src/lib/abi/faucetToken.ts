
import type { Abi, Address } from 'viem'

export const FAUCET_TOKEN_ADDRESS =
  '0x3e2117c19a921507ead57494bbf29032f33c7412' as const satisfies Address

export const FAUCET_TOKEN_ABI = [
  { type:'function', stateMutability:'view', name:'name',     inputs:[], outputs:[{type:'string',name:''}] },
  { type:'function', stateMutability:'view', name:'symbol',   inputs:[], outputs:[{type:'string',name:''}] },
  { type:'function', stateMutability:'view', name:'decimals', inputs:[], outputs:[{type:'uint8', name:''}] },
  { type:'function', stateMutability:'view', name:'balanceOf', inputs:[{type:'address',name:'account'}], outputs:[{type:'uint256',name:''}] },
  { type:'function', stateMutability:'nonpayable', name:'claimTokens', inputs:[], outputs:[] },
  { type:'function', stateMutability:'view', name:'hasAddressClaimed', inputs:[{type:'address',name:'account'}], outputs:[{type:'bool',name:''}] },
  { type:'function', stateMutability:'view', name:'getFaucetUsers', inputs:[], outputs:[{type:'address[]',name:''}] },
  { type:'function', stateMutability:'view', name:'getFaucetAmount', inputs:[], outputs:[{type:'uint256',name:''}] }
] as const satisfies Abi

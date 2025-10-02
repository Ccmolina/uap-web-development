import { useEffect, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits } from "viem";
import toast, { Toaster } from "react-hot-toast";
import { useWeb3Modal } from "@web3modal/wagmi/react";

import { CONTRACT } from "./constants"; // address + abi
import { FAUCET_TOKEN_ADDRESS } from "./lib/abi/faucetToken"; // solo para mostrar en footer
import "./styles.css";

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="addr">{children}</span>
}

export default function App() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWeb3Modal();
  const { switchChain, isPending: switching } = useSwitchChain();

 
  const { data: name }     = useReadContract({ address: CONTRACT.address, abi: CONTRACT.abi, functionName: "name" });
  const { data: symbol }   = useReadContract({ address: CONTRACT.address, abi: CONTRACT.abi, functionName: "symbol" });
  const { data: decimals } = useReadContract({ address: CONTRACT.address, abi: CONTRACT.abi, functionName: "decimals" });

  const { data: faucetAmount, refetch: refetchAmount } =
    useReadContract({ address: CONTRACT.address, abi: CONTRACT.abi, functionName: "getFaucetAmount" });

  const { data: userBalance, refetch: refetchBalance } =
    useReadContract({
      address: CONTRACT.address,
      abi: CONTRACT.abi,
      functionName: "balanceOf",
      args: address ? ([address] as const) : undefined,
      query: { enabled: !!address }
    });

  const { data: hasClaimed, refetch: refetchHasClaimed } =
    useReadContract({
      address: CONTRACT.address,
      abi: CONTRACT.abi,
      functionName: "hasAddressClaimed",
      args: address ? ([address] as const) : undefined,
      query: { enabled: !!address }
    });

  const { data: faucetUsers, refetch: refetchUsers } =
    useReadContract({ address: CONTRACT.address, abi: CONTRACT.abi, functionName: "getFaucetUsers" });

 
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function onClaim() {
    if (!isConnected) return toast.error("Conecta una wallet primero");
    if (chainId !== sepolia.id) return toast.error("Cámbiate a Sepolia (11155111)");
    if (hasClaimed) return toast("Ya reclamaste tus tokens ✨");

    try {
      await writeContractAsync({
        address: CONTRACT.address as `0x${string}`,
        abi: CONTRACT.abi,
        functionName: "claimTokens",
        args: [] as const,
        account: address as `0x${string}`,
        chain: sepolia
      });
    } catch (err: any) {
      toast.error(err?.shortMessage ?? err?.message ?? "Error al firmar");
    }
  }


  useEffect(() => { if (isPending)     toast.loading("Firmando transacción…",      { id: "tx" }) }, [isPending]);
  useEffect(() => { if (isConfirming)  toast.loading("Confirmando en blockchain…", { id: "tx" }) }, [isConfirming]);
  useEffect(() => { if (isSuccess)     toast.success("¡Tokens reclamados! 🎉",      { id: "tx" }) }, [isSuccess]);

  
  useEffect(() => {
    if (isSuccess) { refetchBalance(); refetchHasClaimed(); refetchUsers(); refetchAmount(); }
  }, [isSuccess, refetchBalance, refetchHasClaimed, refetchUsers, refetchAmount]);

  const d = decimals as number | undefined;
  const fmt = (v?: bigint) => (v != null && d != null ? Number(formatUnits(v, d)).toLocaleString() : "—");

  const canClaim = useMemo(() => {
    if (!isConnected) return false;
    if (chainId !== sepolia.id) return false;
    if (hasClaimed === true) return false;
    return !(isPending || isConfirming);
  }, [isConnected, chainId, hasClaimed, isPending, isConfirming]);

  return (
    <>
      <Toaster position="top-right" />
      <header className="header">
        <div className="brand">
          <h1 className="title">Faucet Token dApp</h1>
          <p className="subtitle">Sepolia Testnet</p>
        </div>
        <div className="actions">
          {!isConnected ? (
            <button className="btn btn-primary" onClick={() => open()}>
              Conectar Wallet
            </button>
          ) : chainId !== sepolia.id ? (
            <button className="btn" disabled={switching} onClick={() => switchChain({ chainId: sepolia.id })}>
              {switching ? "Cambiando…" : "Cambiar a Sepolia"}
            </button>
          ) : (
            <span className="badge badge-ok">Sepolia</span>
          )}
        </div>
      </header>

      <main className="main">
        <section className="card">
          <h2>Estado de la Wallet</h2>
          <p className="kv"><b>Conectado:</b> {isConnected ? "Sí" : "No"}</p>
          <p className="kv"><b>Dirección:</b> {address ? <Mono>{address}</Mono> : "—"}</p>
          <p className="kv"><b>Red:</b> {chainId ?? "—"}</p>
        </section>

        <section className="card">
          <h2>Información del Token</h2>
          <p className="kv"><b>Nombre:</b> {name ?? "—"}</p>
          <p className="kv"><b>Símbolo:</b> {symbol ?? "—"}</p>
          <p className="kv"><b>Decimales:</b> {d ?? "—"}</p>
          <p className="kv"><b>Monto del faucet:</b> {fmt(faucetAmount as bigint)} {symbol ?? ""}</p>
          <p className="kv"><b>Tu balance:</b> {address ? (userBalance != null ? `${fmt(userBalance as bigint)} ${symbol ?? ""}` : "—") : "—"}</p>
        </section>

        <section className="card">
          <h2>Reclamar Tokens</h2>
          <p className="kv">
            <b>¿Ya reclamaste?</b>{" "}
            {hasClaimed == null
              ? "—"
              : hasClaimed
              ? <span className="badge badge-ok">Sí</span>
              : <span className="badge badge-no">No</span>}
          </p>
          <button className="btn btn-primary" onClick={onClaim} disabled={!canClaim}>
            {isPending || isConfirming ? "Procesando…" : "Reclamar Tokens"}
          </button>
          <p className="kv" style={{fontSize:12, marginTop:8}}>
            • Una vez por dirección • Requiere Sepolia • La confirmación puede tardar.
          </p>
        </section>

        <section className="card card-lg">
          <h2>Usuarios que reclamaron</h2>
          <ul className="list">
            {Array.isArray(faucetUsers) && (faucetUsers as string[]).length > 0 ? (
              (faucetUsers as `0x${string}`[]).map(addr => (
                <li key={addr} className="item">
                  <Mono>{addr}</Mono>
                  <button className="btn" onClick={() => { navigator.clipboard.writeText(addr); toast.success("Dirección copiada") }}>
                    Copiar
                  </button>
                </li>
              ))
            ) : (
              <li className="kv">Aún no hay usuarios.</li>
            )}
          </ul>
        </section>
      </main>

      <footer className="footer">
        Contrato: <Mono>{FAUCET_TOKEN_ADDRESS}</Mono>
      </footer>
    </>
  );
}

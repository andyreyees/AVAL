import { CFG } from "./config.js";
import { ABI } from "./abi.js";
const { ethers } = window;

// status: 0 sin solicitud, 1 pendiente, 2 activa, 3 rechazada/suspendida
export const state = { signer: null, address: null, name: "", domain: "", status: 0, active: false, isOwner: false };
const listeners = [];
export const onChange = f => listeners.push(f);
export const configured = () => !!CFG.address;

let provider;
export const reader = () => new ethers.Contract(CFG.address, ABI, provider ??= new ethers.JsonRpcProvider(CFG.rpc));
export const writer = () => new ethers.Contract(CFG.address, ABI, state.signer);

export async function refresh() {
  const c = reader(), i = await c.getInstitution(state.address);
  Object.assign(state, { status: Number(i.status), name: i.name, domain: i.domain });
  state.active = state.status === 2;
  state.isOwner = (await c.owner()).toLowerCase() === state.address.toLowerCase();
  listeners.forEach(f => f());
}

const CHAINS = {
  localhost: { id: "0x7a69", name: "Hardhat Local", rpc: "http://127.0.0.1:8545" },
  sepolia: { id: "0xaa36a7", name: "Sepolia", rpc: CFG.rpc }
};

// Obliga a MetaMask a usar la red del proyecto (evita firmar por error en Ethereum real)
async function ensureNetwork() {
  const c = CHAINS[CFG.chainName];
  if (!c) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: c.id }] });
  } catch (e) {
    if (e.code !== 4902 && e.code !== -32603) throw e;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: c.id, chainName: c.name, rpcUrls: [c.rpc], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 } }] });
  }
}

export async function connect() {
  if (!window.ethereum) throw new Error("Instale MetaMask para conectar su billetera.");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureNetwork();
  const p = new ethers.BrowserProvider(window.ethereum);
  state.signer = await p.getSigner();
  state.address = await state.signer.getAddress();
  await refresh();
}
if (window.ethereum) window.ethereum.on?.("accountsChanged", () => location.reload());

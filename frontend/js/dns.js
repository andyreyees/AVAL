import { CFG } from "./config.js";
export const DEMO = !!CFG.demo;
// Prueba de dominio: la institución publica un TXT en _aval.<dominio> con su billetera.
export const dnsRecord = wallet => `aval-verify=${wallet}`;

export async function domainOk(domain, wallet) {
  if (DEMO) return true; // modo simulación
  try {
    const r = await fetch(`https://dns.google/resolve?name=_aval.${encodeURIComponent(domain)}&type=TXT`);
    const j = await r.json();
    return (j.Answer || []).some(a => a.data.replace(/"/g, "").toLowerCase().includes(dnsRecord(wallet).toLowerCase()));
  } catch { return false; }
}

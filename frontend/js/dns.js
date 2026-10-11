import { CFG } from "./config.js";
export const DEMO = !!CFG.demo;
// Prueba de dominio real: el stellar.toml de la institución debe listar su cuenta
export async function domainOk(domain, wallet) {
  if (DEMO) return true;
  try { return (await (await fetch(`https://${domain}/.well-known/stellar.toml`)).text()).includes(wallet); } catch { return false; }
}

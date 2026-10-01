import { resolve4, resolveCname } from "node:dns/promises";

const VERCEL_A = "76.76.21.21";
const VERCEL_CNAME = "cname.vercel-dns.com";

export type DnsRecord = { type: "A" | "CNAME"; name: string; value: string };

export function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function isValidDomain(d: string) {
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(d);
}

// Naive: two labels = apex. Wrong for suffixes like .co.uk; fine for the proof of concept.
export function isApex(domain: string) {
  return domain.split(".").length === 2;
}

export function dnsRecordsFor(domain: string): DnsRecord[] {
  return isApex(domain)
    ? [{ type: "A", name: "@", value: VERCEL_A }]
    : [{ type: "CNAME", name: domain.split(".")[0], value: VERCEL_CNAME }];
}

async function dnsPoints(domain: string) {
  try {
    if (isApex(domain)) return (await resolve4(domain)).includes(VERCEL_A);
    return (await resolveCname(domain)).some((c) => c.replace(/\.$/, "").endsWith("vercel-dns.com"));
  } catch {
    return false;
  }
}

// Marker rendered by the tenant page so we know *our* app answered, not some other host.
export const SITE_MARKER = "x-simpleorgsite";

async function pageLoads(domain: string, siteId: string) {
  try {
    const res = await fetch(`https://${domain}/`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return res.ok && (await res.text()).includes(`${SITE_MARKER}="${siteId}"`);
  } catch {
    return false;
  }
}

export async function checkDomain(domain: string, siteId: string) {
  const dns = await dnsPoints(domain);
  const loads = dns && (await pageLoads(domain, siteId));
  return { dns, loads };
}

// Vercel only serves (and issues certificates for) domains attached to the project.
// Skipped when the env vars are absent so local development works without Vercel.
function vercelUrl(path: string) {
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  return `https://api.vercel.com${path}${team}`;
}
const vercelEnabled = () => !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
const vercelHeaders = () => ({
  Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
  "Content-Type": "application/json",
});

export async function addDomainToVercel(domain: string): Promise<string | null> {
  if (!vercelEnabled()) return null;
  const res = await fetch(vercelUrl(`/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`), {
    method: "POST",
    headers: vercelHeaders(),
    body: JSON.stringify({ name: domain }),
  });
  if (res.ok) return null;
  const body = await res.json().catch(() => ({}));
  // Already on this project (e.g. re-adding after an error) is fine.
  if (body?.error?.code === "domain_already_in_use" && body?.error?.projectId === process.env.VERCEL_PROJECT_ID) return null;
  return body?.error?.message ?? "Vercel rejected the domain.";
}

export async function removeDomainFromVercel(domain: string) {
  if (!vercelEnabled()) return;
  await fetch(vercelUrl(`/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`), {
    method: "DELETE",
    headers: vercelHeaders(),
  });
}

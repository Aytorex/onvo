/** Matches Arc Testnet Blockscout REST API (see `arcTestnet` in wagmi / viem). */
const API_BASE = 'https://testnet.arcscan.app/api';

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;
  if (!ADDR_RE.test(address)) {
    return Response.json({ message: 'Invalid address' }, { status: 400 });
  }

  const url = `${API_BASE}/v2/tokens/${address}`;
  try {
    const upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: 120 },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({ message: 'Upstream error' }, { status: 502 });
  }
}

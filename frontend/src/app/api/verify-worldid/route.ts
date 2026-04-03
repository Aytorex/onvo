import { NextResponse } from 'next/server';
import type { IDKitResult } from '@worldcoin/idkit';

export async function POST(request: Request): Promise<Response> {
  const { rp_id, idkitResponse } = (await request.json()) as {
    rp_id: string;
    idkitResponse: IDKitResult;
  };

  if (!rp_id || !idkitResponse) {
    return NextResponse.json(
      { error: 'Missing rp_id or idkitResponse' },
      { status: 400 },
    );
  }

  const verifyRes = await fetch(
    `https://developer.world.org/api/v4/verify/${rp_id}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(idkitResponse),
    },
  );

  if (!verifyRes.ok) {
    const errorBody = await verifyRes.text();
    return NextResponse.json(
      { error: 'Verification failed', details: errorBody },
      { status: 400 },
    );
  }

  const nullifier = extractNullifier(idkitResponse);
  const response = NextResponse.json({ success: true });

  response.cookies.set('onvo_worldid_session', nullifier || 'verified', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

function extractNullifier(result: IDKitResult): string {
  const firstResponse = result.responses?.[0];
  if (!firstResponse) return '';
  if ('nullifier' in firstResponse) {
    return firstResponse.nullifier as string;
  }
  return '';
}

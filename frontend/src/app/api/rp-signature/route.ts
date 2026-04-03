import { NextResponse } from 'next/server';
import { signRequest } from '@worldcoin/idkit-server';

export async function POST(request: Request): Promise<Response> {
  const signingKey = process.env.WORLD_RP_SIGNING_KEY;
  if (!signingKey) {
    return NextResponse.json(
      { error: 'WORLD_RP_SIGNING_KEY not configured' },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { action?: string };
  const action = body.action ?? 'onvo-create-invoice';

  const { sig, nonce, createdAt, expiresAt } = signRequest({
    signingKeyHex: signingKey,
    action,
  });

  return NextResponse.json({
    sig,
    nonce,
    created_at: createdAt,
    expires_at: expiresAt,
  });
}

import { paddleBaseUrl, paddleAPIKey, productId } from '@/utils/config';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const paddleEndpoint = paddleBaseUrl;
    const response = await fetch(
      `${paddleEndpoint}/products/${productId}?include=prices`,
      {
        headers: {
          Authorization: `Bearer ${paddleAPIKey}`,
          'Content-Type': 'application/json', // Assuming JSON content
        },
      }
    );

    const data = await response.json();
    return NextResponse.json({ message: 'OK', data });
  } catch (error) {
    return NextResponse.json({ message: error });
  }
}

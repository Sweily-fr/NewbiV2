import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/calendar-connect/microsoft/authorize`, {
      headers: {
        'Authorization': authorization || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying Microsoft Calendar authorize:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion à Microsoft Calendar' },
      { status: 500 }
    );
  }
}

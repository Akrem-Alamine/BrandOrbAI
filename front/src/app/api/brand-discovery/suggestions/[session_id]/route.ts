import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function GET(
  request: NextRequest,
  { params }: { params: { session_id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get('question_type');
    
    const response = await fetch(
      `${BACKEND_URL}/brand-discovery/suggestions/${params.session_id}?question_type=${questionType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in brand discovery suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

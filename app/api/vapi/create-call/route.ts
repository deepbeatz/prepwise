// app/api/vapi/create-call/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userName, userId } = await request.json();

    // Create call using VAPI REST API
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
        type: 'assistant',
        customer: {
          number: userId,
          name: userName,
        },
        // Pass variables for your workflow
        variableValues: {
          username: userName,
          userid: userId,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create call');
    }

    return NextResponse.json({
      success: true,
      call: data,
    });

  } catch (error) {
    console.error('Call creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
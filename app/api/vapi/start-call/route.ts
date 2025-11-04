import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userName, userId } = await request.json();

        // Start a web call with the workflow
        const response = await fetch('https://api.vapi.ai/call/web', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_VAPI_PRIVATE_KEY}`, // Server-side only!
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Pass the workflow ID as assistantId (VAPI's convention)
                assistantId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
                
                // Pass variables
                assistant: {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    }
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("VAPI Error:", errorData);
            return NextResponse.json(
                { success: false, error: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            webCallUrl: data.webCallUrl, // URL to connect web SDK
            callId: data.id,
        });

    } catch (error: unknown) {
        console.error("Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
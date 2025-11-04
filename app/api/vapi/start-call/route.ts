// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//     try {
//         const { userName, userId } = await request.json();

//         console.log("Starting VAPI call for:", { userName, userId });

//         const privateKey = process.env.VAPI_PRIVATE_KEY;

//         if (!privateKey) {
//             return NextResponse.json(
//                 { success: false, error: "VAPI_PRIVATE_KEY is not configured" },
//                 { status: 500 }
//             );
//         }

//         // Start a web call with the workflow
//         const vapiResponse = await fetch('https://api.vapi.ai/call/web', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${privateKey}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 assistantId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
//                 assistant: {
//                     variableValues: {
//                         username: userName,
//                         userid: userId,
//                     }
//                 }
//             }),
//         });

//         // Log the response for debugging
//         console.log("VAPI Response Status:", vapiResponse.status);
        
//         const responseText = await vapiResponse.text();
//         console.log("VAPI Response Body:", responseText);

//         if (!vapiResponse.ok) {
//             let errorData;
//             try {
//                 errorData = JSON.parse(responseText);
//             } catch {
//                 errorData = { message: responseText };
//             }
//             console.error("VAPI API Error:", errorData);
//             return NextResponse.json(
//                 { success: false, error: errorData },
//                 { status: vapiResponse.status }
//             );
//         }

//         const data = JSON.parse(responseText);
        
//         console.log("VAPI call created successfully:", data);
        
//         return NextResponse.json({
//             success: true,
//             webCallUrl: data.webCallUrl,
//             callId: data.id,
//         });

//     } catch (error: unknown) {
//         console.error("Error starting call:", error);
//         return NextResponse.json(
//             { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
//             { status: 500 }
//         );
//     }
// }
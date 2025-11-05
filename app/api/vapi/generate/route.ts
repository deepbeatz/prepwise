// import { generateText } from "ai";
// import { google } from "@ai-sdk/google";

// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";

// export async function POST(request: Request) {
//   const { type, role, level, techstack, amount, userid } = await request.json();
//   console.log(type, role, level, techstack, amount, userid);
//   console.log(request.json());

//   try {
//     const { text: questions } = await generateText({
//       model: google("gemini-2.0-flash-001"),
//       prompt: `Prepare questions for a job interview.
//         The job role is ${role}.
//         The job experience level is ${level}.
//         The tech stack used in the job is: ${techstack}.
//         The focus between behavioural and technical questions should lean towards: ${type}.
//         The amount of questions required is: ${amount}.
//         Please return only the questions, without any additional text.
//         The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//         Return the questions formatted like this:
//         ["Question 1", "Question 2", "Question 3"]
//     `,
//     });

//     const interview = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(","),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection("interviews").add(interview);

//     return Response.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

// export async function GET() {
//   return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
// }

// app/api/vapi/generate/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function POST(request: Request) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
      console.log("=== VAPI API Request Body ===");
      console.log(JSON.stringify(body, null, 2));
      console.log("=============================");
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return Response.json({
        success: false,
        error: "Invalid JSON in request body"
      }, { status: 400 });
    }

    const { type, role, level, techstack, amount } = body;
    const userid = getCurrentUser();

    // Log all received values
    console.log("Received values:", {
      type, role, level, techstack, amount
    });

    // Validate ALL required fields
    const missingFields = [];
    if (!type) missingFields.push('type');
    if (!role) missingFields.push('role');
    if (!level) missingFields.push('level');
    if (!amount) missingFields.push('amount');

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return Response.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 });
    }

    // Generate questions
    console.log("Generating questions with Gemini...");
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack || "general"}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
      `,
    });

    console.log("Generated questions:", questions);

    // Parse questions safely
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Parsed questions is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse questions as JSON, using fallback:", parseError);
      // Fallback: split by newlines and clean up
      parsedQuestions = questions
        .split('\n')
        .filter(q => q.trim().length > 0)
        .map(q => q.replace(/^[\d\.\-\*\s]+/, '').trim())
        .filter(q => q.length > 0);
    }

    // Prepare interview data
    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack ? techstack.split(",").map((t: string) => t.trim()) : [],
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    console.log("Saving interview to Firestore...");
    
    // Save to Firestore
    const docRef = await db.collection("interviews").add(interview);
    console.log("Interview saved with ID:", docRef.id);

    // Return SUCCESS response that VAPI expects
    return Response.json({
      success: true,
      interviewId: docRef.id,
      message: "Interview generated successfully"
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error("=== API Error ===");
    console.error("Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("================");

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

export async function GET() {
  return Response.json({ 
    success: true, 
    message: "VAPI Generate API is running",
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
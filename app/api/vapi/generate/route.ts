import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        // Parse the request body
        const body = await request.json();

        // LOG EVERYTHING for debugging
        console.log("=== VAPI Request Received ===");
        console.log("Full body:", JSON.stringify(body, null, 2));
        console.log("============================");

        // VAPI might send data in different formats, handle both:
        // Option 1: Direct properties
        let { type, role, level, techstack, amount, userid } = body;

        // Option 2: Nested in a "message" or "data" property
        if (!role && body.message) {
            ({ type, role, level, techstack, amount, userid } = body.message);
        }

        // Validate required fields
        if (!type || !role || !level || !amount || !userid) {
            console.error("Missing required fields:", { type, role, level, techstack, amount, userid });
            return Response.json({
                success: false,
                error: "Missing required fields",
                received: body
            }, { status: 400 });
        }

        console.log("Processing interview generation:", { type, role, level, techstack, amount, userid });

        // Generate questions using Gemini
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-exp-0827"),
            prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack || "general"}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]`,
        });

        console.log("Generated questions:", questions);

        // Parse and validate questions
        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(questions);
            if (!Array.isArray(parsedQuestions)) {
                throw new Error("Questions is not an array");
            }
        } catch (parseError) {
            console.error("Failed to parse questions:", parseError);
            // Fallback: split by newlines if JSON parsing fails
            parsedQuestions = questions
                .split('\n')
                .filter(q => q.trim().length > 0)
                .map(q => q.replace(/^[\d\.\-\*\s]+/, '').trim());
        }

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack ? (techstack as string).split(",").map((t: string) => t.trim()) : [],
            questions: parsedQuestions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        console.log("Saving interview to Firestore...");
        const docRef = await db.collection("interviews").add(interview);
        console.log("Interview saved with ID:", docRef.id);

        return Response.json({
            success: true,
            interviewId: docRef.id
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("=== API Error ===");
        console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
        console.error("Error stack:", error instanceof Error ? error.stack : undefined);
        console.error("================");

        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error"
        }, { status: 500 });
    }
}

export async function GET() {
    return Response.json({
        success: true,
        message: "VAPI Generate API is running",
        timestamp: new Date().toISOString()
    }, { status: 200 });
}
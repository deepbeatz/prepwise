// backend api route where the vapi agent will call after colleting infro from the user about the kind of interview view to be generated
// this api will retrive data from vapi, send to gemini, get response, ans tehn store the interview questions from the response from gemini in firebase firestore
// so this is not a frontend route, it gets called automatically from the agent component file (type="generate") and the user doesnt know about it, thats why its a backend route....

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
    const { type, role, level, techstack, amount, userid } = await request.json();

    try {
        //renaming "text" that comes as reponse from generateText() to "questions"
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]`,
        });

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack.split(","),
            questions: JSON.parse(questions),
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            //later we have to implement logic for actual valid interview cover images based on technologies being interviewed on
            createdAt: new Date().toISOString(),
        };

        await db.collection("interviews").add(interview);

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return Response.json({ success: false, error: error }, { status: 500 });
    }
}

export async function GET() {
    return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}

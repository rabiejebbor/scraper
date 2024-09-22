const readline = require('readline');
require('dotenv').config();
const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");

// todo make cover letter : needed inputs: job description , info about the applicant

// output: excel : coverLetter , jobTitle , url

const Technology = z.object({
    technologyName: z.string(),
    yearsOfExperienceRequired: z.number(),
});
const JobData = z.object({
    jobTitle: z.string(),
    jobRequirements: z.array(Technology),
    shortDescription: z.string(),
    top5JobRequirements : z.string()
});

const model =  "gpt-4o-mini"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to chat with OpenAI
async function chatWithOpenAI(message) {
    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: "You are a helpful assistant. please always answer in a maximum of 100 words no exceptions!!!" },
                {
                    role: "user",
                    content: message,
                },
            ],
        });


        console.log("AI Response:", completion.choices[0].message);
        console.log("%c 1 --> 33||/Users/user/WebstormProjects/openai-chat/index.js\n completion: ","color:#f0f;", completion);
    } catch (error) {
        console.error("Error:", error);
    }
}
//
// // Ask for user input
// rl.question("You: ", async (input) => {
//     await chatWithOpenAI(input);
//     rl.close();
// });

async function generateCoverLetter(jobDescription, applicantInfo) {
    try {
        const completion = await openai.beta.chat.completions.parse({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are a professional assistant that specializes in writing personalized cover letters for job applications. please dont leave unfilled information like [City, Province, Postal Code], fill what you can and remove place holders."
                },
                {
                    role: "user",
                    content: `Job Description:\n${jobDescription}`
                },
                {
                    role: "user",
                    content: `Applicant Information:\n${applicantInfo}`
                },
                {
                    role: "user",
                    content: "Please write a cover letter for me to apply to this job, incorporating my skills and experiences."
                }
            ],
        });

        const coverLetter = completion.choices[0].message;
        console.log("Cover Letter:\n", coverLetter);
        return coverLetter.content
    } catch (error) {
        console.error("Error:", error);
    }
}

async function extractJobData(jobDescription) {
    try {
        const completion = await openai.beta.chat.completions.parse({
            model: model,
            messages: [
                { role: "system", content: "Extract the job information." },
                { role: "user", content: jobDescription },
            ],
            response_format: zodResponseFormat(JobData, "jobData"),
        });

        const jobData = completion.choices[0].message.parsed;
        console.log("%c 1 --> 63||/Users/user/WebstormProjects/openai-chat/aiChat.js\n jobData: ","color:#f0f;", jobData);
        console.log("%c 1 --> 63||/Users/user/WebstormProjects/openai-chat/aiChat.js\n completion: ","color:#f0f;", completion);
    } catch (error) {
        console.error("Error:", error);
    }
}
// Export the functions
module.exports = {
    chatWithOpenAI,
    generateCoverLetter,
    extractJobData
};
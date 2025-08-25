import * as dotenv from 'dotenv';
dotenv.config();

import readlineSync from 'readline-sync';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({}); // here i don't need to enter my apikey:"asDaSJDKKEskjHOWAH" like this it is very smart it automatically takes the api key from the .env file
const History = []


// another LLM that will convert the  (previous questions+current question) to make a new meaningful question SO
async function transformQuery(question){

History.push({
    role:'user',
    parts:[{text:question}]
    })  

const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a query rewriting expert. Based on the provided chat history, rephrase the "Follow Up user Question" into a complete, standalone question that can be understood without the chat history.
    Only output the rewritten question and nothing else.
      `,
    },
 });
 
 History.pop()
 
 return response.text


}


async function chatting(question)
{

    const queries = await transformQuery(question);

    // embedding the question(query) of the user into a vector( Initially, converting into the vector)
    const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
    });
    const queryVector = await embeddings.embedQuery(queries); 

    // making the connection with the database
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    // then i will search into the pinecone vector database using the "generated vector of the question" for the similar into information 
    // i will give as a context with the actual query(question) this whole step is known as a "augmented"

    // getting the top 10 matches results according to the query
    const searchResults = await pineconeIndex.query({
        topK: 10,
        vector: queryVector,
        includeMetadata: true,
        });
        
        // combining all the text i got in the metadata and i will use it as a context
         const context = searchResults.matches
                    .map(match => match.metadata.text)
                    .join("\n\n---\n\n");

        // (query+context) gives to the LLM
        History.push({
        role:'user',
        parts:[{text:queries}]
        })              



        const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: History,
        config: {
        systemInstruction: `You have to behave like a Data Structure and Algorithm Expert.
        You will be given a context of relevant information and a user question.
        Your task is to answer the user's question based ONLY on the provided context.
        If the answer is not in the context, you must say "I could not find the answer in the provided document."
        Keep your answers clear, concise, and educational.
        
        Context: ${context}
        `,
        },
    });


    History.push({
        role:'model',
        parts:[{text:response.text}]
    })

    console.log("\n");
    console.log(response.text);


 
}

async function main(){
   const userProblem = readlineSync.question("Ask me anything--> ");
   await chatting(userProblem);
   main();
}

// problem with this is that the follow up like,
// initially i ask: What is linked list -> answers it properly
// then,            Explain it in detail -> this say i can't give the answer as it doesn't find any matches like this in pinecone DB

// THE SOLUTION:we can't directly search in DB beacause the correct meaning was not created from this, we can use another LLM Model which will do a task for me, it will take the previous questions and current question
// and will give a new question(the mixed new generated question of both) then i will give it to the LLM for generating the output of this,
// so before converting into vector i will call the LLM Model for the generation of meaningful question 
// and now, i will make the chunks and making vector of these chunks, and searching into the chunks

// (ALWAYS REMEMBER TO THINK WITH A BROADER AND CURRENT USED APPROACHES(SOLUTIONS) IN THE INDUSTRY)

main();

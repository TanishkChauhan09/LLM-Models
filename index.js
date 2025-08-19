
import { FunctionResponse, GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

const ai = new GoogleGenAI({apiKey :"here i wiil need to enter my api key"});

const history = [];

function sum({num1,num2})
{
    return num1+num2;
}

function prime({num})
{
    if(num<=1)
        return false;

    for(let i=2;i<=Math.sqrt(num);i++)
    {
        if(num%i==0)
            return false;
    }

    return true;
}

async function getcrptoprice({coin})
{
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`);
    const data = await response.json();

    return data;
}

// here i will create something which will tell the LLM model what are the external tools(function or ai agents) exists 

const sumdeclaration ={
    name:"sum",
    description:"This function takes two numbers as input and returns their sum",
    parameters:{
        type:"object",
        properties:{
            num1:{
                type:"number",
                description:"this is the first number to be added in the sum function example:5"
            },
            num2:{
                type:"number",
                description:"this is the second number to be added in the sum function example:10"
            }
        }, 
        required:["num1","num2"]
    }
}

const primedeclaration ={
    // in this primedeclaration the name should be exactly same as the function name
    name:"prime",
    description:"This function takes a number as input and returns whether it's a prime number or not",
    parameters:{
        type:"object",
        properties:{
            num:{
                type:"number",
                description:"this is the number we need to check upon example:11"
            },
            
        }, 
        required:["num"]
    }
}

const cryptodeclaration ={
    name:"getcrptoprice",
    description:"This function takes the name of a cryptocurrency and returns its current price in USD example:bitcoin",
    parameters:{
        type:"object",
        properties:{
           coin:{
            type:"string",
            description:"this is the name of the cryptocurrency we need to check upon"
           }
        }, 
        required:["coin"]
    }
}

const availabletools = {
    sum:sum,
    prime:prime,
    getcrptoprice:getcrptoprice
}



    async function runaiagents(userproblem){

        history.push({
            role:"user",
            parts:[{text: userproblem}]
        })

    while(true)
    {    
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: history,
        config:{
            systemInstruction:`You are an Ai agent, you have access of three available tools like to find 
            sum of two number,get crypto price of any currency and find whether a number is prime or not 
            use these tools to complete the task that the user has asked for, if user ask general question you can answer it directly if 
            you don't need these three tools to complete the task, if you need these tools then use them to complete the task`,
            tools:[{
                functionDeclarations :[sumdeclaration,primedeclaration,cryptodeclaration]
            }],
        }
     });
        //   after i getting the response, i will check do i need to call more functions to completethe task that the user has asked for
        if(response.functionCalls && response.functionCalls.length>0)
        {
            console.log(response.functionCalls[0]);
            // i can have multiple functionCalls, so i will iterate over them because .functionCalls returns us an array of function calls 
            // if i write if , else if conditions for each function then, there will be a  lot of code repetition and a headache for me to write
            const {name,args} = response.functionCalls[0];
            // here i am destructuring the name and args from the first function call,because i am only calling one function at a time
            // if there are multiple function calls, i will have to iterate over them and call each function one by one
            const funcall = availabletools[name];
            // here i am getting the function from the available tools object using the name of function because in name i have given the string of a function name
            const result = await funcall(args); 

            const functionresponseparts = {
                name:name,
                response:{
                    result:result,
                },
            };
            
            // model 
            history.push({
                role:"model",
                parts:[{functionCall: response.functionCalls[0]}]
            })

            // i will also push the result of the function call and name of the function into the history 
            history.push({
                role:"user",
                parts:[{functionResponse:functionresponseparts}],
            })
        }
        else
        {
        //    if the response does not have any function calls, i will just push the response to the history
            history.push({
                role:"model",
                parts:[{text:response.text}]
            })

            console.log(response.text);
            console.log("\n");
            break; // break the loop if there are no function calls,so that we can exit the loop and not call the function again
        }
       



        
    }

}

async function main()
{
    const userproblem = readlineSync.question("Ask the question:");
    await runaiagents(userproblem);

    // here i am using await to wait for the response from the AI before proceeding
    // this is important to ensure that the AI has processed the question before we ask for another one

    main(); // call main again to allow continuous conversation otherwise if I will not call, it will end after one question and again when I run this
    // this will make the history clear, so I due to not having the context of the previous conversation this will not give me the accurate predict answer 
    // like if earlier i told him that Hi, I am Tanishk Chuahan, but if I will not call main again it will end the conversation and when I will run it again it will not
    // have the context of the previous conversation, so it will not give me the accurate answer,if I call main again it will not refest the history array 
    // due to continuous running of the code,
}

main(); // call main to start the conversation
// this will allow the user to ask questions continuously without ending the conversation

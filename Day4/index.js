
import { FunctionResponse, GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";


const platform = os.platform();

const ai = new GoogleGenAI({apiKey :"AIzaSyDLqkmWiFCxu7cGSJQNORfcn8KnkP_0bA4"});

const asyncExecute = promisify(exec);

const history = [];

// creating the tool, which can run any terminal commands given by the LLM Model

async function executecommand({command})
{
    try{
          const {stdout,stderr} = await asyncExecute(command);
          if(stderr)
          {
            return `Error: ${stderr}`;
          }
          else{
            return `Successfully exected command: ${stdout} || Task executed completely`;
          }

    }
    catch(error)
    {
      return `Error: ${error}`;
    }
}
    


const executecommandDeclaration ={
    name:"executecommand",
    description:`This function takes the command and executes a single terminal/shell command , a command
      can be anything like to create a folder or a file ,write on a file or run the file , edit the file etc  `,
    parameters:{
        type:"object",
        properties:{
           command:{
            type:"string",
            description:"this is a single terminal/shell command that you want to execute, it can be anything like for example: mkdir foldername, ni filename.html, touch filename.text etc",
           }
        }, 
        required:["command"]
    }
}

const availabletools = {
    executecommand:executecommand,
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
             
            systemInstruction:`You are an website developer expert in making the very very attractive and responsive websites, you hve to create the frontend of the website by analysing the user's inpur ,
            You also have the access of the tools that can execute or run the terminal commands, you can use these tools to create the files or the folders,
            
            Current user operating system is ${platform}, so you can use the terminal commands that are supporteed by the ${platform} operating system,

            Give command to the user according to the user's supporting operating system,

            What will be your job?
             1:Analyse the user query and create the responsive and attractive frontend of the website that the user want to build
             2:Give the command one by one, step by step
             3:Use available tools to execute the terminal commands you want to run the commands that you want to run, you can use the tools to create the files or the folders,

             Now, you will give the command in the following format:
             1:first create the folder for the website like for example  mkdir calculator
             2:then create the files inside the folder like for example touch calculator/index.html or ni calculator/index.html
             3:then create the style.css file
             4:then create the script.js file
             5:then, write the code inside the index.html file, script.js, style.css file
             6:then run the command to open the index.html file in the browser, so that the user can see the output of the website that you have created for him/her,

            You have to provide the terminal commands one by one to the user, so that the user can execute the commands in his/her terminal
           
            Remember you don't need to use echo commands during this website creation  process, you just need to use the terminal commands that are supported by yhe ${platform} operating system,
            also use like,
            @'
            const calculator = {
            displayValue:'O',
            firstOperand:null,
            waitingForSecondOperand:false,
            operator:null,
            };

            function updateDisplay(){
            const display = document.querySelector('.calculator-screen');
            display.value = calculator.displayVlaue;
            }
            // ..... rest of the valid Javascript code for the calculator
            updateDisplay();
            @ | Set-Content-Path "script.js"
             
            `,
            tools:[{
                functionDeclarations :[executecommandDeclaration]
            }],
        }
     });
        if(response.functionCalls && response.functionCalls.length>0)
        {
            console.log(response.functionCalls[0]);
            const {name,args} = response.functionCalls[0];
            const funcall = availabletools[name];
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
    console.log("I am a cursor who will help: Let's create a website ");
    const userproblem = readlineSync.question("Ask the question:");
    await runaiagents(userproblem);
    main();
}

main(); 
import * as dotenv from 'dotenv';
dotenv.config();

// loading the data from the pdf file(document)
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// chunking the data into samller pieces
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// to convert the chunks into vectors
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// database configure
import { Pinecone } from '@pinecone-database/pinecone';
// now for storing in a pinecone DB we will import a pinecone vector store
import { PineconeStore } from '@langchain/pinecone';

async function indexDocument(){
    
    //1.) initally loading the pdf file
    const PDF_PATH = './dsa.pdf';
    const pdfLoader = new PDFLoader(PDF_PATH);
    const rawDocs = await pdfLoader.load();
    // console.log(rawDocs.length)

    // 2.) chunking the data of document into smaller pieces

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,  // each chunk have the the size of 1000 characters
        chunkOverlap: 200, // to avoid the lossing of context(data loss) i have overlapped the previous chunk data by 200 characters
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    // console.log(chunkedDocs.length);

    // ab embedding krenge(converting chunks into vectors)
    const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });

   // now we will configure the pinecone(vector database) for storing the vectors
   const pinecone = new Pinecone();  // this is a very imp step it automatically takes everthing from the .env file
   const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME); 

    // langchain provides a very easy way to store the vectors in the pinecone database using pinecone store class
   
    // langchain (chunking,embedding model of Gemini,database) using this step it does everything in one step

    //  now we will insert the vectors into pinecone database store
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
   });




}

indexDocument();

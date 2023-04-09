import { OpenAI } from "langchain/llms";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";

const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = 
  `You are an AI assistant for Bringg. The documentation is located at https://help.bringg.com/v1/docs.
You are given the following extracted parts of a many help documents and a question. Provide a conversational answer with a hyperlink to the given documentation.
Do not add hyperlinks to the answer.
If you don't know the answer, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not about Bringg or deliveries or about current chat, politely inform them that you are tuned to only answer questions about using Bringg.
Question: {question}
=========
{context}
=========
Answer in Markdown:`;

export const makeChain = (vectorstore: HNSWLib) => {
  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo-0301',
    temperature: 0
  });
  
  return ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(),
    {
      returnSourceDocuments: true,
      questionGeneratorTemplate: CONDENSE_PROMPT,
      qaTemplate: QA_PROMPT      
    }
  );
}
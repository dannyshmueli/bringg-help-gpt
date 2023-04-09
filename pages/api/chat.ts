// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { makeChain } from "./util";

async function makeFakeData() {
  await new Promise(r => setTimeout(r, 500));
  return { 
    sourceDocuments: [
      { 
        metadata: { 
          source: "help.bringg.com/v1/docs/take-a-break-during-my-shift.txt"
        }
      },
      { 
        metadata: { 
          source: "help.bringg.com/docs/a-day-in-the-life-of-a-bringg-driver.txt"
        }
      }
    ],
    text: "Yes, drivers can take scheduled breaks or pause incoming assignments to take an unexpected break, such as if they need to fix a flat tire or assist another driver with a delivery. Bringg recommends using the Driver App to take breaks and notifying the dispatcher of the break. However, the dispatcher can still assign orders manually while the driver is on break. It is important not to use silent, do not disturb (DND), or airplane mode on the phone to take a break, as Bringg and the dispatcher may continue assigning orders to the driver instead of other available drivers, causing orders to accumulate and arrive late unnecessarily. For more information, please refer to the documentation on taking a break during a shift"
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body = req.body;
  const dir = path.resolve(process.cwd(), "data");

  const vectorstore = await HNSWLib.load(dir, new OpenAIEmbeddings());
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  const sendDone = () => {
    sendData("[DONE]");
  };

  const sendMessage = (message: string, resourceUrls: any) => {
    sendData(JSON.stringify({ message: message, resourceUrls: resourceUrls }));
  };

  const chain = makeChain(vectorstore);

  try {
    const res = await chain.call({
      question: body.question,
      chat_history: body.history,
    });

    const onlyLinks = [... new Set(res.sourceDocuments.map((document: { metadata: { source : string; }; }) => { return 'https://' + document.metadata.source.replace(".txt", '') }))];

    sendMessage(res.text, onlyLinks);
  } catch (err) {
    console.error(err);
    // Ignore error
  } finally {
    await new Promise(r => setTimeout(r, 500));
    sendDone();
    res.end();
  }
}

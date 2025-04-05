import { openai } from "@ai-sdk/openai"
import { CoreMessage, pipeDataStreamToResponse, streamText } from "ai"
import "dotenv/config"
import express, { Request, Response } from "express"
import cors from "cors"
import bodyParser from "body-parser"

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())

app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: CoreMessage[] }

  if (!messages) {
    res.status(400).send("Bad Request: Missing messages")
    return
  }

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  })

  result.pipeDataStreamToResponse(res)
})

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:8080`)
})

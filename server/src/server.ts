import "dotenv/config"
import { CoreMessage, generateObject, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import * as cheerio from "cheerio"
import bodyParser from "body-parser"
import cors from "cors"
import express, { Request, Response } from "express"

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
    model: openai("gpt-4o-mini"),
    messages,
  })

  result.pipeDataStreamToResponse(res)
})

app.post("/api/categorize", async (req: Request, res: Response) => {
  const { url, title, categories } = req.body

  // Validate inputs
  if (!url) {
    res.status(400).send("Bad Request: Missing URL")
    return
  }

  if (!title) {
    res.status(400).send("Bad Request: Missing title")
    return
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    res.status(400).send("Bad Request: Missing or invalid categories")
    return
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    // Only allow http and https schemes
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      res.status(400).send("Bad Request: Invalid URL scheme")
      return
    }
  } catch (e) {
    res.status(400).send("Bad Request: Invalid URL")
    return
  }

  // Fetch and extract metadata
  let description: string = ""

  try {
    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Bookmark Categorizer Bot",
      },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      res.status(500).send("Error: Could not fetch URL")
      return
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    description =
      $('meta[name="description"]').attr("content") || "No description found"
  } catch (error) {
    console.error("Error processing URL:", error)
    res.status(500).send("Error processing URL")
    return
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      output: "enum",
      enum: categories,
      prompt: `You are an expert bookmark categorizer. Your task is to analyze the following webpage information and categorize it into the most appropriate single category from the provided list.

      URL: ${url}
      Title: ${title}
      Description: ${description}

      Choose the SINGLE most relevant category from the list. Consider the content, purpose, and topic of the webpage. Return only the category name exactly as it appears in the list.`,
    })

    res.json({
      category: object,
      url,
      title,
      description,
    })
  } catch (error) {
    console.error("AI categorization error:", error)
    res.status(500).send("Error categorizing URL")
    return
  }
})

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:8080`)
})

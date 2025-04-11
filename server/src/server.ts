import "dotenv/config"
import { CoreMessage, generateObject, streamText } from "ai"
import { FolderStructure } from "shared/types/FolderStructure"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
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
  const { url, title, folderStructure } = req.body as {
    url: string
    title: string
    folderStructure?: FolderStructure
  }

  // Validate inputs
  if (!url) {
    res.status(400).send("Bad Request: Missing URL")
    return
  }

  if (!title) {
    res.status(400).send("Bad Request: Missing title")
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
  let description: string = "No description found"
  let keywords: string = "No keywords found"

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

    if (response.ok) {
      const html = await response.text()
      const $ = cheerio.load(html)
      description =
        $('meta[name="description"]').attr("content") || "No description found"
      keywords =
        $('meta[name="keywords"]').attr("content") || "No keywords found"
    }
  } catch (error) {
    console.error("Error processing URL:", error)
  }

  try {
    // Process folder structure for the prompt
    let folderStructurePrompt = ""
    if (folderStructure && typeof folderStructure === "object") {
      folderStructurePrompt = `Existing folder structure:\n${formatFolderStructure(
        folderStructure
      )}

The above represents the folder hierarchy in a tree-like format:
- Root folders appear without any prefix
- Subfolders are preceded by "├─" with additional "│" characters showing the nesting level
- To reference a complete path, combine the folder names with "/" separators (e.g., "Category/Subcategory")

If one of the existing folders or subfolders fits well, use it. Otherwise, create an appropriate new category path.`
    }

    const prompt = `You are an expert bookmark categorizer. Your task is to analyze the following webpage information and categorize it appropriately.

URL: ${url}
Title: ${title}
Description: ${description}
Keywords: ${keywords}

${folderStructurePrompt}

Create a category path using '/' as a separator (e.g. 'Category/Subcategory').
The path should be hierarchical, starting with a general category and getting more specific.
Keep the category names concise but descriptive, and limit the path to 1-3 levels.${
      folderStructure
        ? "\nIf possible, use existing folders from the provided structure."
        : ""
    }`

    const { object } = await generateObject({
      model: openai.responses("gpt-4o-mini"),
      schema: z.object({
        categoryPath: z
          .string()
          .describe(
            "The category path for the bookmark using '/' as a separator (e.g. 'Category/Subcategory')."
          ),
      }),
      prompt,
    })

    res.json(object.categoryPath)
  } catch (error) {
    console.error("AI categorization error:", error)
    res.status(500).send("Error categorizing URL")
    return
  }
})

/**
 * Formats the folder structure into a concise string representation with clear hierarchy
 * @param structure - The folder structure object
 * @param level - Current indentation level (used in recursion)
 * @returns Formatted string representation of the folder structure
 */
function formatFolderStructure(
  structure: FolderStructure,
  level: number = 0
): string {
  let result = ""

  for (const [folderName, subFolders] of Object.entries(structure)) {
    // Use explicit hierarchy markers instead of relying on whitespace
    const prefix = level === 0 ? "" : "│".repeat(level - 1) + "├─"
    result += `${prefix}${folderName}\n`

    if (typeof subFolders === "object" && Object.keys(subFolders).length > 0) {
      result += formatFolderStructure(subFolders, level + 1)
    }
  }

  return result
}

app.listen(8080, () => {
  console.log(`Server is running on http://localhost:8080`)
})

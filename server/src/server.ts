import "dotenv/config"
import { FolderStructure } from "shared/types/FolderStructure"
import { generateObject } from "ai"
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

// Define schema for the categorization-relevant information
const CategoryInfoSchema = z.object({
  topicSummary: z
    .string()
    .describe("A brief description of what the webpage is about"),
  contentType: z
    .string()
    .describe(
      "The general format or type of the content (article, blog, tool, reference, etc.)"
    ),
  domain: z
    .string()
    .describe("The general subject area or field the content belongs to"),
  keywords: z
    .array(z.string())
    .describe("Important terms related to the content"),
  audience: z.string().describe("Who the content seems to be targeted towards"),
  purpose: z
    .string()
    .describe(
      "What the content is trying to accomplish (inform, educate, entertain, sell, etc.)"
    ),
})

type CategoryInfo = z.infer<typeof CategoryInfoSchema>

/**
 * Extracts the HTML head element content, removing irrelevant tags
 */
function extractHeadContent($: cheerio.CheerioAPI): string {
  // Clone the head element to avoid modifying the original document
  const headClone = $("head").clone()

  // Remove irrelevant tags
  headClone.find("link").remove()
  headClone.find("script").remove()
  headClone.find("style").remove()

  // Return the cleaned-up head content
  return headClone.html() || ""
}

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

  try {
    // Extract head content for analysis
    let headContent = ""
    let categoryInfo: CategoryInfo | null = null

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
        headContent = extractHeadContent($)

        // If we have head content, analyze it with the LLM
        if (headContent) {
          // First, extract useful information from the head content
          const metadataPrompt = `You are an expert metadata analyzer. Your task is to analyze an HTML head element and extract the most useful information for bookmark categorization.

URL: ${url}
Title: ${title}

HTML Head Content:
${headContent}

Based on this metadata, identify and extract the most relevant information that would help categorize this bookmark properly.
Focus on the main topic, content type, domain, and key themes. Ignore irrelevant technical metadata.`

          const { object } = await generateObject({
            model: openai.responses("gpt-4o-mini"),
            schema: CategoryInfoSchema,
            prompt: metadataPrompt,
          })

          categoryInfo = object
        }
      }
    } catch (error) {
      console.error("Error processing URL:", error)
      // Continue with categorization even if metadata extraction fails
    }

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
${
  categoryInfo
    ? `
Topic Summary: ${categoryInfo.topicSummary}
Content Type: ${categoryInfo.contentType}
Domain: ${categoryInfo.domain}
Keywords: ${categoryInfo.keywords.join(", ")}
Audience: ${categoryInfo.audience}
Purpose: ${categoryInfo.purpose}
`
    : "No additional metadata available"
}

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

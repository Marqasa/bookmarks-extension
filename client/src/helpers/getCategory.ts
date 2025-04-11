import { getFolderStructure } from "./getFolderStructure"

/**
 * Categorizes a URL by sending it to the categorization API
 * @param url - URL to categorize
 * @param title - Title of the webpage
 * @returns Categorization result as category path string
 */
export async function getCategory(url: string, title: string): Promise<string> {
  // Get folder structure
  const folderStructure = await getFolderStructure()

  // Send categorization request to API
  const response = await fetch("http://localhost:8080/api/categorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      title,
      folderStructure,
    }),
  })

  // Handle error responses
  if (!response.ok) {
    throw new Error(`API returned status code ${response.status}`)
  }

  // Parse and return the response
  return await response.json()
}

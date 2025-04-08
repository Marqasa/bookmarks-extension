import { getPaths } from "./getPaths"

/**
 * Categorizes a URL by sending it to the categorization API
 * @param url - URL to categorize
 * @param title - Title of the webpage
 * @returns Categorization result
 */
export async function getCategory(url: string, title: string) {
  // Get available category paths
  const categories = await getPaths()

  // Send categorization request to API
  const response = await fetch("http://localhost:8080/api/categorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      title,
      categories,
    }),
  })

  // Handle error responses
  if (!response.ok) {
    throw new Error(`API returned status code ${response.status}`)
  }

  // Parse and return the response
  return await response.json()
}

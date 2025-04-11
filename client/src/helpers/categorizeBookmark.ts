import { getCategory } from "./getCategory"
import { moveBookmark } from "./moveBookmark"

/**
 * Response type for bookmark categorization with discriminated union
 * - When success is true, category is provided
 * - When success is false, error message is provided
 */
export type CategorizeBookmarkResponse =
  | { success: true; category: string }
  | { success: false; error: string }

/**
 * Categorizes a bookmark and moves it to the appropriate folder
 * First checks if bookmark exists, then determines category and moves it
 *
 * @param url - Bookmark URL
 * @param title - Bookmark title
 * @returns Result object with success status and category or error
 */
export async function categorizeBookmark(
  url: string,
  title: string,
): Promise<CategorizeBookmarkResponse> {
  try {
    // Verify bookmark exists
    const existingBookmarks = await chrome.bookmarks.search({ url })

    if (existingBookmarks.length === 0) {
      return { success: false, error: "Bookmark not found" }
    }

    // Get category from AI service
    const category = await getCategory(url, title)

    // Move bookmark to category folder
    await moveBookmark(existingBookmarks[0].id, category)

    // Notify user of successful categorization
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/star-filled-38.png",
      title: "Bookmark Categorized",
      message: `Bookmark moved to category: ${category}`,
      priority: 0,
    })

    return { success: true, category }
  } catch (error: unknown) {
    console.error("Error categorizing bookmark:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

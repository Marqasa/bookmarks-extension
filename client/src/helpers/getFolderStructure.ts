import { FolderStructure } from "shared/types/FolderStructure"

/**
 * Fetches Chrome bookmark folder structure.
 * Returns an object where keys are folder names and values are child folders.
 */
export async function getFolderStructure(): Promise<FolderStructure> {
  // Get bookmarks tree from Chrome
  const tree = await chrome.bookmarks.getTree()
  // Extract the "Bookmarks Bar" folder
  const bookmarksBar = tree[0]?.children?.[0]

  return bookmarksBar ? buildFolderStructure(bookmarksBar) : {}
}

/**
 * Recursively builds folder structure from a bookmark tree node.
 * Ignores bookmark links, only processes folders.
 */
function buildFolderStructure(
  node: chrome.bookmarks.BookmarkTreeNode,
): FolderStructure {
  // Initialize structure object
  const structure: FolderStructure = {}

  // Process children
  if (node.children && node.children.length > 0) {
    for (const childNode of node.children) {
      // Only process folders (ignore bookmark URLs)
      if (!childNode.url) {
        // Recursively build child structure
        const childStructure = buildFolderStructure(childNode)

        // Add folder to structure with its children
        structure[childNode.title] = childStructure
      }
    }
  }

  return structure
}

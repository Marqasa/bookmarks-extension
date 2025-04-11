/**
 * Gets the full path of a bookmark by its ID.
 * Returns a string representation of the path using '/' as separator.
 */
export async function getBookmarkPath(bookmarkId: string): Promise<string> {
  try {
    // Get the bookmark node
    const [bookmark] = await chrome.bookmarks.get(bookmarkId)
    if (!bookmark) return ""

    // Get full path by traversing up the bookmark tree
    return await buildPathFromNode(bookmark)
  } catch (error) {
    console.error("Error getting bookmark path:", error)
    return ""
  }
}

/**
 * Recursively builds the path from a bookmark node to the root.
 */
async function buildPathFromNode(
  node: chrome.bookmarks.BookmarkTreeNode,
): Promise<string> {
  // If we've reached the root node or bookmarks bar node, stop recursion
  if (!node.parentId || node.parentId === "0" || node.parentId === "1") {
    return ""
  }

  try {
    // Get parent node
    const [parent] = await chrome.bookmarks.get(node.parentId)

    if (!parent) return node.title

    // Get parent's path
    const parentPath = await buildPathFromNode(parent)

    // Combine paths
    return parentPath ? `${parentPath}/${parent.title}` : parent.title
  } catch (error) {
    console.error("Error building path:", error)
    return node.title
  }
}

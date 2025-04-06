/**
 * Fetches all Chrome bookmark folder paths.
 * Returns an array of folder paths using '/' as separator, ignoring individual bookmarks.
 */
export async function getPaths(): Promise<string[]> {
  // Get bookmarks tree from Chrome
  const tree = await chrome.bookmarks.getTree()
  // Extract the "Bookmarks Bar" folder
  const bookmarksBar = tree[0]?.children?.[0]

  return bookmarksBar ? collectPaths(bookmarksBar) : []
}

/**
 * Recursively collects folder paths from a bookmark tree node.
 * Ignores bookmark links, only processes folders.
 */
function collectPaths(
  node: chrome.bookmarks.BookmarkTreeNode,
  currentPath: string = "",
): string[] {
  // Skip bookmark URLs - only care about folders
  if (node.url) {
    return []
  }

  const paths: string[] = []

  // Add current path if not the root bookmarks bar
  if (currentPath) {
    paths.push(currentPath)
  }

  // Process children
  if (node.children && node.children.length > 0) {
    for (const childNode of node.children) {
      if (!childNode.url) {
        // Create path for this folder
        const childPath = currentPath
          ? `${currentPath}/${childNode.title}`
          : childNode.title

        // Recursively collect child paths
        const childPaths = collectPaths(childNode, childPath)
        paths.push(...childPaths)
      }
    }
  }

  return paths
}

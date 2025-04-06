/**
 * Adds a bookmark to a specified location in Chrome's bookmarks hierarchy.
 *
 * Creates bookmark at the given path, automatically creating any missing folders.
 */
export async function addBookmark(
  url: string,
  title: string,
  path: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  try {
    // Get bookmarks tree and access Bookmarks Bar
    const tree = await chrome.bookmarks.getTree()
    const bookmarksBar = tree[0]?.children?.[0]

    if (!bookmarksBar || !bookmarksBar.id) {
      throw new Error("Could not locate the Bookmarks Bar")
    }

    // Add directly to bookmarks bar if no path specified
    if (!path || path === "") {
      return await chrome.bookmarks.create({
        parentId: bookmarksBar.id,
        title,
        url,
      })
    }

    // Navigate through folders, creating them as needed
    let currentFolderId = bookmarksBar.id
    const pathParts = path.split("/")

    for (const folderName of pathParts) {
      if (!folderName.trim()) continue

      const subfolders = await chrome.bookmarks.getChildren(currentFolderId)
      const existingFolder = subfolders.find(
        (node) => node.title === folderName && !node.url,
      )

      if (existingFolder && existingFolder.id) {
        currentFolderId = existingFolder.id
      } else {
        const newFolder = await chrome.bookmarks.create({
          parentId: currentFolderId,
          title: folderName,
        })
        currentFolderId = newFolder.id
      }
    }

    // Create bookmark in target folder
    return await chrome.bookmarks.create({
      parentId: currentFolderId,
      title,
      url,
    })
  } catch (error) {
    console.error("Error adding bookmark:", error)
    throw new Error(
      `Failed to add bookmark: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

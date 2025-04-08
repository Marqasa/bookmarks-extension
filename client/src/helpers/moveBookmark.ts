/**
 * Moves an existing bookmark to a specified location in Chrome's bookmarks hierarchy.
 *
 * Moves a bookmark to the given path, automatically creating any missing folders.
 */
export async function moveBookmark(
  bookmarkId: string,
  path: string,
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  try {
    // Get bookmarks tree and access Bookmarks Bar
    const tree = await chrome.bookmarks.getTree()
    const bookmarksBar = tree[0]?.children?.[0]

    if (!bookmarksBar || !bookmarksBar.id) {
      throw new Error("Could not locate the Bookmarks Bar")
    }

    // Get the bookmark to be moved
    const [bookmarkNode] = await chrome.bookmarks.get(bookmarkId)
    if (!bookmarkNode) {
      throw new Error(`Bookmark with ID ${bookmarkId} not found`)
    }

    // Move directly to bookmarks bar if no path specified
    if (!path || path === "") {
      return await chrome.bookmarks.move(bookmarkId, {
        parentId: bookmarksBar.id,
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

    // Move bookmark to the target folder
    return await chrome.bookmarks.move(bookmarkId, {
      parentId: currentFolderId,
    })
  } catch (error) {
    console.error("Error moving bookmark:", error)
    throw new Error(
      `Failed to move bookmark: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

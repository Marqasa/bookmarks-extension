/**
 * Types for bookmark sorting
 */
export type SortMode = "folders-first" | "bookmarks-first" | "alphabetical"

/**
 * Sorts all bookmarks within Chrome's bookmark hierarchy.
 *
 * @param sortMode The sorting mode to use: 'folders-first', 'bookmarks-first', or 'alphabetical'
 * @returns The result of the sorting operation
 */
export async function sortBookmarks(
  sortMode: SortMode = "folders-first",
): Promise<{ success: boolean; message: string }> {
  try {
    // Get bookmarks tree and access root folder
    const tree = await chrome.bookmarks.getTree()

    // Start recursively sorting from the root folder
    await sortFolderContents(tree[0].id, sortMode)

    return {
      success: true,
      message: "Bookmarks sorted successfully",
    }
  } catch (error) {
    console.error("Error sorting bookmarks:", error)
    return {
      success: false,
      message: `Failed to sort bookmarks: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Recursively sorts the contents of a bookmark folder and its subfolders
 *
 * @param folderId ID of the folder to sort
 * @param sortMode The sorting mode to use
 */
async function sortFolderContents(
  folderId: string,
  sortMode: SortMode,
): Promise<void> {
  // Get all children of the current folder
  const children = await chrome.bookmarks.getChildren(folderId)

  // Skip empty folders
  if (children.length === 0) return

  // First, recursively sort all subfolders
  for (const node of children) {
    // If the node is a folder (doesn't have a URL), sort its contents
    if (!node.url) {
      await sortFolderContents(node.id, sortMode)
    }
  }

  // Then sort the current folder's contents
  if (children.length > 1) {
    // Sort children by title
    const sortedChildren = [...children].sort((a, b) => {
      // Different sorting behaviors based on mode
      if (sortMode === "folders-first") {
        // If a is a folder and b is not, a comes first
        if (!a.url && b.url) return -1
        // If b is a folder and a is not, b comes first
        if (a.url && !b.url) return 1
      } else if (sortMode === "bookmarks-first") {
        // If a is a bookmark and b is a folder, a comes first
        if (a.url && !b.url) return -1
        // If b is a bookmark and a is a folder, b comes first
        if (!a.url && b.url) return 1
      }
      // For 'alphabetical' mode or after type-based sorting, sort alphabetically by title
      return a.title.localeCompare(b.title)
    })

    // Reorder each bookmark to match the sorted order
    for (let i = 0; i < sortedChildren.length; i++) {
      await chrome.bookmarks.move(sortedChildren[i].id, {
        parentId: folderId,
        index: i,
      })
    }
  }
}

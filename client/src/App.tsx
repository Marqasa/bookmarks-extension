import { useEffect, useState } from "react"
import { categorizeBookmark } from "./helpers/categorizeBookmark"
import { sortBookmarks, SortMode } from "./helpers/sortBookmarks"

function App() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [currentBookmark, setCurrentBookmark] =
    useState<chrome.bookmarks.BookmarkTreeNode | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [autoSort, setAutoSort] = useState<boolean>(false)
  const [sortMode, setSortMode] = useState<SortMode>("folders-first")
  const [categorizeBookmarks, setCategorizeBookmarks] = useState<boolean>(true)

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })

        setCurrentTab(tab)

        if (tab?.url) {
          const bookmarks = await chrome.bookmarks.search({ url: tab.url })
          setCurrentBookmark(bookmarks.length > 0 ? bookmarks[0] : null)
        } else {
          setCurrentBookmark(null)
        }

        // Load organization preferences from storage
        const result = await chrome.storage.sync.get({
          autoSort: false,
          sortMode: "folders-first",
          categorizeBookmarks: true,
        })

        setAutoSort(result.autoSort)
        setSortMode(result.sortMode)
        setCategorizeBookmarks(result.categorizeBookmarks)

        // Auto-sort bookmarks if enabled
        if (result.autoSort) {
          await sortBookmarks(result.sortMode)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking bookmark status:", error)
        setIsLoading(false)
      }
    }

    checkBookmarkStatus()
  }, [])

  const handleToggleBookmark = async () => {
    if (!currentTab?.url) return

    try {
      setIsLoading(true)

      if (currentBookmark) {
        await chrome.bookmarks.remove(currentBookmark.id)
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/star-empty-38.png",
          title: "Bookmark Removed",
          message: "The bookmark has been removed successfully.",
          priority: 0,
        })
        setCurrentBookmark(null)
      } else {
        const newBookmark = await chrome.bookmarks.create({
          title: currentTab.title || "",
          url: currentTab.url,
        })

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/star-filled-38.png",
          title: "Bookmark Added",
          message: categorizeBookmarks
            ? "Bookmark has been added. Categorizing..."
            : "Bookmark has been added successfully.",
          priority: 0,
        })

        if (categorizeBookmarks) {
          try {
            await categorizeBookmark(currentTab.url, currentTab.title ?? "")
          } catch (error) {
            console.error("Error categorizing bookmark:", error)
          }
        }

        // Sort bookmarks if auto-sort is enabled
        if (autoSort) {
          try {
            await sortBookmarks(sortMode)
          } catch (error) {
            console.error("Error sorting bookmarks after adding:", error)
          }
        }

        setCurrentBookmark(newBookmark)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      setIsLoading(false)
    }
  }

  const handleToggleAutoSort = async (value: boolean) => {
    setAutoSort(value)
    await chrome.storage.sync.set({ autoSort: value })

    // Sort bookmarks immediately when turned on
    if (value) {
      try {
        setIsLoading(true)
        await sortBookmarks(sortMode)
        setIsLoading(false)
      } catch (error) {
        console.error("Error sorting bookmarks:", error)
        setIsLoading(false)
      }
    }
  }

  const handleChangeSortMode = async (value: SortMode) => {
    setSortMode(value)
    await chrome.storage.sync.set({ sortMode: value })

    // Re-sort if auto-sort is enabled
    if (autoSort) {
      try {
        setIsLoading(true)
        await sortBookmarks(value)
        setIsLoading(false)
      } catch (error) {
        console.error("Error sorting bookmarks:", error)
        setIsLoading(false)
      }
    }
  }

  const handleToggleCategorize = async (value: boolean) => {
    setCategorizeBookmarks(value)
    await chrome.storage.sync.set({ categorizeBookmarks: value })
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900">
      <div className="min-w-[300px] max-w-full">
        <button
          onClick={handleToggleBookmark}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            currentBookmark
              ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400"
              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-600 dark:text-white hover:bg-indigo-200 dark:hover:bg-indigo-500 focus:ring-indigo-400"
          } ${isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isLoading
            ? "Loading..."
            : currentBookmark
              ? "Remove Bookmark"
              : "Add Bookmark"}
        </button>

        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-categorize bookmarks
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={categorizeBookmarks}
                onChange={(e) => handleToggleCategorize(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-sort bookmarks
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoSort}
                onChange={(e) => handleToggleAutoSort(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {autoSort && (
            <div className="pl-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 ml-1 mt-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Sort order
                </span>
                <select
                  value={sortMode}
                  onChange={(e) =>
                    handleChangeSortMode(e.target.value as SortMode)
                  }
                  className="text-xs py-1 pl-2 pr-8 rounded bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="folders-first">Folders on top</option>
                  <option value="bookmarks-first">Bookmarks on top</option>
                  <option value="alphabetical">Alphabetical only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

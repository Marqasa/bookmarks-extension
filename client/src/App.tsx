import { useEffect, useState } from "react"
import { categorizeBookmark } from "./helpers/categorizeBookmark"

function App() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [currentBookmark, setCurrentBookmark] =
    useState<chrome.bookmarks.BookmarkTreeNode | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [keepOrganized, setKeepOrganized] = useState<boolean>(false)
  const [foldersOnTop, setFoldersOnTop] = useState<boolean>(true)
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
          keepOrganized: false,
          foldersOnTop: true,
          categorizeBookmarks: true,
        })

        setKeepOrganized(result.keepOrganized)
        setFoldersOnTop(result.foldersOnTop)
        setCategorizeBookmarks(result.categorizeBookmarks)
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

        setCurrentBookmark(newBookmark)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      setIsLoading(false)
    }
  }

  const handleToggleOrganize = async (value: boolean) => {
    setKeepOrganized(value)
    await chrome.storage.sync.set({ keepOrganized: value })
  }

  const handleToggleFoldersOnTop = async (value: boolean) => {
    setFoldersOnTop(value)
    await chrome.storage.sync.set({ foldersOnTop: value })
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
              Keep bookmarks organized
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={keepOrganized}
                onChange={(e) => handleToggleOrganize(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {keepOrganized && (
            <div className="pl-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 ml-1 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Keep folders on top
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={foldersOnTop}
                    onChange={(e) => handleToggleFoldersOnTop(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Auto-categorize bookmarks
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={categorizeBookmarks}
                    onChange={(e) => handleToggleCategorize(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

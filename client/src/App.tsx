import { useEffect, useState } from "react"

function App() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [currentBookmark, setCurrentBookmark] =
    useState<chrome.bookmarks.BookmarkTreeNode | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
          message: "Bookmark has been added. Categorizing...",
          priority: 0,
        })

        try {
          chrome.runtime.sendMessage({
            action: "getCategory",
            url: currentTab.url,
            title: currentTab.title ?? "",
          })
        } catch (error) {
          console.error("Error categorizing bookmark:", error)
        }

        setCurrentBookmark(newBookmark)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900">
      <div className="min-w-[240px] max-w-full">
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
      </div>
    </div>
  )
}

export default App

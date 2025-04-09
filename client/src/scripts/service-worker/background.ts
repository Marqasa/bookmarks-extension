import { getCategory } from "../../helpers/getCategory"
import { moveBookmark } from "../../helpers/moveBookmark"

let currentTab: chrome.tabs.Tab
let currentBookmark: chrome.bookmarks.BookmarkTreeNode | undefined

/*
 * Updates the action icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
  chrome.action.setIcon({
    path: currentBookmark
      ? {
          19: "icons/star-filled-19.png",
          38: "icons/star-filled-38.png",
        }
      : {
          19: "icons/star-empty-19.png",
          38: "icons/star-empty-38.png",
        },
    tabId: currentTab.id,
  })
  chrome.action.setTitle({
    // Screen readers can see the title
    title: currentBookmark ? "Remove bookmark" : "Bookmark with AI",
    tabId: currentTab.id,
  })
}

/*
 * Add or remove the bookmark on the current page.
 */
async function toggleBookmark() {
  if (currentBookmark) {
    chrome.bookmarks.remove(currentBookmark.id)
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/star-empty-38.png",
      title: "Bookmark Removed",
      message: "The bookmark has been removed successfully.",
      priority: 0,
    })
  } else if (currentTab.url) {
    // First, create the bookmark immediately without waiting for the category
    const initialBookmark = await chrome.bookmarks.create({
      title: currentTab.title || "",
      url: currentTab.url,
    })

    // Show initial notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/star-filled-38.png",
      title: "Bookmark Added",
      message: "Bookmark has been added. Categorizing...",
      priority: 0,
    })

    // Then, get the category in the background
    getCategory(currentTab.url, currentTab.title ?? "")
      .then((result) => {
        // Update the bookmark with any improved title/url from the API
        moveBookmark(initialBookmark.id, result)

        // Show category notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/star-filled-38.png",
          title: "Bookmark Categorized",
          message: `Bookmark moved to category: ${result}`,
          priority: 0,
        })
      })
      .catch((error) => {
        console.error("Error categorizing bookmark:", error)
      })

    // Update currentBookmark to reflect the newly added bookmark
    currentBookmark = initialBookmark
    updateIcon()
  }
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateAddonStateForActiveTab() {
  function isSupportedProtocol(url: string) {
    const supportedProtocols = ["https:", "http:", "ftp:", "file:"]
    let parsedUrl
    try {
      parsedUrl = new URL(url)
      return supportedProtocols.includes(parsedUrl.protocol)
    } catch (e: unknown) {
      console.error(e)
      return false
    }
  }

  function updateTab(tabs: chrome.tabs.Tab[]) {
    if (tabs[0]) {
      currentTab = tabs[0]
      if (currentTab.url && isSupportedProtocol(currentTab.url)) {
        const searching = chrome.bookmarks.search({ url: currentTab.url })
        searching.then((bookmarks) => {
          currentBookmark = bookmarks[0]
          updateIcon()
        })
      } else {
        currentBookmark = undefined
        console.log(
          "URL not supported. Supported protocols are: http, https, ftp, file",
        )
      }
    }
  }

  const gettingActiveTab = chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  gettingActiveTab.then(updateTab)
}

// Listen for clicks on the action icon
chrome.action.onClicked.addListener(toggleBookmark)

// Listen for bookmarks being created
chrome.bookmarks.onCreated.addListener(updateAddonStateForActiveTab)

// Listen for bookmarks being removed
chrome.bookmarks.onRemoved.addListener(updateAddonStateForActiveTab)

// Listen to tab URL changes
chrome.tabs.onUpdated.addListener(updateAddonStateForActiveTab)

// Listen to tab switching
chrome.tabs.onActivated.addListener(updateAddonStateForActiveTab)

// Listen for window switching
chrome.windows.onFocusChanged.addListener(updateAddonStateForActiveTab)

// Update when the extension loads initially
updateAddonStateForActiveTab()

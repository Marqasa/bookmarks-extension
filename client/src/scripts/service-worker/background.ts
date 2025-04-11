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

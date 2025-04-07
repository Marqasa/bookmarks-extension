import { useChat } from "@ai-sdk/react"
import { addBookmark } from "./helpers/addBookmark"
import { useState } from "react"
import { getCategory } from "./helpers/getCategory"

function App() {
  const [bookmarkUrl, setBookmarkUrl] = useState("")
  const [addResult, setAddResult] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "http://localhost:8080/api/chat",
  })

  const handleBookmarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (bookmarkUrl.trim()) {
      try {
        setAddResult("Processing bookmark...")

        const result = await getCategory(bookmarkUrl)
        console.log("Categorization result:", result)

        // Add the bookmark using the categorization result
        const bookmarkResult = await addBookmark(
          result.url || bookmarkUrl,
          result.title || "Untitled Bookmark",
          result.category || "",
        )

        setAddResult(
          `Bookmark successfully added to ${result.category || "bookmarks"}`,
        )
        console.log("Bookmark added:", bookmarkResult)

        // Clear the input field
        setBookmarkUrl("")
      } catch (error) {
        setAddResult(
          `Error adding bookmark: ${error instanceof Error ? error.message : String(error)}`,
        )
        console.error("Error processing bookmark:", error)
      }
    }
  }

  return (
    <div className="flex flex-col w-2xl max-w-full mx-auto p-6 gap-4">
      <div className="mb-4 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg">
        <h2 className="text-lg font-medium mb-3">Add New Bookmark</h2>
        <form onSubmit={handleBookmarkSubmit} className="flex gap-2">
          <input
            className="flex-grow p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-900"
            value={bookmarkUrl}
            placeholder="Enter URL to bookmark..."
            onChange={(e) => setBookmarkUrl(e.target.value)}
            type="url"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            Add
          </button>
        </form>

        {addResult && (
          <div
            className={`mt-4 p-3 rounded-lg ${addResult.includes("Error") ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"}`}
          >
            {addResult}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`whitespace-pre-wrap p-3 rounded-lg ${
              message.role === "user"
                ? "bg-blue-100 dark:bg-blue-900 ml-auto"
                : "bg-gray-100 dark:bg-zinc-800 mr-auto"
            }`}
          >
            <div className="font-medium mb-1">
              {message.role === "user" ? "You" : "AI Assistant"}
            </div>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return <div key={`${message.id}-${i}`}>{part.text}</div>
              }
            })}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-auto">
        <input
          className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-zinc-900"
          value={input}
          placeholder="Type your message..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}

export default App

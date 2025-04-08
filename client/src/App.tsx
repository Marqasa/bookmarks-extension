import { useChat } from "@ai-sdk/react"

function App() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "http://localhost:8080/api/chat",
  })

  return (
    <div className="flex flex-col w-2xl max-w-full mx-auto p-6 gap-4">
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

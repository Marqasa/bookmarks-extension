import "./App.css"
import { useChat } from "@ai-sdk/react"

function App() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "http://localhost:8080/api/chat",
  })

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default App

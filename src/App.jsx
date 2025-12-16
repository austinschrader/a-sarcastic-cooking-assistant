import React from 'react'
import ChatInterface from './components/ChatInterface'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>A sarcastic cooking assistant</h1>
      </header>
      <main className="app-main">
        <ChatInterface agentDescription="A sarcastic cooking assistant" />
      </main>
    </div>
  )
}

export default App

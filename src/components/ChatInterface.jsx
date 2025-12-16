import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import '../styles/ChatInterface.css'

function ChatInterface({ agentDescription }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm ${agentDescription}. How can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('anthropic')
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef(null)

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('ai_api_key')
    const storedProvider = localStorage.getItem('ai_provider')
    if (storedKey) setApiKey(storedKey)
    if (storedProvider) setProvider(storedProvider)
  }, [])

  // Show settings if no API key is set
  useEffect(() => {
    if (!apiKey) {
      setShowSettings(true)
    }
  }, [apiKey])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const saveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_api_key', apiKey.trim())
      localStorage.setItem('ai_provider', provider)
      setShowSettings(false)
    }
  }

  const clearSettings = () => {
    localStorage.removeItem('ai_api_key')
    localStorage.removeItem('ai_provider')
    setApiKey('')
    setProvider('anthropic')
    setShowSettings(true)
  }

  const callAnthropicAPI = async (messageHistory) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: messageHistory
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'API request failed')
    }

    const data = await response.json()
    return data.content[0].text
  }

  const callOpenAIAPI = async (messageHistory) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messageHistory
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'API request failed')
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !apiKey) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      let responseText
      const messageHistory = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      if (provider === 'anthropic') {
        responseText = await callAnthropicAPI(messageHistory)
      } else if (provider === 'openai') {
        responseText = await callOpenAIAPI(messageHistory)
      }

      const assistantMessage = {
        role: 'assistant',
        content: responseText
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling API:', error)
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. Please check your API key in settings.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-interface">
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <h2>API Settings</h2>
            <p>Enter your API key to start chatting</p>

            <label>
              Provider:
              <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT-4)</option>
              </select>
            </label>

            <label>
              API Key:
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              />
            </label>

            <div className="settings-buttons">
              <button onClick={saveSettings} disabled={!apiKey.trim()}>
                Save & Start
              </button>
              {localStorage.getItem('ai_api_key') && (
                <button onClick={() => setShowSettings(false)} className="secondary">
                  Cancel
                </button>
              )}
            </div>

            <p className="settings-note">
              Your API key is stored locally in your browser and never sent to any server except {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}.
            </p>
          </div>
        </div>
      )}

      <div className="chat-header">
        <button onClick={() => setShowSettings(true)} className="settings-button">
          ⚙️ Settings
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={apiKey ? "Type your message..." : "Configure API key in settings first..."}
          className="message-input"
          disabled={isLoading || !apiKey}
        />
        <button
          type="submit"
          className="send-button"
          disabled={isLoading || !input.trim() || !apiKey}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatInterface

import { useEffect, useState } from 'react'
import {
  extensionApi,
  type PopupState,
  type RuntimeMessage,
} from './extension'
import './App.css'

const emptyState: PopupState = {
  activeContext: null,
  lastUpdatedAt: null,
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return 'Waiting for a supported tab'
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
}

function App() {
  const [state, setState] = useState<PopupState>(emptyState)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const chromeApi = extensionApi

    if (!chromeApi) {
      setIsLoading(false)
      return
    }

    chromeApi.runtime.sendMessage(
      { type: 'REQUEST_CONTEXT_SCRAPE' },
      (response) => {
        if (response) {
          setState(response)
        }
        setIsLoading(false)
      },
    )

    const handleMessage = (
      message: RuntimeMessage,
      _sender: { tab?: { id?: number } },
      _sendResponse: (response?: PopupState) => void,
    ) => {
      if (message.type !== 'CONTEXT_UPDATED') {
        return
      }

      setState({
        activeContext: message.payload,
        lastUpdatedAt: message.payload.capturedAt,
      })
      setIsLoading(false)
    }

    chromeApi.runtime.onMessage.addListener(handleMessage)

    return () => {
      chromeApi.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  const context = state.activeContext
  const domainLabel = context?.hostname || 'No page detected'

  return (
    <main className="popup-shell">
      <section className="hero-card">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">
            <span>d</span>
            <span>b</span>
          </div>
          <div>
            <p className="eyebrow">Decible</p>
            <h1>Context Scraper</h1>
          </div>
        </div>

        <p className="hero-copy">
          Real-time browser metadata for your future vibe engine.
        </p>

        <div className="status-pill">
          <span className={context ? 'status-dot live' : 'status-dot idle'} />
          {isLoading ? 'Scanning active tab...' : formatTimestamp(state.lastUpdatedAt)}
        </div>
      </section>

      <section className="context-card">
        <div className="section-heading">
          <p className="eyebrow">Active environment</p>
          <strong>{domainLabel}</strong>
        </div>

        <div className="data-block">
          <span className="label">Title</span>
          <p>{context?.title || 'Open a normal website tab to begin scraping context.'}</p>
        </div>

        <div className="data-block">
          <span className="label">Description</span>
          <p>{context?.description || 'No meta description found on this page yet.'}</p>
        </div>

        <div className="data-block">
          <span className="label">URL</span>
          <p className="mono">{context?.url || 'Unavailable'}</p>
        </div>
      </section>

      <section className="meta-grid">
        <article className="mini-card">
          <span className="label">Signals captured</span>
          <strong>{context ? 3 : 0}</strong>
          <p>Title, hostname, metadata</p>
        </article>

        <article className="mini-card">
          <span className="label">Keywords</span>
          <strong>{context?.keywords.length || 0}</strong>
          <p>{context?.keywords.slice(0, 3).join(' / ') || 'Waiting for page tags'}</p>
        </article>
      </section>
    </main>
  )
}

export default App

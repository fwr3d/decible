import { extensionApi, type PageContext, type RuntimeMessage } from './extension'

function readMetaContent(name: string) {
  return (
    document
      .querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      ?.getAttribute('content')
      ?.trim() || undefined
  )
}

function scrapePageContext(): PageContext {
  const keywords =
    readMetaContent('keywords')
      ?.split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean) || []

  return {
    title: document.title || 'Untitled page',
    url: window.location.href,
    hostname: window.location.hostname,
    description:
      readMetaContent('description') || readMetaContent('og:description'),
    keywords,
    capturedAt: Date.now(),
  }
}

function reportContext() {
  if (!extensionApi || !window.location.href.startsWith('http')) {
    return
  }

  extensionApi.runtime.sendMessage({
    type: 'SCRAPED_CONTEXT',
    payload: scrapePageContext(),
  })
}

let scrapeTimeout: number | undefined

function scheduleContextReport() {
  window.clearTimeout(scrapeTimeout)
  scrapeTimeout = window.setTimeout(reportContext, 180)
}

if (extensionApi) {
  reportContext()

  extensionApi.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type === 'REQUEST_CONTEXT_SCRAPE') {
      reportContext()
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleContextReport()
    }
  })

  window.addEventListener('focus', scheduleContextReport)
  window.addEventListener('popstate', scheduleContextReport)

  const observer = new MutationObserver(() => {
    scheduleContextReport()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: false,
  })
}

import {
  ACTIVE_CONTEXT_KEY,
  extensionApi,
  getPopupStateFromStorage,
  type RuntimeMessage,
} from './extension'

const chromeApi = extensionApi

function broadcastContextUpdate() {
  if (!chromeApi) {
    return
  }

  getPopupStateFromStorage(chromeApi.storage.local, (state) => {
    if (!state.activeContext) {
      return
    }

    chromeApi.runtime.sendMessage({
      type: 'CONTEXT_UPDATED',
      payload: state.activeContext,
    })
  })
}

function requestScrapeFromActiveTab() {
  if (!chromeApi) {
    return
  }

  chromeApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0]?.id
    if (!activeTabId) {
      return
    }

    chromeApi.tabs.sendMessage(activeTabId, { type: 'REQUEST_CONTEXT_SCRAPE' })
  })
}

if (chromeApi) {
  chromeApi.runtime.onMessage.addListener(
    (message: RuntimeMessage, _sender, sendResponse) => {
      if (message.type === 'SCRAPED_CONTEXT') {
        chromeApi.storage.local.set(
          { [ACTIVE_CONTEXT_KEY]: message.payload },
          broadcastContextUpdate,
        )
        return
      }

      if (message.type === 'REQUEST_CONTEXT_SCRAPE') {
        requestScrapeFromActiveTab()
        getPopupStateFromStorage(chromeApi.storage.local, sendResponse)
        return true
      }
    },
  )

  chromeApi.tabs.onActivated.addListener(requestScrapeFromActiveTab)
  chromeApi.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      requestScrapeFromActiveTab()
    }
  })
}

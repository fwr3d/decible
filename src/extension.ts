export type PageContext = {
  title: string
  url: string
  hostname: string
  description?: string
  keywords: string[]
  capturedAt: number
}

export type PopupState = {
  activeContext: PageContext | null
  lastUpdatedAt: number | null
}

export type RuntimeMessage =
  | { type: 'SCRAPED_CONTEXT'; payload: PageContext }
  | { type: 'CONTEXT_UPDATED'; payload: PageContext }
  | { type: 'REQUEST_CONTEXT_SCRAPE' }

export const ACTIVE_CONTEXT_KEY = 'activeContext'

export type StorageArea = {
  get: (
    keys: string | string[] | Record<string, unknown>,
    callback: (items: Record<string, unknown>) => void,
  ) => void
  set: (items: Record<string, unknown>, callback?: () => void) => void
}

export type RuntimeListener = (
  message: RuntimeMessage,
  sender: { tab?: { id?: number } },
  sendResponse: (response?: PopupState) => void,
) => boolean | void

export type RuntimeApi = {
  lastError?: { message?: string }
  sendMessage: (
    message: RuntimeMessage,
    callback?: (response?: PopupState) => void,
  ) => void
  onMessage: {
    addListener: (callback: RuntimeListener) => void
    removeListener: (callback: RuntimeListener) => void
  }
}

export type TabsApi = {
  query: (
    queryInfo: { active?: boolean; currentWindow?: boolean },
    callback: (tabs: Array<{ id?: number }>) => void,
  ) => void
  sendMessage: (
    tabId: number,
    message: RuntimeMessage,
    callback?: (response?: unknown) => void,
  ) => void
  onActivated: {
    addListener: (callback: () => void) => void
  }
  onUpdated: {
    addListener: (
      callback: (
        tabId: number,
        changeInfo: { status?: string },
      ) => void,
    ) => void
  }
}

export type ChromeApi = {
  runtime: RuntimeApi
  storage: { local: StorageArea }
  tabs: TabsApi
}

export const extensionApi = (globalThis as typeof globalThis & {
  chrome?: ChromeApi
}).chrome

export function getPopupStateFromStorage(
  storage: StorageArea,
  callback: (state: PopupState) => void,
) {
  storage.get(ACTIVE_CONTEXT_KEY, (items) => {
    const activeContext = (items[ACTIVE_CONTEXT_KEY] as PageContext | undefined) ?? null

    callback({
      activeContext,
      lastUpdatedAt: activeContext?.capturedAt ?? null,
    })
  })
}

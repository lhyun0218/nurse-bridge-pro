type Handler = (msg: any) => void

const CHANNEL = 'nb:channel'

class Broadcast {
  bc: BroadcastChannel | null = null
  fallbackKey = 'nb:broadcast:msg'
  handlers: Handler[] = []
  storageListener: ((e: StorageEvent) => void) | null = null

  // storage 이벤트가 msg 키와 ping 키 두 번 발생하는 중복 방지용 타임스탬프
  private lastStorageTs = 0

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel(CHANNEL)
        this.bc.addEventListener('message', (ev) => {
          this._dispatch(ev.data)
        })
      } catch (e) {
        this.bc = null
      }
    }

    if (typeof window !== 'undefined') {
      this.storageListener = (e: StorageEvent) => {
        // ping 키와 msg 키 둘 다 이벤트가 오는데, 동일 메시지를 두 번 처리하지 않도록
        // ts 기준으로 50ms 이내 중복은 무시
        if (e.key !== this.fallbackKey && e.key !== this.fallbackKey + ':ping') return
        try {
          const raw = localStorage.getItem(this.fallbackKey)
          if (!raw) return
          const msg = JSON.parse(raw)
          const now = Date.now()
          if (now - this.lastStorageTs < 50) return // 중복 방지
          this.lastStorageTs = now
          this._dispatch(msg)
        } catch (err) {}
      }
      window.addEventListener('storage', this.storageListener)
    }
  }

  private _dispatch(msg: any) {
    for (const h of this.handlers) h(msg)
  }

  send(type: string, payload?: any) {
    // payload를 최상위로 플랫하게 병합
    const msg = { type, ...payload, ts: Date.now() }

    if (this.bc) {
      // BroadcastChannel: 다른 탭/워커에만 전달됨 (같은 탭 수신 없음)
      this.bc.postMessage(msg)
    } else {
      // BroadcastChannel 미지원 시 localStorage 폴백 (다른 탭의 storage 이벤트 트리거)
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(this.fallbackKey, JSON.stringify(msg))
          // ping 키는 제거 — msg 키 하나만 써서 storage 이벤트 1번만 발생
        } catch (e) {}
      }
    }
    // 같은 탭 handlers는 직접 호출하지 않음.
    // 같은 탭 내 이벤트는 발신자가 직접 dispatch(action)으로 처리.
  }

  subscribe(handler: Handler) {
    this.handlers.push(handler)
    return () => {
      const idx = this.handlers.indexOf(handler)
      if (idx !== -1) this.handlers.splice(idx, 1)
    }
  }
}

export default new Broadcast()

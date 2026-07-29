import { useRef, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Send, Moon, Sun, Bot, User, AlertCircle, Loader2, Download, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { useTutor, type Message } from '@/hooks/useTutor'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { exportConversation } from '@/lib/exportPDF'
import { cn } from '@/lib/utils'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import mermaid from 'mermaid'
import { searchEmojis, type EmojiEntry } from '@/lib/emojis'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  suppressErrorRendering: true,
})

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}

// Configure marked with syntax highlighting
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderer = new marked.Renderer()
renderer.code = ({ text, lang }) => {
  // Mermaid diagram
  if (lang === 'mermaid') {
    const id = `mermaid-${Math.random().toString(36).slice(2)}`
    return `<div class="mermaid-wrapper"><div class="mermaid" id="${id}">${text}</div></div>`
  }

  // Interactive quiz
  if (lang === 'quiz') {
    const lines = text.trim().split('\n')
    const question = lines[0]
    const correctLine = lines.find((l) => l.startsWith('correct:'))
    const correct = correctLine ? correctLine.replace('correct:', '').trim() : ''
    const options = lines.slice(1).filter((l) => l.match(/^[A-D]\)/))
    const id = `quiz-${Math.random().toString(36).slice(2)}`
    const optionsHtml = options
      .map((opt) => {
        const letter = opt[0]
        const text = opt.slice(2).trim()
        return `<button class="quiz-option" data-quiz="${id}" data-letter="${letter}" data-correct="${correct}">${letter}) ${text}</button>`
      })
      .join('')
    return `<div class="quiz-block" id="${id}">
      <div class="quiz-question">${question}</div>
      <div class="quiz-options">${optionsHtml}</div>
      <div class="quiz-feedback" id="${id}-feedback"></div>
    </div>`
  }

  // Regular code block
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">${language}</span>
      <button class="copy-code-btn" data-code="${encodeURIComponent(text)}" aria-label="Copiar código">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        Copiar
      </button>
    </div>
    <pre><code class="hljs language-${language}">${highlighted}</code></pre>
  </div>`
}
marked.use({ renderer })

function highlightSearch(html: string, query: string, isActive?: boolean): string {
  if (!query) return html
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cls = isActive ? 'search-highlight search-highlight-active' : 'search-highlight'
  return html.replace(new RegExp(`(${escaped})`, 'gi'), `<mark class="${cls}">$1</mark>`)
}

function formatDateSeparator(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(date, today)) return 'Hoy'
  if (sameDay(date, yesterday)) return 'Ayer'
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium capitalize text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}

// Detect "Opción A / B / C" or standalone "A) B) C)" option patterns
function detectOptions(content: string): string[] {
  // "Opción A", "Opcion B", "**Opción A**", etc.
  const namedMatches = new Set<string>()
  const namedRe = /opci[oó]n\s+([A-D])/gi
  let m
  while ((m = namedRe.exec(content)) !== null) namedMatches.add(m[1].toUpperCase())
  if (namedMatches.size >= 2) return [...namedMatches].sort().map((l) => `Opción ${l}`)

  // "A) text" or "**A)**" at start of line
  const letterMatches = new Set<string>()
  const letterRe = /^\s*\*{0,2}([A-D])\)\*{0,2}/gm
  while ((m = letterRe.exec(content)) !== null) letterMatches.add(m[1].toUpperCase())
  if (letterMatches.size >= 2) return [...letterMatches].sort().map((l) => `${l}`)

  return []
}

function MessageBubble({ message, avatarUrl, searchQuery, isActiveMatch, onAction }: {
  message: Message
  avatarUrl?: string
  searchQuery?: string
  isActiveMatch?: boolean
  onAction?: (text: string) => void
}) {
  const isUser = message.role === 'user'
  const bubbleRef = useRef<HTMLDivElement>(null)

  let html = isUser
    ? message.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br />')
    : renderMarkdown(message.content)

  if (searchQuery) html = highlightSearch(html, searchQuery, isActiveMatch)

  // Wire up interactive elements after render
  useEffect(() => {
    const el = bubbleRef.current
    if (!el) return

    // Copy buttons
    el.querySelectorAll<HTMLButtonElement>('.copy-code-btn').forEach((btn) => {
      btn.onclick = () => {
        const code = decodeURIComponent(btn.dataset.code ?? '')
        const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        const svgCopy = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
        const markDone = () => {
          btn.innerHTML = `${svgCheck} ¡Copiado!`
          setTimeout(() => { btn.innerHTML = `${svgCopy} Copiar` }, 2000)
        }
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(markDone).catch(() => {
            // fallback for focus/permission issues
            const ta = document.createElement('textarea')
            ta.value = code
            ta.style.cssText = 'position:fixed;opacity:0'
            document.body.appendChild(ta)
            ta.focus()
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            markDone()
          })
        } else {
          const ta = document.createElement('textarea')
          ta.value = code
          ta.style.cssText = 'position:fixed;opacity:0'
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          markDone()
        }
      }
    })

    // Quiz options
    el.querySelectorAll<HTMLButtonElement>('.quiz-option').forEach((btn) => {
      btn.onclick = () => {
        const quizId = btn.dataset.quiz ?? ''
        const letter = btn.dataset.letter ?? ''
        const correct = btn.dataset.correct ?? ''
        const quizEl = document.getElementById(quizId)
        if (!quizEl || quizEl.dataset.answered) return
        quizEl.dataset.answered = '1'
        const isCorrect = letter === correct
        quizEl.querySelectorAll<HTMLButtonElement>('.quiz-option').forEach((b) => {
          b.disabled = true
          if (b.dataset.letter === correct) b.classList.add('quiz-correct')
          else if (b.dataset.letter === letter && !isCorrect) b.classList.add('quiz-wrong')
        })
        const feedback = document.getElementById(`${quizId}-feedback`)
        if (feedback) {
          feedback.textContent = isCorrect ? '✓ ¡Correcto!' : `✗ Incorrecto. La respuesta correcta era ${correct}.`
          feedback.className = `quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`
        }
      }
    })

    // Mermaid diagrams — render with error fallback
    const mermaidEls = el.querySelectorAll<HTMLElement>('.mermaid')
    if (mermaidEls.length > 0) {
      void mermaid.run({ nodes: Array.from(mermaidEls) }).catch(() => {
        mermaidEls.forEach((node) => {
          if (!node.dataset.processed) {
            const rawCode = node.textContent ?? ''
            node.closest('.mermaid-wrapper')?.replaceWith(
              Object.assign(document.createElement('div'), {
                className: 'code-block-wrapper',
                innerHTML: `<div class="code-block-header"><span class="code-lang">mermaid</span></div><pre><code class="hljs">${rawCode.replace(/</g, '&lt;')}</code></pre>`,
              })
            )
          }
        })
      })
    }
  }, [message.content])

  return (
    <div
      data-msg-id={message.id}
      className={cn(
        'flex items-start gap-3 rounded-xl transition-colors duration-300',
        isUser && 'flex-row-reverse',
        isActiveMatch && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
      )}
    >
      {isUser && avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </div>
      )}
      <div className="flex max-w-[75%] flex-col gap-2">
        <div
          ref={bubbleRef}
          className={cn(
            'prose-message rounded-2xl px-4 py-3 text-sm',
            isUser ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm bg-muted text-foreground',
            message.content === '' && 'min-w-[60px]',
          )}
          dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} // eslint-disable-line react/no-danger
        />
        {!isUser && onAction && message.content.length > 0 && (() => {
          const options = detectOptions(message.content)
          if (options.length >= 2) {
            return (
              <div className="flex flex-wrap gap-1.5 pl-1">
                <span className="w-full text-xs text-muted-foreground pl-0.5 mb-0.5">Elegir:</span>
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onAction(opt)}
                    className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )
          }
          return (
            <div className="flex flex-wrap gap-1.5 pl-1">
              {['Dame un ejemplo', 'Explicá de otra manera', 'Dame un ejercicio', 'Profundizar'].map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => onAction(action)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  {action}
                </button>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1">
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default function TutorSession() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  const [topic, setTopic] = useState<string>('')
  useEffect(() => {
    async function loadTopic() {
      const { data } = await supabase.from('sessions').select('topic').eq('id', id).single()
      if (data) setTopic((data as { topic: string }).topic)
      else void navigate('/')
    }
    void loadTopic()
  }, [id])

  const { messages, isLoading, error, sendMessage, initialized } = useTutor(id, topic)
  const [input, setInput] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  const matchingMsgIds = searchQuery
    ? messages
        .filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((m) => m.id)
    : []

  // When query changes, jump to the match closest to current scroll position
  useEffect(() => {
    if (!searchQuery || matchingMsgIds.length === 0) { setCurrentMatchIdx(0); return }
    const main = mainRef.current
    if (!main) { setCurrentMatchIdx(0); return }
    const viewportCenter = main.scrollTop + main.clientHeight / 2
    let closestIdx = 0
    let closestDist = Infinity
    matchingMsgIds.forEach((id, idx) => {
      const el = main.querySelector(`[data-msg-id="${id}"]`) as HTMLElement | null
      if (!el) return
      const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - viewportCenter)
      if (dist < closestDist) { closestDist = dist; closestIdx = idx }
    })
    setCurrentMatchIdx(closestIdx)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to active match
  useEffect(() => {
    if (!matchingMsgIds.length) return
    const id = matchingMsgIds[currentMatchIdx]
    const el = mainRef.current?.querySelector(`[data-msg-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentMatchIdx, searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToMatch(delta: 1 | -1) {
    if (!matchingMsgIds.length) return
    setCurrentMatchIdx((i) => (i + delta + matchingMsgIds.length) % matchingMsgIds.length)
  }

  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])
  const bottomRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isStreaming = isLoading && messages[messages.length - 1]?.role === 'assistant'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function onScroll() {
      setShowScrollBtn(el!.scrollHeight - el!.scrollTop - el!.clientHeight > 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [topic])

  // Emoji picker state
  const [emojiMatches, setEmojiMatches] = useState<EmojiEntry[]>([])
  const [emojiActiveIdx, setEmojiActiveIdx] = useState(0)
  const [emojiTriggerStart, setEmojiTriggerStart] = useState(-1)

  function detectEmojiQuery(value: string, cursor: number) {
    const text = value.slice(0, cursor)
    const match = text.match(/:([a-zA-Z0-9_+-]*)$/)
    if (!match) { setEmojiMatches([]); setEmojiTriggerStart(-1); return }
    const query = match[1]
    const start = cursor - match[0].length
    setEmojiTriggerStart(start)
    setEmojiActiveIdx(0)
    setEmojiMatches(searchEmojis(query))
  }

  function insertEmoji(entry: EmojiEntry) {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart ?? input.length
    const before = input.slice(0, emojiTriggerStart)
    const after = input.slice(cursor)
    const newValue = before + entry.emoji + ' ' + after
    setInput(newValue)
    setEmojiMatches([])
    setEmojiTriggerStart(-1)
    // restore focus + cursor after emoji
    requestAnimationFrame(() => {
      ta.focus()
      const pos = before.length + entry.emoji.length + 1
      ta.setSelectionRange(pos, pos)
    })
  }

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (emojiMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setEmojiActiveIdx((i) => (i + 1) % emojiMatches.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setEmojiActiveIdx((i) => (i - 1 + emojiMatches.length) % emojiMatches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertEmoji(emojiMatches[emojiActiveIdx]); return }
      if (e.key === 'Escape') { setEmojiMatches([]); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
  }

  async function submit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    setEmojiMatches([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(text)
  }

  if (!topic) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver al inicio">
          <ArrowLeft />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{topic}</p>
            <p className="text-xs text-muted-foreground">{isStreaming ? 'Escribiendo…' : 'Tutor IA'}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setShowSearch((v) => !v); setSearchQuery('') }}
          aria-label="Buscar en la conversación"
          disabled={messages.length === 0}
        >
          <Search />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => exportConversation(topic, messages)}
          aria-label="Descargar conversación como PDF"
          disabled={messages.length === 0}
        >
          <Download />
        </Button>
        <ThemeToggle />
      </header>

      {showSearch && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goToMatch(e.shiftKey ? -1 : 1)
              if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }
            }}
            placeholder="Buscar en la conversación..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchQuery && (
            <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
              {matchingMsgIds.length > 0 ? `${currentMatchIdx + 1} / ${matchingMsgIds.length}` : '0 resultados'}
            </span>
          )}
          <button
            type="button"
            onClick={() => goToMatch(-1)}
            disabled={matchingMsgIds.length === 0}
            aria-label="Match anterior"
            className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goToMatch(1)}
            disabled={matchingMsgIds.length === 0}
            aria-label="Match siguiente"
            className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => { setShowSearch(false); setSearchQuery('') }}>
            <X />
          </Button>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md backdrop-blur-sm transition hover:text-foreground"
        >
          <ChevronDown className="size-3.5" />
          Ir al final
        </button>
      )}
      <main ref={mainRef} className="h-full overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl lg:max-w-3xl flex-col gap-4">
          {!initialized ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            messages.flatMap((msg, idx) => {
              const elements = []
              const prevMsg = messages[idx - 1]
              const showDate = msg.created_at && (
                !prevMsg?.created_at || dayKey(msg.created_at) !== dayKey(prevMsg.created_at)
              )
              if (showDate && msg.created_at) {
                elements.push(
                  <DateSeparator key={`date-${msg.id}`} label={formatDateSeparator(msg.created_at)} />
                )
              }
              elements.push(
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  avatarUrl={avatarUrl}
                  searchQuery={searchQuery}
                  isActiveMatch={searchQuery ? matchingMsgIds[currentMatchIdx] === msg.id : false}
                  onAction={(text) => { setInput(text); void sendMessage(text) }}
                />
              )
              return elements
            })
          )}
          {isLoading && !isStreaming && <TypingIndicator />}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />{error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>
      </div>

      <footer className="shrink-0 border-t border-border bg-background/80 px-4 py-4 backdrop-blur-sm">
        {emojiMatches.length > 0 && (
          <div className="mx-auto mb-2 max-w-2xl lg:max-w-3xl">
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1.5 shadow-lg">
              {emojiMatches.map((entry, idx) => (
                <button
                  key={entry.name}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertEmoji(entry) }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors',
                    idx === emojiActiveIdx
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span className="text-base leading-none">{entry.emoji}</span>
                  <span className="text-xs text-current/70">:{entry.name}:</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void submit() }}
          className="mx-auto flex max-w-2xl lg:max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef} rows={1} value={input}
            onChange={(e) => {
              setInput(e.target.value)
              detectEmojiQuery(e.target.value, e.target.selectionStart ?? e.target.value.length)
            }}
            onInput={resizeTextarea} onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..." disabled={isLoading || !initialized}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50 disabled:opacity-50"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading || !initialized}
            className="shrink-0 rounded-xl" aria-label="Enviar">
            <Send />
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </footer>
    </div>
  )
}

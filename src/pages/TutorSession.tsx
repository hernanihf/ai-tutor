import { useRef, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Send, Moon, Sun, Bot, User, AlertCircle, Loader2, Download, ChevronDown, Search, X } from 'lucide-react'
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
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  const id = `code-${Math.random().toString(36).slice(2)}`
  return `<div class="code-block-wrapper" data-id="${id}">
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

function highlightSearch(html: string, query: string): string {
  if (!query) return html
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
}

function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}

function MessageBubble({ message, avatarUrl, searchQuery, onAction }: {
  message: Message
  avatarUrl?: string
  searchQuery?: string
  onAction?: (text: string) => void
}) {
  const isUser = message.role === 'user'
  const bubbleRef = useRef<HTMLDivElement>(null)

  let html = isUser
    ? message.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br />')
    : renderMarkdown(message.content)

  if (searchQuery) html = highlightSearch(html, searchQuery)

  // Wire up copy buttons inside code blocks
  useEffect(() => {
    const el = bubbleRef.current
    if (!el) return
    const buttons = el.querySelectorAll<HTMLButtonElement>('.copy-code-btn')
    buttons.forEach((btn) => {
      btn.onclick = () => {
        const code = decodeURIComponent(btn.dataset.code ?? '')
        void navigator.clipboard.writeText(code).then(() => {
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ¡Copiado!`
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copiar`
          }, 2000)
        })
      }
    })
  }, [message.content])

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
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
        {!isUser && onAction && message.content.length > 0 && (
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
        )}
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
  const searchRef = useRef<HTMLInputElement>(null)

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

  function resizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
  }

  async function submit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
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
            placeholder="Buscar en la conversación..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              {messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} resultados
            </span>
          )}
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
            messages
              .filter((msg) => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  avatarUrl={avatarUrl}
                  searchQuery={searchQuery}
                  onAction={(text) => { setInput(text); void sendMessage(text) }}
                />
              ))
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
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); void submit() }}
          className="mx-auto flex max-w-2xl lg:max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef} rows={1} value={input}
            onChange={(e) => setInput(e.target.value)}
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

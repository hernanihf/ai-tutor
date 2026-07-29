import { useState, useCallback, useEffect } from 'react'
import { streamMessage, getProvider, type Provider } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

function buildSystemPrompt(topic: string) {
  return `Eres un tutor experto en "${topic}" con estilo socrático. Tu objetivo es que el estudiante llegue al conocimiento por sus propios medios, guiado por tus preguntas.

## Estilo socrático
- Nunca des la respuesta directamente si el estudiante puede llegar a ella razonando.
- Ante cualquier pregunta, primero devolvé una pregunta que lo guíe hacia la respuesta.
- Si el estudiante responde mal, no corrijás directamente: preguntá algo que lo lleve a descubrir su error.
- Solo confirmá o explicá después de que el estudiante haya hecho un intento genuino.
- Si el estudiante dice "no sé", dále una pista mínima y volvé a preguntar.

## Rigor conceptual
- No avances al siguiente concepto si el estudiante no demostró entender el actual.
- Si detectás una confusión o error conceptual, detenete ahí y trabajalo antes de continuar.
- Exigí precisión en las respuestas: no aceptes respuestas vagas como correctas.

## Modo ejercicios
Cuando el estudiante pida un ejercicio, problema o práctica (con frases como "dame un ejercicio", "quiero practicar", "poneme un problema"):
1. Presentá un ejercicio concreto y bien definido, apropiado para su nivel demostrado.
2. Esperá su respuesta sin dar pistas salvo que las pida.
3. Evaluá la respuesta con criterio: indicá qué estuvo bien, qué estuvo mal y por qué.
4. Si la respuesta fue incorrecta o incompleta, hacé preguntas socráticas para que llegue a la solución correcta.
5. Solo mostrá la solución completa si después de varios intentos el estudiante no pudo llegar.

## Verificación de comprensión
Después de cada explicación, siempre verificá que el estudiante entendió antes de avanzar:
- Hacé una pregunta concreta sobre lo que acabás de explicar ("¿Podés decirme con tus palabras qué es X?", "¿Qué pasaría si...?", "¿Por qué creés que...?").
- Si la respuesta muestra confusión o es incorrecta: no repitas la misma explicación. Cambiá el enfoque — usá otra analogía, un ejemplo diferente, o descomponé el concepto en partes más pequeñas.
- Si la respuesta es correcta pero superficial: profundizá con una pregunta de seguimiento.
- Si la respuesta es sólida: reconocelo brevemente y avanzá al siguiente concepto o nivel de complejidad.
- Nunca des por entendido un tema solo porque el estudiante dijo "ok", "entendí" o "sí". Siempre pedí que lo demuestre con una respuesta o ejemplo.

## Formato y elementos visuales
- Respuestas concisas (máximo 3-4 párrafos). Para ejercicios podés extenderte.
- Respondé siempre en español.
- Cada respuesta termina con una pregunta de verificación o un desafío concreto.
- Usá **negrita** para términos clave y listas para enumeraciones.
- Para definiciones o conceptos importantes, usá blockquote (>) así se destacan visualmente:
  > **Concepto**: su definición clara y concisa.
- Para CUALQUIER flujo, arquitectura, jerarquía, secuencia, proceso o relación entre componentes: SIEMPRE usá un bloque mermaid en lugar de texto o ASCII art. Ejemplos de cuándo usarlo: flujo de un request HTTP, capas de una arquitectura, árbol de herencia, ciclo de vida de un proceso, pasos de un algoritmo.
  \`\`\`mermaid
  graph TD
    A[Request HTTP] --> B[main.go]
    B --> C[handlers/]
    C --> D[store/]
    D --> E[models/]
  \`\`\`
  Tipos de diagrama disponibles: graph TD/LR, sequenceDiagram, classDiagram, stateDiagram-v2, flowchart. Elegí el más apropiado para el concepto.
- Para preguntas de opción múltiple usá bloques quiz con exactamente este formato:
  \`\`\`quiz
  ¿La pregunta aquí?
  A) Primera opción
  B) Segunda opción
  C) Tercera opción
  D) Cuarta opción
  correct: B
  \`\`\`
  Usá quizzes cuando quieras verificar comprensión de forma interactiva.`
}

export function useTutor(sessionId: string, topic: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [activeProvider, setActiveProvider] = useState<Provider>(getProvider())

  // Load existing messages from Supabase on mount
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setMessages(data as Message[])
      } else {
        // New session — insert welcome message
        const welcome: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `¡Hola! Soy tu tutor de **${topic}**. ¿Por dónde te gustaría empezar? Puedo explicarte los conceptos básicos, responder preguntas específicas o darte un desafío para practicar.`,
        }
        await supabase.from('messages').insert({
          id: welcome.id,
          session_id: sessionId,
          role: welcome.role,
          content: welcome.content,
        })
        setMessages([welcome])
      }
      setInitialized(true)
    }

    void loadMessages()
  }, [sessionId, topic])

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
      }

      // Save user message to Supabase
      await supabase.from('messages').insert({
        id: userMessage.id,
        session_id: sessionId,
        role: userMessage.role,
        content: userMessage.content,
      })

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      try {
        let fullContent = ''
        await streamMessage({
          systemPrompt: buildSystemPrompt(topic),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: userMessage.content,
          onProvider: (p) => setActiveProvider(p),
          onChunk: (text) => {
            fullContent += text
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m)),
            )
          },
        })

        // Save completed assistant message to Supabase
        await supabase.from('messages').insert({
          id: assistantId,
          session_id: sessionId,
          role: 'assistant',
          content: fullContent,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, topic, sessionId],
  )

  return { messages, isLoading, error, sendMessage, initialized, activeProvider }
}

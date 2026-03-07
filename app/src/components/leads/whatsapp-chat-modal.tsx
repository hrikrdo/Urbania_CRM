"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IconSend, IconBrandWhatsapp } from "@tabler/icons-react"

interface Message {
  id: string
  direction: "inbound" | "outbound"
  content: string
  created_at: string
}

interface WhatsAppChatModalProps {
  open: boolean
  onClose: () => void
  leadId: string
  leadName: string
  phone: string
}

export function WhatsAppChatModal({ open, onClose, leadId, leadName, phone }: WhatsAppChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Cargar historial de mensajes
  useEffect(() => {
    if (!open || !leadId) return
    setLoading(true)
    fetch(`/api/whatsapp/messages?lead_id=${leadId}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [open, leadId])

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          phone,
          message: newMessage.trim(),
          agent_name: "Asesor",
        }),
      })
      if (res.ok) {
        const sent: Message = {
          id: `local-${Date.now()}`,
          direction: "outbound",
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, sent])
        setNewMessage("")
      } else {
        alert("Error al enviar el mensaje. Intenta de nuevo.")
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-green-600 text-white rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-white">
            <IconBrandWhatsapp className="size-5" />
            <div>
              <div className="font-semibold">{leadName}</div>
              <div className="text-xs font-normal opacity-80">{phone}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]">
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-4">Cargando mensajes...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No hay mensajes aún. Inicia la conversación.
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                  msg.direction === "outbound"
                    ? "bg-[#dcf8c6] text-gray-800 rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-gray-500 text-right mt-1">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-2 border-t bg-white flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="resize-none min-h-[44px] max-h-[120px] text-sm"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="bg-green-600 hover:bg-green-700 shrink-0"
          >
            <IconSend className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

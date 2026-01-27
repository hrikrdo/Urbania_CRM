"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconBell,
  IconMail,
  IconBrandWhatsapp,
  IconDeviceMobile,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface NotificationSettings {
  // Email notifications
  emailNewLead: boolean
  emailLeadAssigned: boolean
  emailLeadExpiring: boolean
  emailDailySummary: boolean
  // Push notifications
  pushNewLead: boolean
  pushLeadAssigned: boolean
  pushAppointmentReminder: boolean
  pushPaymentDue: boolean
  // WhatsApp notifications
  whatsappNewLead: boolean
  whatsappAppointmentReminder: boolean
}

const defaultSettings: NotificationSettings = {
  emailNewLead: true,
  emailLeadAssigned: true,
  emailLeadExpiring: true,
  emailDailySummary: false,
  pushNewLead: true,
  pushLeadAssigned: true,
  pushAppointmentReminder: true,
  pushPaymentDue: true,
  whatsappNewLead: false,
  whatsappAppointmentReminder: false,
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save - in production, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 500))
    localStorage.setItem("notification-settings", JSON.stringify(settings))
    setIsSaving(false)
    toast.success("Configuración guardada")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/configuracion")}
          >
            <IconArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <IconBell className="size-6" />
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Configura cómo y cuándo recibir notificaciones
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="size-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Recibe alertas importantes en tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nuevo lead</Label>
              <p className="text-sm text-muted-foreground">
                Cuando se registra un nuevo lead en el sistema
              </p>
            </div>
            <Switch
              checked={settings.emailNewLead}
              onCheckedChange={(v) => updateSetting("emailNewLead", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Lead asignado</Label>
              <p className="text-sm text-muted-foreground">
                Cuando te asignan un nuevo lead
              </p>
            </div>
            <Switch
              checked={settings.emailLeadAssigned}
              onCheckedChange={(v) => updateSetting("emailLeadAssigned", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Lead por expirar</Label>
              <p className="text-sm text-muted-foreground">
                Alerta cuando un lead está por expirar sin atención
              </p>
            </div>
            <Switch
              checked={settings.emailLeadExpiring}
              onCheckedChange={(v) => updateSetting("emailLeadExpiring", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Resumen diario</Label>
              <p className="text-sm text-muted-foreground">
                Recibe un resumen de tu actividad cada día
              </p>
            </div>
            <Switch
              checked={settings.emailDailySummary}
              onCheckedChange={(v) => updateSetting("emailDailySummary", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDeviceMobile className="size-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Notificaciones en tiempo real en tu navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nuevo lead</Label>
              <p className="text-sm text-muted-foreground">
                Alerta inmediata de nuevos leads
              </p>
            </div>
            <Switch
              checked={settings.pushNewLead}
              onCheckedChange={(v) => updateSetting("pushNewLead", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Lead asignado</Label>
              <p className="text-sm text-muted-foreground">
                Cuando te asignan un lead
              </p>
            </div>
            <Switch
              checked={settings.pushLeadAssigned}
              onCheckedChange={(v) => updateSetting("pushLeadAssigned", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Recordatorio de cita</Label>
              <p className="text-sm text-muted-foreground">
                15 minutos antes de cada cita programada
              </p>
            </div>
            <Switch
              checked={settings.pushAppointmentReminder}
              onCheckedChange={(v) => updateSetting("pushAppointmentReminder", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Pago pendiente</Label>
              <p className="text-sm text-muted-foreground">
                Alerta de pagos próximos a vencer
              </p>
            </div>
            <Switch
              checked={settings.pushPaymentDue}
              onCheckedChange={(v) => updateSetting("pushPaymentDue", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandWhatsapp className="size-5" />
            Notificaciones por WhatsApp
          </CardTitle>
          <CardDescription>
            Recibe alertas en tu WhatsApp personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nuevo lead</Label>
              <p className="text-sm text-muted-foreground">
                Mensaje cuando se te asigna un lead
              </p>
            </div>
            <Switch
              checked={settings.whatsappNewLead}
              onCheckedChange={(v) => updateSetting("whatsappNewLead", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Recordatorio de cita</Label>
              <p className="text-sm text-muted-foreground">
                Mensaje antes de cada cita
              </p>
            </div>
            <Switch
              checked={settings.whatsappAppointmentReminder}
              onCheckedChange={(v) => updateSetting("whatsappAppointmentReminder", v)}
            />
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Nota: Las notificaciones de WhatsApp requieren configurar la integración
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

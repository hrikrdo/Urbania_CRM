"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconPalette,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconCheck,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const themes = [
  {
    value: "light",
    label: "Claro",
    icon: IconSun,
    description: "Tema claro para uso durante el día",
  },
  {
    value: "dark",
    label: "Oscuro",
    icon: IconMoon,
    description: "Tema oscuro para reducir fatiga visual",
  },
  {
    value: "system",
    label: "Sistema",
    icon: IconDeviceDesktop,
    description: "Usar configuración del sistema operativo",
  },
]

const accentColors = [
  { name: "Zinc", value: "zinc", color: "#71717A" },
  { name: "Azul", value: "blue", color: "#3B82F6" },
  { name: "Verde", value: "green", color: "#22C55E" },
  { name: "Violeta", value: "violet", color: "#8B5CF6" },
  { name: "Naranja", value: "orange", color: "#F97316" },
]

export default function AparienciaPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accentColor, setAccentColor] = useState("zinc")

  // Load accent color from localStorage
  useEffect(() => {
    setMounted(true)
    const savedAccent = localStorage.getItem("accent-color")
    if (savedAccent) {
      setAccentColor(savedAccent)
    }
  }, [])

  const handleAccentChange = (color: string) => {
    setAccentColor(color)
    localStorage.setItem("accent-color", color)
    // Note: Full accent color implementation would require CSS variables update
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
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
            <IconPalette className="size-6" />
            Apariencia
          </h1>
          <p className="text-muted-foreground">
            Personaliza el aspecto visual del sistema
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>
            Selecciona el tema de color para la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isSelected = theme === t.value

              return (
                <div
                  key={t.value}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-muted/50"
                  )}
                  onClick={() => setTheme(t.value)}
                >
                  {isSelected && (
                    <div className="absolute right-2 top-2">
                      <IconCheck className="size-4 text-primary" />
                    </div>
                  )}
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Color de acento</CardTitle>
          <CardDescription>
            Selecciona el color principal del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted/50",
                  accentColor === color.value && "border-primary bg-muted/50"
                )}
                onClick={() => handleAccentChange(color.value)}
              >
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-sm font-medium">{color.name}</span>
                {accentColor === color.value && (
                  <IconCheck className="size-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Nota: El color de acento se aplicará en futuras actualizaciones
          </p>
        </CardContent>
      </Card>

      {/* Density */}
      <Card>
        <CardHeader>
          <CardTitle>Densidad de la interfaz</CardTitle>
          <CardDescription>
            Ajusta el espaciado de los elementos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="density"
                value="comfortable"
                defaultChecked
                className="size-4"
              />
              <span>Cómoda</span>
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="density"
                value="compact"
                className="size-4"
              />
              <span>Compacta</span>
            </Label>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Nota: La densidad compacta se aplicará en futuras actualizaciones
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

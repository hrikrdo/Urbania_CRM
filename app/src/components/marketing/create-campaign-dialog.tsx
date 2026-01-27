"use client"

import { useState } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useCreateCampaign } from "@/hooks/use-marketing"
import { useProjects } from "@/hooks/use-leads"

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
]

export function CreateCampaignDialog({
  open,
  onOpenChange,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState<string>("")
  const [projectId, setProjectId] = useState<string>("__none__")
  const [budgetDaily, setBudgetDaily] = useState<string>("")
  const [budgetTotal, setBudgetTotal] = useState<string>("")

  const { data: projects } = useProjects()
  const createCampaign = useCreateCampaign()

  const resetForm = () => {
    setName("")
    setPlatform("")
    setProjectId("__none__")
    setBudgetDaily("")
    setBudgetTotal("")
  }

  const handleSubmit = async () => {
    if (!name || !platform) {
      toast.error("Nombre y plataforma son requeridos")
      return
    }

    try {
      await createCampaign.mutateAsync({
        name,
        platform,
        project_id: projectId === "__none__" ? null : projectId,
        budget_daily: budgetDaily ? parseFloat(budgetDaily) : null,
        budget_total: budgetTotal ? parseFloat(budgetTotal) : null,
        status: "active",
      })
      toast.success("Campaña creada exitosamente")
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Error al crear la campaña")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nueva Campaña</DialogTitle>
          <DialogDescription>
            Crea una nueva campaña de marketing para trackear su rendimiento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la campaña *</Label>
            <Input
              id="name"
              placeholder="Ej: Campaña Enero 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Proyecto asociado</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin proyecto</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetDaily">Presupuesto diario ($)</Label>
              <Input
                id="budgetDaily"
                type="number"
                placeholder="0"
                value={budgetDaily}
                onChange={(e) => setBudgetDaily(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetTotal">Presupuesto total ($)</Label>
              <Input
                id="budgetTotal"
                type="number"
                placeholder="0"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createCampaign.isPending || !name || !platform}
          >
            {createCampaign.isPending && (
              <IconLoader2 className="size-4 mr-2 animate-spin" />
            )}
            Crear Campaña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

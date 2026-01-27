"use client"

import {
  IconUsers,
  IconUserCircle,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTeams, type TeamWithMembers } from "@/hooks/use-team"
import { getUserInitials, getUserFullName } from "@/lib/services/team"

interface TeamsListProps {
  onSelectTeam?: (team: TeamWithMembers) => void
}

export function TeamsList({ onSelectTeam }: TeamsListProps) {
  const { data: teams, isLoading } = useTeams()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
          <CardDescription>
            No hay equipos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <IconUsers className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Aún no se han creado equipos
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipos</CardTitle>
        <CardDescription>
          {teams.length} equipo{teams.length !== 1 ? "s" : ""} registrado{teams.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectTeam?.(team)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconUsers className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      {team.manager && (
                        <p className="text-sm text-muted-foreground">
                          <IconUserCircle className="inline size-3 mr-1" />
                          {getUserFullName(team.manager.first_name, team.manager.last_name)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {team.members?.length || 0} miembros
                  </Badge>
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="mt-4 flex items-center">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map((member) => (
                        <Avatar key={member.id} className="size-8 border-2 border-background">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(member.first_name, member.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {team.members.length > 5 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        +{team.members.length - 5} más
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

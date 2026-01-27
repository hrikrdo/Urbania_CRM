"use client"

import * as React from "react"

interface ModuleHeaderProps {
  title: string
  description: string
  children?: React.ReactNode
}

export function ModuleHeader({ title, description, children }: ModuleHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

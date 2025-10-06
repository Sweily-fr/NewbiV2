"use client"

import { AlertCircle, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { Button } from "@/src/components/ui/button"

interface ErrorAlertProps {
  title: string
  message: string
  onEdit?: () => void
  editLabel?: string
}

export function ErrorAlert({ title, message, onEdit, editLabel = "Modifier" }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">{message}</span>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="ml-4 bg-background hover:bg-background/80"
          >
            <Edit className="h-3 w-3 mr-1" />
            {editLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

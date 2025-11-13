"use client"

import { useState, useEffect } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Label } from "@/src/components/ui/label"
import { Slider } from "@/src/components/ui/slider"

interface PercentageSliderInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  minValue?: number
  maxValue?: number
  step?: number
  gaugeColor?: string
  id?: string
  showLabelInValue?: boolean
}

export default function PercentageSliderInput({
  label,
  value = 0,
  onChange,
  disabled = false,
  minValue = 0,
  maxValue = 100,
  step = 1,
  gaugeColor = "#5b50FF",
  id,
  showLabelInValue = true,
}: PercentageSliderInputProps) {
  const [internalValue, setInternalValue] = useState([value])

  useEffect(() => {
    setInternalValue([value])
  }, [value])

  const decreaseValue = () => {
    const newValue = Math.max(minValue, internalValue[0] - step)
    setInternalValue([newValue])
    onChange(newValue)
  }

  const increaseValue = () => {
    const newValue = Math.min(maxValue, internalValue[0] + step)
    setInternalValue([newValue])
    onChange(newValue)
  }

  const handleSliderChange = (newValue: number[]) => {
    setInternalValue(newValue)
    onChange(newValue[0])
  }

  return (
    <div>
      <Label htmlFor={id} className="text-sm font-normal tabular-nums mb-2 block">
        {showLabelInValue ? `${label}: ${internalValue[0]}%` : `${internalValue[0]}%`}
      </Label>
      <div className="flex items-center gap-4">
        <div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Diminuer la valeur"
            onClick={decreaseValue}
            disabled={disabled || internalValue[0] === minValue}
          >
            <MinusIcon size={16} aria-hidden="true" />
          </Button>
        </div>
        <Slider
          id={id}
          className="grow"
          value={internalValue}
          onValueChange={handleSliderChange}
          min={minValue}
          max={maxValue}
          step={step}
          disabled={disabled}
          aria-label={label}
          style={{
            // @ts-expect-error - Custom CSS variable for slider color
            "--slider-color": gaugeColor,
          }}
        />
        <div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Augmenter la valeur"
            onClick={increaseValue}
            disabled={disabled || internalValue[0] === maxValue}
          >
            <PlusIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

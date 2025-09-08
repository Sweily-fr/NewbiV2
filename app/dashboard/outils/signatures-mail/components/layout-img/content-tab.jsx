"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ImageIcon } from "lucide-react";
import AlignmentSelector from "@/src/components/ui/alignment-selector";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import {
  CircleOff,
  Minus,
  Dot,
  Slash,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  Columns2,
  BetweenHorizontalStart,
  Table2,
  Bold,
  Italic,
  Underline,
  CaseUpper,
  Square,
  Circle,
  RectangleHorizontal,
} from "lucide-react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useForm } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { ColorPicker } from "@/src/components/ui/color-picker";
import { Button } from "@/src/components/ui/button";

const FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
];

export default function SpacingSection() {
  const { register, handleSubmit, watch, setValue } = useForm();
  const [spacingValues, setSpacingValues] = useState({
    vertical: 25,
    horizontal: 15,
    sections: 30,
    margin: 16,
    iconText: 8,
  });

  const [primaryColor, setPrimaryColor] = useState("#000000");

  const minValue = 0;
  const maxValue = 100;
  const initialValue = [25];

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({ minValue, maxValue, initialValue });

  const selectedFont = watch("typography.font");

  const handleValueChange = (key, value) => {
    setSpacingValues((prev) => ({
      ...prev,
      [key]: value[0],
    }));
  };

  return (
    <div className="mt-4 flex items-center justify-center flex-col gap-4 h-64">
      <ImageIcon className="w-10 h-10" />
      <h2 className="text-lg font-medium">À venir...</h2>
    </div>
  );
}

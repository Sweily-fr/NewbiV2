'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Flag } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/src/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';

const priorities = [
  {
    value: 'low',
    label: 'Basse',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    colorClass: 'bg-green-500',
  },
  {
    value: 'medium',
    label: 'Moyenne',
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    colorClass: 'bg-yellow-500',
  },
  {
    value: 'high',
    label: 'Haute',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    colorClass: 'bg-red-500',
  },
];

export function PrioritySelect({ value, onValueChange, className, disabled = false }) {
  const [open, setOpen] = React.useState(false);
  const selectedPriority = priorities.find((priority) => priority.value === value) || priorities[0];
  
  // Couleurs des drapeaux dans le sélecteur (tons très doux)
  const flagColors = {
    low: 'text-green-300',
    medium: 'text-yellow-300',
    high: 'text-red-300'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
          disabled={disabled}
        >
          <div className="flex items-center">
            <Flag className={`h-4 w-4 mr-2 ${flagColors[selectedPriority.value] || 'text-gray-500'} fill-current`} />
            {selectedPriority.label}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher une priorité..." />
          <CommandEmpty>Aucune priorité trouvée.</CommandEmpty>
          <CommandGroup>
            {priorities.map((priority) => (
              <CommandItem
                key={priority.value}
                value={priority.value}
                onSelect={() => {
                  onValueChange(priority.value);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === priority.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex items-center">
                  <Flag className={`h-4 w-4 mr-2 ${flagColors[priority.value] || 'text-gray-500'} fill-current`} />
                  {priority.label}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PriorityBadge({ priority, className }) {
  // Couleurs des drapeaux en fonction de la priorité (tons très doux)
  const flagColors = {
    low: 'text-green-300',
    medium: 'text-yellow-300',
    high: 'text-red-300'
  };
  
  const flagColor = flagColors[priority] || 'text-gray-300';
  const priorityInfo = priorities.find((p) => p.value === priority) || priorities[0];
  
  return (
    <div 
      className={`inline-flex items-center ${className}`}
      title={priorityInfo.label}
    >
      <Flag className={`h-4 w-4 ${flagColor} fill-current`} />
    </div>
  );
}

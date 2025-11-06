'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Checkbox } from '@/src/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';

const ChecklistItem = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);

  const handleSave = () => {
    if (text.trim()) {
      onUpdate({ ...item, text: text.trim() });
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 group py-1">
      <Checkbox 
        id={`checklist-${item.id}`} 
        checked={item.completed}
        onCheckedChange={(checked) => onUpdate({ ...item, completed: checked })}
        className="h-4 w-4 rounded"
      />
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="h-8 px-2 py-1 text-sm"
          />
        </div>
      ) : (
        <label 
          htmlFor={`checklist-${item.id}`}
          className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
          onDoubleClick={() => setIsEditing(true)}
        >
          {item.text}
        </label>
      )}
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
};

export const Checklist = ({ items = [], onChange }) => {
  const [newItemText, setNewItemText] = useState('');

  // Normalize items to ensure all have valid IDs
  const normalizedItems = items.map((item, index) => ({
    ...item,
    id: item?.id || `checklist-item-${index}-${Date.now()}`
  }));

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem = {
      id: uuidv4(),
      text: newItemText.trim(),
      completed: false
    };
    
    onChange([...items, newItem]);
    setNewItemText('');
  };

  const handleUpdateItem = (updatedItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    onChange(updatedItems);
  };

  const handleDeleteItem = (itemId) => {
    onChange(items.filter(item => item.id !== itemId));
  };

  const completedCount = normalizedItems.filter(item => item.completed).length;
  const totalCount = normalizedItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Checklist</h4>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount} sur {totalCount} ({progress}%)
          </span>
        )}
      </div>
      
      {totalCount > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className="space-y-1">
        {normalizedItems.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Ajouter un élément"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          className="h-8 text-sm"
        />
        <Button 
          type="button" 
          size="sm" 
          variant="outline"
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>
    </div>
  );
};

export default Checklist;

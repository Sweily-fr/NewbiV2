'use client';

import { useState } from 'react';
import { Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
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
      <button
        type="button"
        onClick={() => onUpdate({ ...item, completed: !item.completed })}
        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {item.completed ? (
          <div className="flex items-center justify-center rounded-full" style={{ width: '20px', height: '20px', backgroundColor: '#5b50FF' }}>
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setText(item.text);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="h-8 px-2 py-1 text-sm"
          />
        </div>
      ) : (
        <span 
          className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
          onClick={() => setIsEditing(true)}
        >
          {item.text}
        </span>
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
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Normalize items to ensure all have valid IDs
  const normalizedItems = items.map((item, index) => ({
    ...item,
    id: item?.id || `checklist-item-${index}-${Date.now()}`
  }));

  const handleAddItem = () => {
    if (!newItemText.trim()) {
      setIsAddingNew(false);
      return;
    }
    
    const newItem = {
      id: uuidv4(),
      text: newItemText.trim(),
      completed: false
    };
    
    onChange([...items, newItem]);
    setNewItemText('');
    setIsAddingNew(false);
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
        <h4 className="text-base font-semibold">Checklist</h4>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount} sur {totalCount} ({progress}%)
          </span>
        )}
      </div>
      
      {totalCount > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300" 
            style={{ width: `${progress}%`, backgroundColor: '#5b50FF' }}
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
        
        {isAddingNew && (
          <div className="flex items-center gap-2 group py-1">
            <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="New checklist item"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewItemText('');
                }
              }}
              onBlur={handleAddItem}
              autoFocus
              className="h-8 px-2 py-1 text-sm flex-1"
            />
          </div>
        )}
      </div>
      
      {!isAddingNew && (
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Ajouter un item
        </button>
      )}
    </div>
  );
};

export default Checklist;

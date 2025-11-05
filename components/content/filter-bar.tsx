'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { ContentType } from '@/lib/types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCreator: string | null;
  onCreatorChange: (creator: string | null) => void;
  selectedType: ContentType | 'all';
  onTypeChange: (type: ContentType | 'all') => void;
  creators: string[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCreator,
  onCreatorChange,
  selectedType,
  onTypeChange,
  creators,
}: FilterBarProps) {
  const hasActiveFilters = selectedCreator !== null || selectedType !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    onSearchChange('');
    onCreatorChange(null);
    onTypeChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('all')}
          >
            All
          </Button>
          <Button
            variant={selectedType === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('video')}
          >
            Videos
          </Button>
          <Button
            variant={selectedType === 'article' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('article')}
          >
            Articles
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex flex-wrap items-center gap-2">
          {creators.map((creator) => (
            <Badge
              key={creator}
              variant={selectedCreator === creator ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => onCreatorChange(selectedCreator === creator ? null : creator)}
            >
              {creator}
            </Badge>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

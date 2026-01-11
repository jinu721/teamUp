import React from 'react';
import {
  PostFilters as PostFiltersType,
  ProjectCategory,
  CommitmentType,
  SortOrder,
  PROJECT_CATEGORY_LABELS,
  COMMITMENT_TYPE_LABELS
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, Clock, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostFiltersProps {
  filters: PostFiltersType;
  sortOrder: SortOrder;
  onFiltersChange: (filters: PostFiltersType) => void;
  onSortChange: (sort: SortOrder) => void;
}

export const PostFiltersBar: React.FC<PostFiltersProps> = ({
  filters,
  sortOrder,
  onFiltersChange,
  onSortChange
}) => {
  const hasActiveFilters = filters.category || filters.commitmentType ||
    (filters.skills && filters.skills.length > 0) ||
    (filters.tags && filters.tags.length > 0);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const removeFilter = (key: keyof PostFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Sort */}
        <PostSortSelect value={sortOrder} onChange={onSortChange} />

        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(v: string) => onFiltersChange({
            ...filters,
            category: v === 'all' ? undefined : v as ProjectCategory
          })}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Commitment Type Filter */}
        <Select
          value={filters.commitmentType || 'all'}
          onValueChange={(v: string) => onFiltersChange({
            ...filters,
            commitmentType: v === 'all' ? undefined : v as CommitmentType
          })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Commitment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(COMMITMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {(PROJECT_CATEGORY_LABELS as any)[filters.category]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('category')}
              />
            </Badge>
          )}
          {filters.commitmentType && (
            <Badge variant="secondary" className="gap-1">
              {(COMMITMENT_TYPE_LABELS as any)[filters.commitmentType]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('commitmentType')}
              />
            </Badge>
          )}
          {filters.skills?.map(skill => (
            <Badge key={skill} variant="outline" className="gap-1">
              {skill}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({
                  ...filters,
                  skills: filters.skills?.filter(s => s !== skill)
                })}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

interface PostSortSelectProps {
  value: SortOrder;
  onChange: (sort: SortOrder) => void;
  className?: string;
}

export const PostSortSelect: React.FC<PostSortSelectProps> = ({
  value,
  onChange,
  className
}) => {
  const getSortIcon = (sort: SortOrder) => {
    switch (sort) {
      case SortOrder.NEW: return Clock;
      case SortOrder.TOP: return TrendingUp;
      case SortOrder.TRENDING: return Flame;
    }
  };

  const Icon = getSortIcon(value);

  return (
    <Select value={value} onValueChange={(v: string) => onChange(v as SortOrder)}>
      <SelectTrigger className={cn("w-[130px]", className)}>
        <Icon className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SortOrder.NEW}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            New
          </div>
        </SelectItem>
        <SelectItem value={SortOrder.TOP}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top
          </div>
        </SelectItem>
        <SelectItem value={SortOrder.TRENDING}>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Trending
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

// Compact sort buttons for mobile
interface PostSortButtonsProps {
  value: SortOrder;
  onChange: (sort: SortOrder) => void;
}

export const PostSortButtons: React.FC<PostSortButtonsProps> = ({
  value,
  onChange
}) => {
  const options = [
    { value: SortOrder.NEW, label: 'New', icon: Clock },
    { value: SortOrder.TOP, label: 'Top', icon: TrendingUp },
    { value: SortOrder.TRENDING, label: 'Hot', icon: Flame }
  ];

  return (
    <div className="flex rounded-lg border p-1 gap-1">
      {options.map(option => {
        const Icon = option.icon;
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn("gap-1", isActive && "bg-secondary")}
            onClick={() => onChange(option.value)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

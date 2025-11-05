export type SourceType = 'youtube' | 'substack';
export type ContentItemType = 'video' | 'article';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  source_id: string;
  type: ContentItemType;
  title: string;
  url: string;
  thumbnail_url: string | null;
  description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItemWithSource extends ContentItem {
  source: Source;
}

export interface InsertSource {
  name: string;
  type: SourceType;
  url: string;
  description?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface InsertContentItem {
  source_id: string;
  type: ContentItemType;
  title: string;
  url: string;
  thumbnail_url?: string;
  description?: string;
  published_at?: string;
}

export interface UpdateSource {
  name?: string;
  type?: SourceType;
  url?: string;
  description?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UpdateContentItem {
  source_id?: string;
  type?: ContentItemType;
  title?: string;
  url?: string;
  thumbnail_url?: string;
  description?: string;
  published_at?: string;
}

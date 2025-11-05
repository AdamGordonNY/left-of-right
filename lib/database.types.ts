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
  created_by_user_id: string | null;
  is_global: boolean;
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
  created_by_user_id?: string;
  is_global?: boolean;
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
  is_global?: boolean;
}

export interface UserFollow {
  id: string;
  user_id: string;
  source_id: string;
  created_at: string;
}

export interface InsertUserFollow {
  user_id: string;
  source_id: string;
}

export interface SourceWithFollowStatus extends Source {
  is_followed: boolean;
  follower_count?: number;
}

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
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

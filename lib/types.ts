export type ContentType = 'video' | 'article';

export interface VideoContent {
  id: string;
  type: 'video';
  title: string;
  creator: string;
  thumbnail: string;
  videoUrl: string;
  publishedAt: string;
  description: string;
}

export interface ArticleContent {
  id: string;
  type: 'article';
  title: string;
  creator: string;
  excerpt: string;
  articleUrl: string;
  publishedAt: string;
  coverImage?: string;
}

export type Content = VideoContent | ArticleContent;

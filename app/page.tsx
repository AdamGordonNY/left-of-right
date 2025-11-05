'use client';

import { useState, useMemo } from 'react';
import { Content, ContentType } from '@/lib/types';
import { VideoCard } from '@/components/content/video-card';
import { ArticleCard } from '@/components/content/article-card';
import { FilterBar } from '@/components/content/filter-bar';
import contentData from '@/lib/sample-data.json';
import { Layers } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  const content = contentData as Content[];

  const creators = useMemo(() => {
    const uniqueCreators = new Set(content.map((item) => item.creator));
    return Array.from(uniqueCreators).sort();
  }, [content]);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ('description' in item && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ('excerpt' in item && item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCreator = selectedCreator === null || item.creator === selectedCreator;
      const matchesType = selectedType === 'all' || item.type === selectedType;

      return matchesSearch && matchesCreator && matchesType;
    });
  }, [content, searchQuery, selectedCreator, selectedType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Content Hub
              </h1>
              <p className="text-sm text-slate-600">
                Discover curated videos and articles from top creators
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCreator={selectedCreator}
            onCreatorChange={setSelectedCreator}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            creators={creators}
          />
        </div>

        {filteredContent.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 p-8 text-center">
            <div className="rounded-full bg-slate-100 p-6">
              <Layers className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No content found</h3>
            <p className="mt-2 text-sm text-slate-600">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredContent.length}</span>{' '}
                {filteredContent.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredContent.map((item) =>
                item.type === 'video' ? (
                  <VideoCard key={item.id} video={item} />
                ) : (
                  <ArticleCard key={item.id} article={item} />
                )
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 border-t bg-white">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-600">
            Content aggregation platform built with Next.js 15 and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}

import { supabase } from './supabase';
import {
  Source,
  ContentItem,
  ContentItemWithSource,
  InsertSource,
  InsertContentItem,
  UpdateSource,
  UpdateContentItem,
} from './database.types';

export async function getSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSource(source: InsertSource): Promise<Source> {
  const { data, error } = await supabase
    .from('sources')
    .insert(source)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSource(id: string, updates: UpdateSource): Promise<Source> {
  const { data, error } = await supabase
    .from('sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getContentItems(): Promise<ContentItemWithSource[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select(`
      *,
      source:sources(*)
    `)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getContentItemsBySource(sourceId: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('source_id', sourceId)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createContentItem(item: InsertContentItem): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentItem(id: string, updates: UpdateContentItem): Promise<ContentItem> {
  const { data, error } = await supabase
    .from('content_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

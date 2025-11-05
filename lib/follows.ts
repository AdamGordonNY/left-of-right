import { supabase } from './supabase';
import { UserFollow, InsertUserFollow, SourceWithFollowStatus, Source } from './database.types';

export async function getUserFollows(userId: string): Promise<UserFollow[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getFollowedSources(userId: string): Promise<Source[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      source_id,
      sources (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return data?.map((item: any) => item.sources).filter(Boolean) || [];
}

export async function isFollowingSource(userId: string, sourceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('source_id', sourceId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function followSource(userId: string, sourceId: string): Promise<UserFollow> {
  const { data, error } = await supabase
    .from('user_follows')
    .insert({ user_id: userId, source_id: sourceId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unfollowSource(userId: string, sourceId: string): Promise<void> {
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('user_id', userId)
    .eq('source_id', sourceId);

  if (error) throw error;
}

export async function getSourcesWithFollowStatus(userId: string): Promise<SourceWithFollowStatus[]> {
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (sourcesError) throw sourcesError;

  const { data: follows, error: followsError } = await supabase
    .from('user_follows')
    .select('source_id')
    .eq('user_id', userId);

  if (followsError) throw followsError;

  const followedSourceIds = new Set(follows?.map(f => f.source_id) || []);

  return (sources || []).map(source => ({
    ...source,
    is_followed: followedSourceIds.has(source.id),
  }));
}

export async function getFollowerCount(sourceId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('source_id', sourceId);

  if (error) throw error;
  return count || 0;
}

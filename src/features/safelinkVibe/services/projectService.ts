// =====================================================
// SafeLink Vibe — Capa de servicios de proyectos (Supabase)
// Toda persistencia de proyectos pasa por aquí
// =====================================================
import { supabase } from '@/lib/supabase';
import type { VibeProject, VibeProjectData, ProjectStatus, ApiResult } from '../types';
import type { ContentFormat } from '../constants/formats';

const TABLE = 'vibe_projects';

// --- Crear proyecto ---

export interface CreateProjectInput {
  title: string;
  format: ContentFormat;
  description?: string;
  project_data?: VibeProjectData;
  tags?: string[];
}

export async function createProject(
  input: CreateProjectInput
): Promise<ApiResult<VibeProject>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'No autenticado.', code: 'AUTH_REQUIRED' };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      format: input.format,
      description: input.description?.trim() ?? null,
      project_data: input.project_data ?? {},
      tags: input.tags ?? [],
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: data as VibeProject };
}

// --- Obtener proyectos del usuario ---

export interface ListProjectsOptions {
  status?: ProjectStatus;
  format?: ContentFormat;
  limit?: number;
  offset?: number;
}

export async function listProjects(
  options: ListProjectsOptions = {}
): Promise<ApiResult<VibeProject[]>> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.format) {
    query = query.eq('format', options.format);
  }
  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }
  if (options.offset !== undefined) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: (data ?? []) as VibeProject[] };
}

// --- Obtener un proyecto por ID ---

export async function getProject(id: string): Promise<ApiResult<VibeProject>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: data as VibeProject };
}

// --- Actualizar proyecto ---

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  project_data?: VibeProjectData;
  tags?: string[];
  thumbnail_url?: string;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ApiResult<VibeProject>> {
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description.trim() || null;
  if (input.status !== undefined) updates.status = input.status;
  if (input.project_data !== undefined) updates.project_data = input.project_data;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.thumbnail_url !== undefined) updates.thumbnail_url = input.thumbnail_url;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: data as VibeProject };
}

// --- Duplicar proyecto ---

export async function duplicateProject(id: string): Promise<ApiResult<VibeProject>> {
  const original = await getProject(id);
  if (!original.ok) return original;

  return createProject({
    title: `${original.data.title} (copia)`,
    format: original.data.format,
    description: original.data.description ?? undefined,
    project_data: original.data.project_data,
    tags: original.data.tags,
  });
}

// --- Archivar proyecto (soft delete lógico) ---

export async function archiveProject(id: string): Promise<ApiResult<VibeProject>> {
  return updateProject(id, { status: 'archived' });
}

// --- Eliminar proyecto permanentemente ---

export async function deleteProject(id: string): Promise<ApiResult<{ id: string }>> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: { id } };
}

// --- Estadísticas rápidas ---

export interface ProjectStats {
  total: number;
  drafts: number;
  inProgress: number;
  completed: number;
  archived: number;
}

export async function getProjectStats(): Promise<ApiResult<ProjectStats>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('status');

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  const stats: ProjectStats = {
    total: 0,
    drafts: 0,
    inProgress: 0,
    completed: 0,
    archived: 0,
  };

  for (const row of data ?? []) {
    stats.total++;
    if (row.status === 'draft') stats.drafts++;
    else if (row.status === 'in_progress') stats.inProgress++;
    else if (row.status === 'completed') stats.completed++;
    else if (row.status === 'archived') stats.archived++;
  }

  return { ok: true, data: stats };
}

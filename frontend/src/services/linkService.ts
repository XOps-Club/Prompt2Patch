import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from './api.js';
import type { LinksResponse, GlobalStatsResponse, LinkItem, ShortenInput } from '../schemas/link.schema.js';

export const linkKeys = {
  all: ['links'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (page: number, limit: number, includeDeleted: boolean) =>
    [...linkKeys.lists(), { page, limit, includeDeleted }] as const,
  stats: () => [...linkKeys.all, 'stats'] as const,
  detail: (id: number) => [...linkKeys.all, 'detail', id] as const
};

// API Services
export const linkService = {
  getLinks: (page = 1, limit = 10, includeDeleted = false) => {
    return request<LinksResponse>(`/links?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`);
  },

  getStats: () => {
    return request<GlobalStatsResponse>('/links/stats');
  },

  createLink: (input: ShortenInput) => {
    return request<LinkItem>('/links', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  deleteLink: (id: number) => {
    return request<{ success: boolean; message: string }>(`/links/${id}`, {
      method: 'DELETE'
    });
  },

  restoreLink: (id: number) => {
    return request<LinkItem>(`/links/${id}/restore`, {
      method: 'POST'
    });
  }
};

/**
 * Generates QR code image URL for a given short URL
 */
export function getQrCodeUrl(shortUrl: string): string {
  if (!shortUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
}

// TanStack Query Hooks
export function useLinks(page = 1, limit = 10, includeDeleted = false) {
  return useQuery({
    queryKey: linkKeys.list(page, limit, includeDeleted),
    queryFn: () => linkService.getLinks(page, limit, includeDeleted),
    placeholderData: (previousData) => previousData
  });
}

export function useGlobalStats() {
  return useQuery({
    queryKey: linkKeys.stats(),
    queryFn: () => linkService.getStats(),
    retry: 1
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkService.createLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linkKeys.stats() });
    }
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkService.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linkKeys.stats() });
    }
  });
}

export function useRestoreLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkService.restoreLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linkKeys.stats() });
    }
  });
}

import useSWR from 'swr';
import { InventoryItem, DashboardStats } from '../types';

interface InventoryResponse {
  items: InventoryItem[];
  stats: DashboardStats;
  rawData?: string[][];
}

const fetcher = async (url: string): Promise<InventoryResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.hint || errorData.details || 'Failed to fetch inventory data');
    (error as any).hint = errorData.hint;
    (error as any).details = errorData.details;
    throw error;
  }
  return res.json();
};

export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR<InventoryResponse>(
    '/api/sheets',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    items: data?.items || [],
    stats: data?.stats,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}


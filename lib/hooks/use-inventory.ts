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
    throw new Error('Failed to fetch inventory data');
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


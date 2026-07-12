import axiosInstance from '@/lib/axios';
import type { Vehicle } from './vehicles.api';
import type { Driver } from './drivers.api';

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export type Trip = {
  _id: string;
  source: string;
  destination: string;
  vehicle: Vehicle;
  driver: Driver;
  cargo_weight: number;
  planned_distance: number;
  actual_distance?: number;
  fuel_consumed?: number;
  status: TripStatus;
  dispatched_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  createdAt: string;
  updatedAt: string;
};

export type TripsResponse = {
  success: boolean;
  count: number;
  data: Trip[];
};

export const getTrips = async (params?: {
  status?: string;
  region?: string;
}): Promise<TripsResponse> => {
  const response = await axiosInstance.get<TripsResponse>('/trips', { params });
  return response.data;
};

export const getTripById = async (id: string): Promise<Trip> => {
  const response = await axiosInstance.get<{ success: boolean; data: Trip }>(`/trips/${id}`);
  return response.data.data;
};

export const createTrip = async (data: {
  source: string;
  destination: string;
  vehicle: string; // ObjectId
  driver: string; // ObjectId;
  cargo_weight: number;
  planned_distance: number;
}): Promise<Trip> => {
  const response = await axiosInstance.post<{ success: boolean; data: Trip }>('/trips', data);
  return response.data.data;
};

export const dispatchTrip = async (id: string): Promise<Trip> => {
  const response = await axiosInstance.patch<{ success: boolean; data: Trip }>(
    `/trips/${id}/dispatch`
  );
  return response.data.data;
};

export const completeTrip = async ({
  id,
  data,
}: {
  id: string;
  data: {
    actual_distance: number;
    fuel_consumed: number;
    final_odometer: number;
  };
}): Promise<Trip> => {
  const response = await axiosInstance.patch<{ success: boolean; data: Trip }>(
    `/trips/${id}/complete`,
    data
  );
  return response.data.data;
};

export const cancelTrip = async (id: string): Promise<Trip> => {
  const response = await axiosInstance.patch<{ success: boolean; data: Trip }>(
    `/trips/${id}/cancel`
  );
  return response.data.data;
};

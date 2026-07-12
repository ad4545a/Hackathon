import axiosInstance from '@/lib/axios';
import type { Vehicle } from './vehicles.api';

export type MaintenanceStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MaintenanceLog = {
  _id: string;
  vehicleId: Vehicle;
  maintenanceType: string;
  description: string;
  startDate: string;
  completionDate?: string;
  cost: number;
  status: MaintenanceStatus;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceResponse = {
  success: boolean;
  data: MaintenanceLog[];
};

export const getMaintenance = async (): Promise<MaintenanceResponse> => {
  const response = await axiosInstance.get<MaintenanceResponse>('/maintenance');
  return response.data;
};

export const startMaintenance = async (data: {
  vehicleId: string;
  maintenanceType: string;
  description: string;
  startDate?: string;
  cost?: number;
}): Promise<MaintenanceLog> => {
  const response = await axiosInstance.post<{ success: boolean; data: MaintenanceLog }>(
    '/maintenance',
    data
  );
  return response.data.data;
};

export const completeMaintenance = async ({
  id,
  data,
}: {
  id: string;
  data: {
    completionDate?: string;
    cost: number;
    retireVehicle?: boolean;
  };
}): Promise<MaintenanceLog> => {
  const response = await axiosInstance.post<{ success: boolean; data: MaintenanceLog }>(
    `/maintenance/${id}/complete`,
    data
  );
  return response.data.data;
};

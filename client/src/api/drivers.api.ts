import axiosInstance from '@/lib/axios';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export type Driver = {
  _id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  region?: string;
  status_history?: Array<{
    status: DriverStatus;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type DriversResponse = {
  success: boolean;
  count: number;
  data: Driver[];
};

export const getDrivers = async (params?: {
  status?: string;
  region?: string;
}): Promise<DriversResponse> => {
  const response = await axiosInstance.get<DriversResponse>('/drivers', { params });
  return response.data;
};

export const getAvailableDrivers = async (): Promise<DriversResponse> => {
  const response = await axiosInstance.get<DriversResponse>('/drivers/available');
  return response.data;
};

export const createDriver = async (
  data: Omit<Driver, '_id' | 'status' | 'status_history' | 'createdAt' | 'updatedAt'>
): Promise<Driver> => {
  const response = await axiosInstance.post<{ success: boolean; data: Driver }>('/drivers', data);
  return response.data.data;
};

export const updateDriver = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Driver>;
}): Promise<Driver> => {
  const response = await axiosInstance.put<{ success: boolean; data: Driver }>(
    `/drivers/${id}`,
    data
  );
  return response.data.data;
};

export const deleteDriver = async (id: string): Promise<Driver> => {
  const response = await axiosInstance.delete<{ success: boolean; data: Driver }>(
    `/drivers/${id}`
  );
  return response.data.data;
};

export const updateDriverStatus = async ({
  id,
  status,
}: {
  id: string;
  status: DriverStatus;
}): Promise<Driver> => {
  const response = await axiosInstance.patch<{ success: boolean; data: Driver }>(
    `/drivers/${id}/status`,
    { status }
  );
  return response.data.data;
};

import axiosInstance from '@/lib/axios';
import type { Vehicle } from './vehicles.api';

export type ExpenseType = 'FUEL' | 'TOLL' | 'MAINTENANCE' | 'REPAIR' | 'OTHER';

export type Expense = {
  _id: string;
  vehicleId: Vehicle;
  tripId?: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type FuelLog = {
  _id: string;
  vehicleId: Vehicle;
  tripId?: string;
  liters: number;
  cost: number;
  odometer: number;
  date: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ExpensesResponse = {
  success: boolean;
  data: Expense[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type FuelLogsResponse = {
  success: boolean;
  data: FuelLog[];
};

export const getExpenses = async (params?: {
  vehicleId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ExpensesResponse> => {
  const response = await axiosInstance.get<ExpensesResponse>('/expenses', { params });
  return response.data;
};

export const createExpense = async (data: {
  vehicleId: string;
  tripId?: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date?: string;
}): Promise<Expense> => {
  const response = await axiosInstance.post<{ success: boolean; data: Expense }>('/expenses', data);
  return response.data.data;
};

export const getFuelLogs = async (): Promise<FuelLogsResponse> => {
  const response = await axiosInstance.get<FuelLogsResponse>('/fuel-logs');
  return response.data;
};

export const createFuelLog = async (data: {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  odometer: number;
  date?: string;
}): Promise<FuelLog> => {
  const response = await axiosInstance.post<{ success: boolean; data: FuelLog }>('/fuel-logs', data);
  return response.data.data;
};

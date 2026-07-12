const analyticsRepository = require('./analytics.repository');

class AnalyticsService {
  async getFleetUtilization(filters) {
    return await analyticsRepository.getFleetUtilization(filters);
  }

  async getFuelEfficiency(filters) {
    return await analyticsRepository.getFuelEfficiency(filters);
  }

  async getOperationalCost(filters) {
    return await analyticsRepository.getOperationalCost(filters);
  }

  async getVehicleROI(filters) {
    return await analyticsRepository.getVehicleROI(filters);
  }

  async getDashboardSummary(filters) {
    const utilization = await this.getFleetUtilization(filters);
    const fuel = await this.getFuelEfficiency(filters);
    const cost = await this.getOperationalCost(filters);
    return {
      utilizationRate: utilization.utilizationRate,
      totalActiveVehicles: utilization.totalActive,
      totalOnTripVehicles: utilization.totalOnTrip,
      fuelEfficiency: fuel.efficiency,
      totalOperationalCost: cost.totalOperationalCost,
    };
  }
}

module.exports = new AnalyticsService();

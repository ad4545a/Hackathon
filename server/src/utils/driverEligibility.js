const isDriverEligible = (driver) => {
  if (!driver) return false;

  const now = new Date();
  const isExpired = new Date(driver.license_expiry_date) <= now;
  const isSuspended = driver.status === 'Suspended';
  const isAvailable = driver.status === 'Available';

  return isAvailable && !isExpired && !isSuspended;
};

module.exports = {
  isDriverEligible,
};

import { getDatabaseHealthStatus, getHealthStatus } from "./health.service.js";

const getHealth = (req, res, next) => {
  try {
    const health = getHealthStatus();
    res.status(200).json(health);
  } catch (error) {
    next(error);
  }
};

const getDatabaseHealth = async (req, res, next) => {
  try {
    const dbHealth = await getDatabaseHealthStatus();
    const statusCode = dbHealth.status === "ok" ? 200 : 503;

    res.status(statusCode).json(dbHealth);
  } catch (error) {
    next(error);
  }
};

export { getHealth, getDatabaseHealth };

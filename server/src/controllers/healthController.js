export const getHealthStatus = (req, res) => {
  res.json({
    status: "ok",
    message: "Server is healthy and ready!",
    timestamp: new Date().toISOString(),
  });
};

module.exports = (req, res, next) => {
  if (req.user.role !== "worker") {
    return res.status(403).json({ message: "Worker access only" });
  }
  next();
};

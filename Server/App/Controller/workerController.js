const Issue = require("../Models/Issue");

// 🧾 Worker Issues
exports.getAssignedIssues = async (req, res) => {
  const issues = await Issue.find({ assignedTo: req.user.department });
  res.json(issues);
};

// 📊 Worker Stats
exports.getWorkerStats = async (req, res) => {
  const issues = await Issue.find({ assignedTo: req.user.department });

  res.json({
    total: issues.length,
    open: issues.filter(i => i.status !== "Resolved").length,
    resolved: issues.filter(i => i.status === "Resolved").length,
  });
};

// 🔄 Worker Status Update
exports.updateIssueStatus = async (req, res) => {
  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );

  res.json(issue);
};

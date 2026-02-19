const Issue = require("../Models/Issue");

exports.getAiTrends = async (req, res) => {
  try {
    const issues = await Issue.find();

    const categoryCount = {};
    const statusCount = {};

    issues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
      statusCount[issue.status] = (statusCount[issue.status] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCount).sort((a,b)=>b[1]-a[1])[0];
    const topStatus = Object.entries(statusCount).sort((a,b)=>b[1]-a[1])[0];

    res.json({
      mostReportedCategory: topCategory?.[0] || "N/A",
      categoryStats: categoryCount,
      statusStats: statusCount,
      openIssues: statusCount["Pending"] || 0,
      resolvedIssues: statusCount["Resolved"] || 0
    });

  } catch (err) {
    res.status(500).json({ message: "Trend analysis failed", error: err.message });
  }
};

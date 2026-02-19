const User = require('../Models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // 🔎 Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧠 Build user data safely
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    };

    // 🧰 Worker specific logic
    if (userData.role === "worker") {
      if (!department) {
        return res.status(400).json({ message: "Department is required for worker" });
      }
      userData.department = department;
    }

    const user = new User(userData);
    await user.save();

    return res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = {
      userId: user._id,
      role: user.role,
      department: user.department || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null,
        _id: user._id
      },
      message: "Sign in successfully"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }

};

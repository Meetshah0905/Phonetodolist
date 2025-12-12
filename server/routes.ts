app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the new user
    const user = await User.create({ 
      email, 
      password, 
      name: name || email.split('@')[0] 
    });

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      isGoogleCalendarConnected: false,
    });
  } catch (error) {
    console.error("/api/auth/signup error", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});
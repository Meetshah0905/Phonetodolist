import type { Express } from "express";
import { createServer, type Server } from "http";
import mongoose from "mongoose";
import { User } from "./models/User";
import { getAuthUrl, getTokensFromCode, createCalendarEvent, createGoogleTask, createCalendarReminder, isConfigured, getUserProfile } from "./googleCalendar";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    const state = mongoose.connection.readyState;
    res.json({ mongoConnected: state === 1, state });
  });

  // --- SIGNUP ROUTE ---
  app.post("/api/auth/signup", async (req, res) => {
    console.log("[Signup Route] Body received:", req.body); // DEBUG LOG
    
    // Support both 'name' and 'fullName'
    const { email, password, name, fullName } = req.body ?? {};
    
    if (!email || !password) {
      console.log("[Signup Route] Error: Missing email or password");
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      const userName = name || fullName || email.split('@')[0];
      const user = await User.create({ 
        email, 
        password, 
        name: userName
      });

      res.json({
        success: true,
        token: "mock-token-" + user._id,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name || userName,
          isGoogleCalendarConnected: false,
        }
      });
    } catch (error: any) {
      console.error("/api/auth/signup error", error);
      res.status(500).json({ success: false, message: error.message || "Failed to create account" });
    }
  });

  // --- LOGIN ROUTE ---
  app.post("/api/auth/login", async (req, res) => {
    console.log("[Login Route] Body received:", req.body);
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      console.log("[Login Route] Error: Missing email or password");
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
      let user = await User.findOne({ email }).exec();
      
      if (!user || user.password !== password) {
         return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      res.json({
        success: true,
        token: "mock-token-" + user._id,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name || email.split('@')[0],
          isGoogleCalendarConnected: !!user.googleCalendarTokens?.access_token,
        }
      });
    } catch (error: any) {
      console.error("/api/auth/login error", error);
      res.status(500).json({ success: false, message: error.message || "Failed to login" });
    }
  });

  // --- GOOGLE AUTH ROUTES ---
  app.get("/api/auth/google/login", (req, res) => {
    if (!isConfigured()) return res.status(503).json({ message: "Google Auth not configured" });
    const authUrl = getAuthUrl();
    const stateData = JSON.stringify({ action: "login" });
    res.json({ authUrl: `${authUrl}&state=${encodeURIComponent(stateData)}` });
  });

  app.get("/api/auth/google/connect", (req, res) => {
    if (!isConfigured()) return res.status(503).json({ message: "Google Auth not configured" });
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    const authUrl = getAuthUrl();
    const stateData = JSON.stringify({ userId, action: "connect" });
    res.json({ authUrl: `${authUrl}&state=${encodeURIComponent(stateData)}` });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) return res.redirect("/?error=auth_failed");

    try {
      const stateData = JSON.parse(decodeURIComponent(state as string));
      const tokens = await getTokensFromCode(code as string);
      
      if (stateData.action === "login") {
        const profile = await getUserProfile(tokens.access_token!);
        let user = await User.findOne({ email: profile.email });
        if (!user) {
          user = await User.create({
            email: profile.email,
            password: "google-oauth",
            googleCalendarTokens: tokens,
          });
        } else {
          await User.findByIdAndUpdate(user._id, { googleCalendarTokens: tokens });
        }
        res.redirect(`/?googleLogin=true&userId=${user._id}&email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.name)}`);
      } else {
        await User.findByIdAndUpdate(stateData.userId, { googleCalendarTokens: tokens });
        res.redirect("/profile?connected=true");
      }
    } catch (error) {
      console.error("Google OAuth error", error);
      res.redirect("/?error=auth_failed");
    }
  });

  app.post("/api/auth/google/disconnect", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    try {
      await User.findByIdAndUpdate(userId, { $unset: { googleCalendarTokens: "" } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect" });
    }
  });

  app.post("/api/calendar/sync", async (req, res) => {
    const { userId, title, time, endTime, date, type, notes } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      if (!user?.googleCalendarTokens) return res.status(401).json({ message: "Google Calendar not connected" });

      if (type === "task") {
        let dueDateTime = new Date().toISOString();
        if (date) dueDateTime = new Date(date).toISOString();
        if (date && time) dueDateTime = new Date(`${date}T${time}:00`).toISOString();
        
        await createGoogleTask(user.googleCalendarTokens, { title, notes, due: dueDateTime });
        res.json({ success: true });
      } else {
        const startDateTime = date && time ? new Date(`${date}T${time}:00`) : new Date();
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);

        await createCalendarEvent(user.googleCalendarTokens, {
          summary: title,
          description: notes,
          start: { dateTime: startDateTime.toISOString(), timeZone: "UTC" },
          end: { dateTime: endDateTime.toISOString(), timeZone: "UTC" },
        });
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Calendar sync error", error);
      res.status(500).json({ message: "Failed to sync to calendar" });
    }
  });

  // --- DATA SAVING ROUTES ---
  app.get("/api/state", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        points: user.points ?? 0,
        lifetimeXP: user.lifetimeXP ?? 0,
        tasks: user.tasks ?? [],
        habits: user.habits ?? [],
        books: user.books ?? [],
        wishlist: user.wishlist ?? [],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load state" });
    }
  });

  app.post("/api/state", async (req, res) => {
    const { userId, points, lifetimeXP, tasks, habits, books, wishlist } = req.body ?? {};
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (points !== undefined) user.points = points;
      if (lifetimeXP !== undefined) user.lifetimeXP = lifetimeXP;
      if (tasks !== undefined) user.tasks = tasks;
      if (habits !== undefined) user.habits = habits;
      if (books !== undefined) user.books = books;
      if (wishlist !== undefined) user.wishlist = wishlist;

      await user.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save state" });
    }
  });

  app.post("/api/journal/save", async (req, res) => {
    const { userId, text } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.journalEntries) user.journalEntries = [];
      user.journalEntries.push({
        id: Math.random().toString(36).substr(2, 9),
        text,
        date: new Date(),
      });
      await user.save();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save journal entry" });
    }
  });
  
  return httpServer;
}
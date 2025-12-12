import type { Express } from "express";
import { createServer, type Server } from "http";
import mongoose from "mongoose";
import { User } from "./models/User";
import { getAuthUrl, getTokensFromCode, createCalendarEvent, createGoogleTask, isConfigured, getUserProfile } from "./googleCalendar";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    const state = mongoose.connection.readyState;
    res.json({ mongoConnected: state === 1, state });
  });

  // --- FIXED SIGNUP ROUTE ---
  app.post("/api/auth/signup", async (req, res) => {
    // Read 'fullName' (sent by client) or 'name'
    const { email, password, name, fullName } = req.body ?? {};
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await User.create({ 
        email, 
        password, 
        name: name || fullName || email.split('@')[0] 
      });

      // RETURN THE STRUCTURE THE CLIENT EXPECTS
      res.json({
        success: true,
        token: "mock-token-" + user._id, // Placeholder token to allow login
        user: {
          id: user._id,
          email: user.email,
          displayName: user.name,
          isGoogleCalendarConnected: false,
        }
      });
    } catch (error) {
      console.error("/api/auth/signup error", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // --- FIXED LOGIN ROUTE ---
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      const user = await User.findOne({ email }).exec();

      // Simple password check (Note: In production, use bcrypt/hashing)
      if (!user || user.password !== password) {
         return res.status(401).json({ message: "Invalid email or password" });
      }

      // RETURN THE STRUCTURE THE CLIENT EXPECTS
      res.json({
        success: true,
        token: "mock-token-" + user._id,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.name || user.email.split('@')[0],
          isGoogleCalendarConnected: !!user.googleCalendarTokens?.access_token,
        }
      });
    } catch (error) {
      console.error("/api/auth/login error", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // --- GOOGLE ROUTES (Relative Paths) ---
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

  // ... (Keep the rest of your calendar/journal routes below unchanged) ...
  
  app.post("/api/calendar/sync", async (req, res) => {
    // ... (Keep existing code) ...
    // Note: ensure you handle errors properly
    res.status(501).json({message: "Not implemented in this snippet"}); 
  });
  
  // (Paste the rest of your routes for /api/state, /api/journal/* here from your previous file)
  // Or simply replace the top half of your file with the code above.

  return httpServer;
}
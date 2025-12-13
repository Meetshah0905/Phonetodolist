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

  // --- DATA SAVING ROUTES (Modified for Guest Access) ---
  app.get("/api/state", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      // If no user found (e.g. new guest), return empty default state instead of error
      if (!user) {
        return res.json({
          points: 0,
          lifetimeXP: 0,
          tasks: [],
          habits: [],
          books: [],
          wishlist: [],
        });
      }
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
      // Upsert: Update if exists, Create if not
      // This is crucial for guest users who generate their own random ID
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            points,
            lifetimeXP,
            tasks,
            habits,
            books,
            wishlist,
            // Ensure email/password exist to satisfy schema validation if creating new
            email: `guest_${userId}@example.com`, 
            password: "guest_password_placeholder" 
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Save state error:", error);
      res.status(500).json({ message: "Failed to save state" });
    }
  });

  app.post("/api/journal/save", async (req, res) => {
    const { userId, text } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const user = await User.findById(userId);
      if (user) {
        if (!user.journalEntries) user.journalEntries = [];
        user.journalEntries.push({
          id: Math.random().toString(36).substr(2, 9),
          text,
          date: new Date(),
        });
        await user.save();
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save journal entry" });
    }
  });
  
  // Keep auth routes generic in case you revert later, but they aren't used now
  app.post("/api/auth/signup", (req, res) => res.json({ success: true, token: "guest", user: { id: "guest", name: "Guest" } }));
  app.post("/api/auth/login", (req, res) => res.json({ success: true, token: "guest", user: { id: "guest", name: "Guest" } }));

  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import mongoose from "mongoose";
import { User } from "./models/User";
import { getAuthUrl, getTokensFromCode, createCalendarEvent, createGoogleTask, createCalendarReminder, isConfigured, getUserProfile } from "./googleCalendar";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  app.get("/api/health", (_req, res) => {
    const state = mongoose.connection.readyState;
    // 1 = connected, 2 = connecting, others are not ready
    const isConnected = state === 1;
    res.json({ mongoConnected: isConnected, state });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      let user = await User.findOne({ email }).exec();

      if (!user) {
        user = await User.create({ email, password });
      }

      res.json({
        id: user._id,
        email: user.email,
        isGoogleCalendarConnected: !!user.googleCalendarTokens?.access_token,
      });
    } catch (error) {
      console.error("/api/auth/login error", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Google Sign-In (for login page)
  app.get("/api/auth/google/login", (req, res) => {
    if (!isConfigured()) {
      return res.status(503).json({ 
        message: "Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file." 
      });
    }
    
    const authUrl = getAuthUrl();
    const stateData = JSON.stringify({ action: "login" });
    const urlWithState = `${authUrl}&state=${encodeURIComponent(stateData)}`;
    res.json({ authUrl: urlWithState });
  });

  // Google Calendar OAuth (for profile page)
  app.get("/api/auth/google/connect", (req, res) => {
    if (!isConfigured()) {
      return res.status(503).json({ 
        message: "Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file. See GOOGLE_CALENDAR_SETUP.md for instructions." 
      });
    }
    
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }
    const authUrl = getAuthUrl();
    const stateData = JSON.stringify({ userId, action: "connect" });
    const urlWithState = `${authUrl}&state=${encodeURIComponent(stateData)}`;
    res.json({ authUrl: urlWithState });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    
    console.log("=== OAuth Callback Debug ===");
    console.log("Code:", code ? "present" : "missing");
    console.log("State raw:", state);
    
    if (!code || !state) {
      return res.redirect("http://localhost:4000/?error=auth_failed");
    }

    try {
      const stateData = JSON.parse(decodeURIComponent(state as string));
      console.log("Parsed state data:", stateData);
      console.log("Action:", stateData.action);
      
      const tokens = await getTokensFromCode(code as string);
      
      if (stateData.action === "login") {
        // Google Sign-In flow - create/find user
        const profile = await getUserProfile(tokens.access_token!);
        
        let user = await User.findOne({ email: profile.email });
        if (!user) {
          user = await User.create({
            email: profile.email,
            password: "google-oauth", // placeholder
            googleCalendarTokens: tokens,
          });
        } else {
          await User.findByIdAndUpdate(user._id, {
            googleCalendarTokens: tokens,
          });
        }
        
        res.redirect(`http://localhost:4000/?googleLogin=true&userId=${user._id}&email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.name)}`);
      } else {
        // Calendar connect flow (from profile)
        console.log("=== Connect flow - updating userId:", stateData.userId);
        await User.findByIdAndUpdate(stateData.userId, {
          googleCalendarTokens: tokens,
        });
        console.log("Redirecting to: http://localhost:4000/profile?connected=true");
        res.redirect("http://localhost:4000/profile?connected=true");
      }
    } catch (error) {
      console.error("Google OAuth callback error", error);
      res.redirect("http://localhost:4000/?error=auth_failed");
    }
  });

  app.post("/api/auth/google/disconnect", async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { googleCalendarTokens: "" },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Google disconnect error", error);
      res.status(500).json({ message: "Failed to disconnect" });
    }
  });

  app.post("/api/calendar/sync", async (req, res) => {
    const { userId, title, time, endTime, date, type, notes } = req.body;

    console.log("=== Calendar Sync Debug ===");
    console.log("User ID:", userId);
    console.log("Title:", title);
    console.log("Time:", time);
    console.log("End Time:", endTime);
    console.log("Date:", date);
    console.log("Type:", type);

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      const user = await User.findById(userId);
      console.log("User found:", !!user);
      console.log("Has tokens:", !!user?.googleCalendarTokens);
      
      if (!user?.googleCalendarTokens) {
        return res.status(401).json({ message: "Google Calendar not connected" });
      }

      if (type === "task") {
        // Create Google Task
        console.log("Creating Google Task...");
        
        // Parse the time and date to create a due datetime
        let dueDateTime = null;
        if (time && date) {
          // Handle HTML time input format (HH:MM in 24-hour format)
          const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
          if (timeMatch) {
            // Create date string in local timezone format
            const dateStr = `${date}T${time}:00`;
            const taskDate = new Date(dateStr);
            dueDateTime = taskDate.toISOString();
            console.log("Parsed task due time:", dateStr, "->", taskDate);
          } else {
            // Fallback: use date without specific time
            dueDateTime = new Date(date).toISOString();
          }
        } else if (date) {
          dueDateTime = new Date(date).toISOString();
        }
        
        const task = await createGoogleTask(user.googleCalendarTokens, {
          title: title,
          notes: notes || "",
          due: dueDateTime || new Date().toISOString(),
        });

        console.log("Task created successfully:", task.id);
        res.json({ success: true, taskId: task.id });
      } else {
        // Create Calendar Event
        console.log("Creating calendar event...");
        
        // Parse start time
        let startDateTime: Date;
        if (time && date) {
          const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            // Create date string in local timezone format
            const dateStr = `${date}T${time}:00`;
            startDateTime = new Date(dateStr);
            console.log("Parsed start time:", dateStr, "->", startDateTime);
          } else {
            startDateTime = new Date(date);
          }
        } else {
          startDateTime = date ? new Date(date) : new Date();
        }
        
        // Parse end time
        let endDateTime: Date;
        if (endTime && date) {
          const endTimeMatch = endTime.match(/^(\d{1,2}):(\d{2})$/);
          if (endTimeMatch) {
            const hours = parseInt(endTimeMatch[1]);
            const minutes = parseInt(endTimeMatch[2]);
            // Create date string in local timezone format
            const dateStr = `${date}T${endTime}:00`;
            endDateTime = new Date(dateStr);
            console.log("Parsed end time:", dateStr, "->", endDateTime);
          } else {
            // Default to 1 hour after start
            endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + 1);
          }
        } else {
          // Default to 1 hour after start if no end time provided
          endDateTime = new Date(startDateTime);
          endDateTime.setHours(endDateTime.getHours() + 1);
        }
        
        console.log("Final start ISO:", startDateTime.toISOString());
        console.log("Final end ISO:", endDateTime.toISOString());
        
        const event = await createCalendarEvent(user.googleCalendarTokens, {
          summary: title,
          description: notes || "",
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        });

        console.log("Event created successfully:", event.id);
        res.json({ success: true, eventId: event.id });
      }
    } catch (error) {
      console.error("Calendar sync error", error);
      if ((error as any)?.response?.data) {
        console.error("Google API response:", (error as any).response.data);
      }
      const apiError = (error as any)?.response?.data;
      res.status(500).json({ 
        message: "Failed to sync to calendar", 
        details: apiError || (error as any)?.message || "unknown_error"
      });
    }
  });

  // Journal Entry Routes
  app.get("/api/state", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      console.error("State load error", error);
      res.status(500).json({ message: "Failed to load state" });
    }
  });

  app.post("/api/state", async (req, res) => {
    const { userId, points, lifetimeXP, tasks, habits, books, wishlist } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.points = typeof points === "number" ? points : user.points ?? 0;
      user.lifetimeXP = typeof lifetimeXP === "number" ? lifetimeXP : user.lifetimeXP ?? 0;
      user.tasks = Array.isArray(tasks) ? tasks : user.tasks ?? [];
      user.habits = Array.isArray(habits) ? habits : user.habits ?? [];
      user.books = Array.isArray(books) ? books : user.books ?? [];
      user.wishlist = Array.isArray(wishlist) ? wishlist : user.wishlist ?? [];

      await user.save();
      res.json({ success: true });
    } catch (error) {
      console.error("State save error", error);
      res.status(500).json({ message: "Failed to save state" });
    }
  });

  app.post("/api/journal/save", async (req, res) => {
    const { userId, text, audioBase64 } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ message: "User ID and text required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entry = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        date: new Date(),
        audioData: audioBase64 ? Buffer.from(audioBase64, 'base64') : undefined,
      };

      if (!user.journalEntries) {
        user.journalEntries = [];
      }
      user.journalEntries.push(entry);
      await user.save();

      res.json({ success: true, entry: { ...entry, audioData: undefined } });
    } catch (error) {
      console.error("Journal save error", error);
      res.status(500).json({ message: "Failed to save journal entry" });
    }
  });

  app.get("/api/journal/entries", async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entries = (user.journalEntries || []).map(e => ({
        id: e.id,
        text: e.text,
        date: e.date,
        hasAudio: !!e.audioData,
      }));

      res.json({ entries });
    } catch (error) {
      console.error("Journal fetch error", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal/reminder", async (req, res) => {
    const { userId, enabled, time, syncToCalendar } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.reminderSettings = {
        enabled: enabled ?? true,
        time: time || "23:11",
        syncToCalendar: syncToCalendar ?? false,
      };
      await user.save();

      // If syncToCalendar is enabled and user has calendar connected, create task/reminder
      if (syncToCalendar && user.googleCalendarTokens) {
        try {
          const [hours, minutes] = time.split(':');
          const reminderDate = new Date();
          reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Create as a Google Task (same as tasks page)
          const dateStr = `${reminderDate.toISOString().split('T')[0]}T${time}:00`;
          const taskDate = new Date(dateStr);
          
          await createGoogleTask(user.googleCalendarTokens, {
            title: "📔 Daily Journal Reminder",
            notes: "Time for your daily reflection and journaling",
            due: taskDate.toISOString(),
          });
        } catch (calError) {
          console.error("Failed to sync reminder to calendar", calError);
        }
      }

      res.json({ success: true, settings: user.reminderSettings });
    } catch (error) {
      console.error("Reminder settings error", error);
      res.status(500).json({ message: "Failed to update reminder settings" });
    }
  });

  app.get("/api/journal/reminder", async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        settings: user.reminderSettings || { enabled: true, time: "23:11", syncToCalendar: false } 
      });
    } catch (error) {
      console.error("Reminder fetch error", error);
      res.status(500).json({ message: "Failed to fetch reminder settings" });
    }
  });

  app.post("/api/journal/update", async (req, res) => {
    const { userId, entryId, text } = req.body;

    if (!userId || !entryId || !text) {
      return res.status(400).json({ message: "User ID, entry ID, and text required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entryIndex = user.journalEntries?.findIndex(e => e.id === entryId);
      if (entryIndex === undefined || entryIndex === -1) {
        return res.status(404).json({ message: "Entry not found" });
      }

      if (user.journalEntries) {
        user.journalEntries[entryIndex].text = text;
        await user.save();
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Journal update error", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.post("/api/journal/delete", async (req, res) => {
    const { userId, entryId } = req.body;

    if (!userId || !entryId) {
      return res.status(400).json({ message: "User ID and entry ID required" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.journalEntries) {
        user.journalEntries = user.journalEntries.filter(e => e.id !== entryId);
        await user.save();
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Journal delete error", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  app.get("/api/journal/audio/:userId/:entryId", async (req, res) => {
    const { userId, entryId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entry = user.journalEntries?.find(e => e.id === entryId);
      if (!entry || !entry.audioData) {
        return res.status(404).json({ message: "Audio not found" });
      }

      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Content-Length', entry.audioData.length.toString());
      res.send(entry.audioData);
    } catch (error) {
      console.error("Audio fetch error", error);
      res.status(500).json({ message: "Failed to fetch audio" });
    }
  });

  return httpServer;
}

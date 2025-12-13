import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IJournalEntry {
  id: string;
  text: string;
  date: Date;
  audioUrl?: string;
  audioData?: Buffer;
}

export interface IReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
  syncToCalendar: boolean;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  googleCalendarTokens?: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  };
  journalEntries?: IJournalEntry[];
  reminderSettings?: IReminderSettings;
  // Game state
  points?: number;
  lifetimeXP?: number;
  tasks?: Array<{
    id: string;
    title: string;
    time: string;
    points: number;
    completed: boolean;
    date: string;
    priority: "high" | "medium" | "low";
    notes?: string;
  }>;
  habits?: Array<{
    id: string;
    title: string;
    points: number;
    completed: boolean;
    type: "morning" | "afternoon" | "evening" | "night";
    resetTime: string;
    mustDo: boolean;
  }>;
  books?: Array<{
    id: string;
    title: string;
    author: string;
    totalPoints: number;
    status: "not-started" | "reading" | "completed";
    deadline: string;
    progress: number;
    totalPages: number;
    currentPage: number;
    image?: string;
  }>;
  wishlist?: Array<{
    id: string;
    name: string;
    cost: number;
    redeemed: boolean;
    image?: string;
  }>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    googleCalendarTokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    journalEntries: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        date: { type: Date, required: true },
        audioUrl: String,
        audioData: Buffer,
      },
    ],
    reminderSettings: {
      enabled: { type: Boolean, default: true },
      time: { type: String, default: "23:11" },
      syncToCalendar: { type: Boolean, default: false },
    },
    points: { type: Number, default: 0 },
    lifetimeXP: { type: Number, default: 0 },
    tasks: { type: Array, default: [] },
    habits: { type: Array, default: [] },
    books: { type: Array, default: [] },
    wishlist: { type: Array, default: [] },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

import mongoose from "mongoose";

const siteEventSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true,
    },
    event: {
      type: String,
      required: true,
      enum: ["page_view", "apk_download"],
      index: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // 90-Day Time-To-Live index (event aggregates automatically delete after 90 days)
      expires: 90 * 24 * 60 * 60,
    },
  },
  {
    timestamps: false,
  },
);

// Unique compound index for upserting daily counts per path and event
siteEventSchema.index({ date: 1, path: 1, event: 1 }, { unique: true });

export const SiteEvent =
  mongoose.models.SiteEvent || mongoose.model("SiteEvent", siteEventSchema);


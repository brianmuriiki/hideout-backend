import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
      maxlength: [50, "Topic name cannot exceed 50 characters"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating number is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1200, "Feedback cannot exceed 1,200 characters"],
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // 1-Year Time-To-Live index (records automatically expire after 365 days)
      expires: 365 * 24 * 60 * 60,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

ratingSchema.index({ topic: 1, createdAt: -1 });

export const Rating =
  mongoose.models.Rating || mongoose.model("Rating", ratingSchema);


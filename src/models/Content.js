import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Content type is required"],
      enum: ["project", "startup", "innovation", "event", "blog", "app"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: [true, "URL slug is required"],
      trim: true,
      lowercase: true,
      maxlength: [100, "Slug cannot exceed 100 characters"],
      index: true,
    },
    summary: {
      type: String,
      required: [true, "Summary is required"],
      trim: true,
      maxlength: [280, "Summary cannot exceed 280 characters"],
    },
    body: {
      type: String,
      required: [true, "Body content is required"],
      maxlength: [12000, "Body content cannot exceed 12,000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    linkUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
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

// Composite index for fast public queries
contentSchema.index({ type: 1, status: 1, createdAt: -1 });

export const Content =
  mongoose.models.Content || mongoose.model("Content", contentSchema);


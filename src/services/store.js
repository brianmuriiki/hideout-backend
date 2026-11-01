import { isDbConnected } from "../config/db.js";
import { Content } from "../models/Content.js";
import { Rating } from "../models/Rating.js";
import { SiteEvent } from "../models/SiteEvent.js";

// In-Memory Fallback State (used when MongoDB URI is omitted or unreachable)
const memoryStore = {
  content: [
    {
      id: "mem-sample-1",
      type: "project",
      title: "DIGITracker Platform",
      slug: "digitracker-platform",
      summary: "A personal planning, wellness notes, and workout tracking system.",
      body: "DIGITracker is HideOut Creatives flagship digital wellness application designed to build daily rhythm and support real routines.",
      imageUrl: "",
      linkUrl: "https://hideout-creatives.vercel.app/apps",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "mem-sample-2",
      type: "app",
      title: "Ziba Marketplace",
      slug: "ziba-marketplace",
      summary: "Local products, homes, and services app made for Kenya.",
      body: "Browse products, homes, and services directly on your mobile device. Connect with verified sellers in one place.",
      imageUrl: "",
      linkUrl: "https://hideout-creatives.vercel.app/apps",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  ratings: [],
  events: [],
};

// Seed initial sample events in memory store for local testing
const today = new Date();
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateKey = d.toISOString().slice(0, 10);
  memoryStore.events.push(
    { date: dateKey, path: "/", event: "page_view", count: 12 + i * 3 },
    { date: dateKey, path: "/apps", event: "page_view", count: 7 + i * 2 },
    {
      date: dateKey,
      path: "/downloads/DIGITracker-latest.apk",
      event: "apk_download",
      count: 2 + i,
    },
  );
}

export const store = {
  // --- Content Operations ---
  async getContent({ type, status } = {}) {
    if (isDbConnected()) {
      const query = {};
      if (type && type !== "all") query.type = type;
      if (status && status !== "all") query.status = status;
      return await Content.find(query).sort({ updatedAt: -1, createdAt: -1 });
    }

    return memoryStore.content.filter((item) => {
      if (type && type !== "all" && item.type !== type) return false;
      if (status && status !== "all" && item.status !== status) return false;
      return true;
    });
  },

  async getContentById(id) {
    if (isDbConnected()) {
      return await Content.findById(id);
    }
    return memoryStore.content.find((item) => item.id === id) || null;
  },

  async createContent(data) {
    const isPublished = data.status === "published";
    const publishedAt = isPublished ? new Date() : null;

    if (isDbConnected()) {
      const item = new Content({
        ...data,
        publishedAt,
      });
      return await item.save();
    }

    const newItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      publishedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.content.unshift(newItem);
    return newItem;
  },

  async updateContent(id, data) {
    if (isDbConnected()) {
      const existing = await Content.findById(id);
      if (!existing) return null;

      const isBecomingPublished =
        data.status === "published" && existing.status !== "published";
      const publishedAt = isBecomingPublished
        ? new Date()
        : data.status === "draft"
          ? null
          : existing.publishedAt;

      return await Content.findByIdAndUpdate(
        id,
        {
          ...data,
          ...(isBecomingPublished || data.status === "draft"
            ? { publishedAt }
            : {}),
          updatedAt: new Date(),
        },
        { new: true, runValidators: true },
      );
    }

    const idx = memoryStore.content.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const existing = memoryStore.content[idx];
    const isBecomingPublished =
      data.status === "published" && existing.status !== "published";
    const publishedAt = isBecomingPublished
      ? new Date()
      : data.status === "draft"
        ? null
        : existing.publishedAt;

    const updated = {
      ...existing,
      ...data,
      publishedAt,
      updatedAt: new Date(),
    };
    memoryStore.content[idx] = updated;
    return updated;
  },

  async deleteContent(id) {
    if (isDbConnected()) {
      const res = await Content.findByIdAndDelete(id);
      return !!res;
    }

    const idx = memoryStore.content.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    memoryStore.content.splice(idx, 1);
    return true;
  },

  // --- Site Analytics Events ---
  async recordEvent({ event, path }) {
    const date = new Date().toISOString().slice(0, 10);
    const cleanPath = (path || "/").slice(0, 150);

    if (isDbConnected()) {
      await SiteEvent.findOneAndUpdate(
        { date, path: cleanPath, event },
        { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, new: true },
      );
      return true;
    }

    const found = memoryStore.events.find(
      (e) => e.date === date && e.path === cleanPath && e.event === event,
    );
    if (found) {
      found.count += 1;
    } else {
      memoryStore.events.push({
        date,
        path: cleanPath,
        event,
        count: 1,
      });
    }
    return true;
  },

  // --- Ratings Operations ---
  async recordRating({ topic, rating, feedback }) {
    const cleanTopic = (topic || "general").toLowerCase().trim();
    const cleanRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const cleanFeedback = (feedback || "").slice(0, 1200).trim();

    if (isDbConnected()) {
      const r = new Rating({
        topic: cleanTopic,
        rating: cleanRating,
        feedback: cleanFeedback,
        createdAt: new Date(),
      });
      return await r.save();
    }

    const newRating = {
      id: `rating-${Date.now()}`,
      topic: cleanTopic,
      rating: cleanRating,
      feedback: cleanFeedback,
      createdAt: new Date(),
    };
    memoryStore.ratings.unshift(newRating);
    return newRating;
  },

  // --- Admin Overview Computation ---
  async getOverview() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);

    const fromDateStr = startDate.toISOString().slice(0, 10);
    const toDateStr = today.toISOString().slice(0, 10);

    const dateKeys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    if (isDbConnected()) {
      const [events, contentList] = await Promise.all([
        SiteEvent.find({ date: { $gte: fromDateStr, $lte: toDateStr } }),
        Content.find({}, "type status"),
      ]);

      let pageViews = 0;
      let apkDownloads = 0;
      const topPageMap = new Map();
      const dailyViewsMap = new Map();

      dateKeys.forEach((d) => dailyViewsMap.set(d, 0));

      events.forEach((item) => {
        if (item.event === "page_view") {
          pageViews += item.count;
          topPageMap.set(
            item.path,
            (topPageMap.get(item.path) || 0) + item.count,
          );
          dailyViewsMap.set(
            item.date,
            (dailyViewsMap.get(item.date) || 0) + item.count,
          );
        } else if (item.event === "apk_download") {
          apkDownloads += item.count;
        }
      });

      const topPages = Array.from(topPageMap.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const dailyViews = dateKeys.map((date) => ({
        date,
        count: dailyViewsMap.get(date) || 0,
      }));

      const contentCounts = {};
      ["project", "startup", "innovation", "event", "blog", "app"].forEach(
        (type) => {
          contentCounts[`${type}:published`] = 0;
          contentCounts[`${type}:draft`] = 0;
        },
      );

      contentList.forEach((item) => {
        const key = `${item.type}:${item.status}`;
        contentCounts[key] = (contentCounts[key] || 0) + 1;
      });

      return {
        metrics: { pageViews, apkDownloads },
        contentCounts,
        topPages,
        dailyViews,
        range: { from: fromDateStr, to: toDateStr },
      };
    }

    // In-Memory Overview Computation
    const relevantEvents = memoryStore.events.filter(
      (e) => e.date >= fromDateStr && e.date <= toDateStr,
    );

    let pageViews = 0;
    let apkDownloads = 0;
    const topPageMap = new Map();
    const dailyViewsMap = new Map();
    dateKeys.forEach((d) => dailyViewsMap.set(d, 0));

    relevantEvents.forEach((item) => {
      if (item.event === "page_view") {
        pageViews += item.count;
        topPageMap.set(
          item.path,
          (topPageMap.get(item.path) || 0) + item.count,
        );
        dailyViewsMap.set(
          item.date,
          (dailyViewsMap.get(item.date) || 0) + item.count,
        );
      } else if (item.event === "apk_download") {
        apkDownloads += item.count;
      }
    });

    const topPages = Array.from(topPageMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dailyViews = dateKeys.map((date) => ({
      date,
      count: dailyViewsMap.get(date) || 0,
    }));

    const contentCounts = {};
    ["project", "startup", "innovation", "event", "blog", "app"].forEach(
      (type) => {
        contentCounts[`${type}:published`] = 0;
        contentCounts[`${type}:draft`] = 0;
      },
    );

    memoryStore.content.forEach((item) => {
      const key = `${item.type}:${item.status}`;
      contentCounts[key] = (contentCounts[key] || 0) + 1;
    });

    return {
      metrics: { pageViews, apkDownloads },
      contentCounts,
      topPages,
      dailyViews,
      range: { from: fromDateStr, to: toDateStr },
    };
  },

  // --- Ratings Aggregation & Recent Feed ---
  async getRatingsData() {
    if (isDbConnected()) {
      const [aggregated, recent] = await Promise.all([
        Rating.aggregate([
          {
            $group: {
              _id: "$topic",
              average: { $avg: "$rating" },
              count: { $sum: 1 },
            },
          },
        ]),
        Rating.find()
          .sort({ createdAt: -1 })
          .limit(60)
          .select("topic rating feedback createdAt"),
      ]);

      const summary = {
        digitracker: null,
        startups: null,
        innovation: null,
      };

      aggregated.forEach((item) => {
        summary[item._id] = {
          average: Math.round(item.average * 10) / 10,
          count: item.count,
        };
      });

      return {
        summary,
        recent: recent.map((r) => ({
          topic: r.topic,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt,
        })),
      };
    }

    // In-memory ratings aggregation
    const summary = {
      digitracker: null,
      startups: null,
      innovation: null,
    };

    const topicStats = new Map();
    memoryStore.ratings.forEach((r) => {
      const current = topicStats.get(r.topic) || { total: 0, count: 0 };
      current.total += r.rating;
      current.count += 1;
      topicStats.set(r.topic, current);
    });

    topicStats.forEach((val, topic) => {
      summary[topic] = {
        average: Math.round((val.total / val.count) * 10) / 10,
        count: val.count,
      };
    });

    return {
      summary,
      recent: memoryStore.ratings.slice(0, 60),
    };
  },
};


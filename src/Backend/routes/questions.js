import express from "express";

import Question from "../models/Question.js";

function serializeQuestion(question) {
  return {
    id: String(question._id),
    title: question.title,
    difficulty: question.difficulty,
    tags: question.tags || [],
    description: question.description,
    examples: question.examples || [],
    constraints: question.constraints || [],
    starterCode: question.starterCode || {},
    testCases: question.testCases || [],
    source: question.source,
    createdBy: question.createdBy ? String(question.createdBy) : null,
    usageCount: question.usageCount ?? 0,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

function buildVisibilityFilter(userId) {
  return {
    $or: [{ source: "seed" }, { createdBy: userId }],
  };
}

function canAccessQuestion(question, userId) {
  if (question.source === "seed") {
    return true;
  }

  return String(question.createdBy) === String(userId);
}

function canModifyQuestion(question, userId) {
  if (question.source === "seed") {
    return false;
  }

  return String(question.createdBy) === String(userId);
}

export function createQuestionsRouter(authenticateRequest) {
  const router = express.Router();

  router.get("/", authenticateRequest, async (request, response) => {
    try {
      const {
        search = "",
        difficulty,
        tags,
        source,
        page = "1",
        limit = "20",
      } = request.query;

      const filter = buildVisibilityFilter(request.user._id);

      if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
        filter.difficulty = difficulty;
      }

      if (source && ["seed", "custom"].includes(source)) {
        filter.source = source;
      }

      if (tags) {
        const tagList = String(tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        if (tagList.length) {
          filter.tags = { $in: tagList };
        }
      }

      if (search.trim()) {
        const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [{ title: pattern }, { description: pattern }, { tags: pattern }],
          },
        ];
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [questions, total] = await Promise.all([
        Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Question.countDocuments(filter),
      ]);

      response.json({
        questions: questions.map(serializeQuestion),
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load questions.",
        detail: error.message,
      });
    }
  });

  router.get("/:id", authenticateRequest, async (request, response) => {
    try {
      const question = await Question.findById(request.params.id);

      if (!question || !canAccessQuestion(question, request.user._id)) {
        response.status(404).json({ message: "Question not found." });
        return;
      }

      response.json({ question: serializeQuestion(question) });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load question.",
        detail: error.message,
      });
    }
  });

  router.post("/", authenticateRequest, async (request, response) => {
    try {
      const {
        title,
        difficulty,
        tags,
        description,
        examples,
        constraints,
        starterCode,
        testCases,
      } = request.body;

      if (!title?.trim() || !description?.trim()) {
        response.status(400).json({ message: "Title and description are required." });
        return;
      }

      if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
        response.status(400).json({ message: "Difficulty must be Easy, Medium, or Hard." });
        return;
      }

      const question = await Question.create({
        title: title.trim(),
        difficulty,
        tags: tags || [],
        description: description.trim(),
        examples: examples || [],
        constraints: constraints || [],
        starterCode: starterCode || {},
        testCases: testCases || [],
        source: "custom",
        createdBy: request.user._id,
      });

      response.status(201).json({ question: serializeQuestion(question) });
    } catch (error) {
      response.status(500).json({
        message: "Unable to create question.",
        detail: error.message,
      });
    }
  });

  router.put("/:id", authenticateRequest, async (request, response) => {
    try {
      const question = await Question.findById(request.params.id);

      if (!question || !canAccessQuestion(question, request.user._id)) {
        response.status(404).json({ message: "Question not found." });
        return;
      }

      if (!canModifyQuestion(question, request.user._id)) {
        response.status(403).json({ message: "Built-in questions cannot be edited." });
        return;
      }

      const fields = [
        "title",
        "difficulty",
        "tags",
        "description",
        "examples",
        "constraints",
        "starterCode",
        "testCases",
      ];

      fields.forEach((field) => {
        if (request.body[field] !== undefined) {
          question[field] = request.body[field];
        }
      });

      if (question.title) {
        question.title = question.title.trim();
      }

      if (question.description) {
        question.description = question.description.trim();
      }

      question.updatedAt = new Date();
      await question.save();

      response.json({ question: serializeQuestion(question) });
    } catch (error) {
      response.status(500).json({
        message: "Unable to update question.",
        detail: error.message,
      });
    }
  });

  router.delete("/:id", authenticateRequest, async (request, response) => {
    try {
      const question = await Question.findById(request.params.id);

      if (!question || !canAccessQuestion(question, request.user._id)) {
        response.status(404).json({ message: "Question not found." });
        return;
      }

      if (!canModifyQuestion(question, request.user._id)) {
        response.status(403).json({ message: "Built-in questions cannot be deleted." });
        return;
      }

      await Question.deleteOne({ _id: question._id });
      response.json({ success: true });
    } catch (error) {
      response.status(500).json({
        message: "Unable to delete question.",
        detail: error.message,
      });
    }
  });

  router.post("/:id/use", authenticateRequest, async (request, response) => {
    try {
      const question = await Question.findById(request.params.id);

      if (!question || !canAccessQuestion(question, request.user._id)) {
        response.status(404).json({ message: "Question not found." });
        return;
      }

      question.usageCount = (question.usageCount || 0) + 1;
      question.updatedAt = new Date();
      await question.save();

      response.json({ usageCount: question.usageCount });
    } catch (error) {
      response.status(500).json({
        message: "Unable to update question usage.",
        detail: error.message,
      });
    }
  });

  return router;
}

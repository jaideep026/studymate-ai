const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
  },
  { _id: false }
);

const flashcardSchema = new mongoose.Schema(
  { front: String, back: String },
  { _id: false }
);

const examQuestionSchema = new mongoose.Schema(
  {
    question: String,
    options: { type: [String], default: [] },
    correctIndex: Number,
    explanation: String,
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    rawText: { type: String, required: true },
    sourceType: { type: String, enum: ['text', 'pdf', 'pptx', 'docx'], default: 'text' },
    chunks: { type: [chunkSchema], default: [] },
    flashcards: { type: [flashcardSchema], default: [] },
    studyTips: { type: [String], default: [] },
    examQuestions: { type: [examQuestionSchema], default: [] },
    examAttempts: { type: [examAttemptSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);

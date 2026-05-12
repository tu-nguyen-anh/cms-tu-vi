const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: { type: String, default: 'Hoc Tu Vi', trim: true },
    school: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true }],
    summary: { type: String, default: '', maxlength: 1000 },
    content: { type: String, required: true },
    published: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
    author: { type: String, default: 'admin' },
  },
  { timestamps: true, collection: 'cms_articles', minimize: false }
);

ArticleSchema.index({ title: 'text', content: 'text', summary: 'text', tags: 'text' });
ArticleSchema.index({ pinned: -1, pinnedAt: -1, createdAt: -1 });

module.exports = mongoose.model('Article', ArticleSchema);

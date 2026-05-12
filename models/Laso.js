const mongoose = require('mongoose');

const LasoSchema = new mongoose.Schema(
  {
    _id: { type: String },
    createdAt: { type: Date },
    ip: { type: String },
    link: { type: String },
    input: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'laso_history', strict: false, versionKey: false }
);

module.exports = mongoose.model('Laso', LasoSchema);

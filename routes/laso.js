const express = require('express');
const Laso = require('../models/Laso');

const router = express.Router();

router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 20;
  const q = (req.query.q || '').trim();

  const filter = q
    ? {
        $or: [
          { 'input.hoten': { $regex: q, $options: 'i' } },
          { ip: { $regex: q, $options: 'i' } },
          { link: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    Laso.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Laso.countDocuments(filter),
  ]);

  res.render('laso/list', {
    items,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    q,
  });
});

router.get('/:id', async (req, res) => {
  const doc = await Laso.findById(req.params.id).lean();
  if (!doc) {
    req.session.flash = { type: 'error', text: 'Không tìm thấy lá số.' };
    return res.redirect('/laso');
  }
  res.render('laso/detail', { item: doc });
});

module.exports = router;

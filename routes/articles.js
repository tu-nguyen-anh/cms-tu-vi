const express = require('express');
const Article = require('../models/Article');

const router = express.Router();

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function uniqueSlug(base, excludeId) {
  let slug = base || 'bai-viet';
  let n = 1;
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Article.findOne(q).lean();
    if (!exists) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 15;
  const q = (req.query.q || '').trim();

  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { summary: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
          { school: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    Article.find(filter).sort({ pinned: -1, pinnedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Article.countDocuments(filter),
  ]);

  res.render('articles/list', {
    items,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    q,
  });
});

router.get('/new', (req, res) => {
  res.render('articles/form', { item: null, error: null });
});

router.post('/', async (req, res) => {
  try {
    const { title, school, tags, summary, content, published } = req.body;
    if (!title || !content) {
      return res.status(400).render('articles/form', { item: req.body, error: 'Tiêu đề và nội dung là bắt buộc.' });
    }
    const baseSlug = slugify(title);
    const slug = await uniqueSlug(baseSlug);
    const doc = await Article.create({
      title: title.trim(),
      slug,
      school: (school || '').trim(),
      tags: (tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      summary: (summary || '').trim(),
      content,
      published: published === 'on' || published === 'true' || published === true,
      author: req.session.username || 'admin',
    });
    req.session.flash = { type: 'success', text: 'Đã đăng bài.' };
    res.redirect(`/articles/${doc._id}`);
  } catch (e) {
    res.status(500).render('articles/form', { item: req.body, error: 'Lỗi khi lưu: ' + e.message });
  }
});

router.get('/:id', async (req, res) => {
  const item = await Article.findById(req.params.id).lean();
  if (!item) {
    req.session.flash = { type: 'error', text: 'Không tìm thấy bài viết.' };
    return res.redirect('/articles');
  }
  res.render('articles/detail', { item });
});

router.get('/:id/edit', async (req, res) => {
  const item = await Article.findById(req.params.id).lean();
  if (!item) return res.redirect('/articles');
  res.render('articles/form', { item, error: null });
});

router.put('/:id', async (req, res) => {
  try {
    const item = await Article.findById(req.params.id);
    if (!item) return res.redirect('/articles');
    const { title, school, tags, summary, content, published } = req.body;
    if (!title || !content) {
      return res.status(400).render('articles/form', { item: { ...item.toObject(), ...req.body }, error: 'Tiêu đề và nội dung là bắt buộc.' });
    }
    item.title = title.trim();
    if (slugify(title) !== item.slug) {
      item.slug = await uniqueSlug(slugify(title), item._id);
    }
    item.school = (school || '').trim();
    item.tags = (tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    item.summary = (summary || '').trim();
    item.content = content;
    item.published = published === 'on' || published === 'true' || published === true;
    await item.save();
    req.session.flash = { type: 'success', text: 'Đã cập nhật bài.' };
    res.redirect(`/articles/${item._id}`);
  } catch (e) {
    res.status(500).render('articles/form', { item: req.body, error: 'Lỗi khi lưu: ' + e.message });
  }
});

router.post('/:id/pin', async (req, res) => {
  const item = await Article.findById(req.params.id);
  if (!item) {
    req.session.flash = { type: 'error', text: 'Không tìm thấy bài viết.' };
    return res.redirect('/articles');
  }
  item.pinned = !item.pinned;
  item.pinnedAt = item.pinned ? new Date() : null;
  await item.save();
  req.session.flash = {
    type: 'success',
    text: item.pinned ? 'Đã ghim bài viết.' : 'Đã bỏ ghim bài viết.',
  };
  const back = req.body.redirect || `/articles/${item._id}`;
  res.redirect(back);
});

router.delete('/:id', async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  req.session.flash = { type: 'success', text: 'Đã xóa bài.' };
  res.redirect('/articles');
});

module.exports = router;

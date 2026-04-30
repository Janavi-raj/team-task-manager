const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to=u.id
        LEFT JOIN projects p ON t.project_id=p.id
        ORDER BY t.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT t.*, u.name as assignee_name, p.name as project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to=u.id
        LEFT JOIN projects p ON t.project_id=p.id
        WHERE t.assigned_to=$1
        ORDER BY t.created_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  const { title, description, project_id, assigned_to, due_date, priority } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, description, project_id, assigned_to, due_date, priority || 'medium']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && task.rows[0].assigned_to !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });
    const result = await pool.query(
      'UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
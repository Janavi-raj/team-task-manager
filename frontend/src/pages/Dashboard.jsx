import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const STATUS_COLORS = { todo: '#f59e0b', in_progress: '#3b82f6', done: '#10b981' };
const PRIORITY_COLORS = { low: '#6ee7b7', medium: '#fbbf24', high: '#f87171' };

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('tasks');
  const [newTask, setNewTask] = useState({ title:'', description:'', project_id:'', assigned_to:'', due_date:'', priority:'medium' });
  const [newProject, setNewProject] = useState({ name:'', description:'' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchTasks(); fetchProjects();
    if (user.role === 'admin') fetchUsers();
  }, []);

  const fetchTasks = async () => { const r = await API.get('/tasks'); setTasks(r.data); };
  const fetchProjects = async () => { const r = await API.get('/projects'); setProjects(r.data); };
  const fetchUsers = async () => { const r = await API.get('/projects/users/all'); setUsers(r.data); };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const createTask = async () => {
    try {
      await API.post('/tasks', newTask);
      fetchTasks();
      setNewTask({ title:'', description:'', project_id:'', assigned_to:'', due_date:'', priority:'medium' });
      setMsg('✅ Task created successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch(e) { setMsg('❌ ' + (e.response?.data?.error || 'Error')); }
  };

  const createProject = async () => {
    try {
      await API.post('/projects', newProject);
      fetchProjects();
      setNewProject({ name:'', description:'' });
      setMsg('✅ Project created successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch(e) { setMsg('❌ ' + (e.response?.data?.error || 'Error')); }
  };

  const updateStatus = async (id, status) => {
    await API.patch(`/tasks/${id}/status`, { status });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await API.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');
  const inProgress = tasks.filter(t => t.status === 'in_progress');

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <span style={styles.logo}>🗂️ TaskFlow</span>
        <span style={styles.userInfo}>👤 {user.name} <b style={{color:'#a5b4fc'}}>({user.role})</b></span>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          ['📋 Total Tasks', tasks.length, '#4f46e5'],
          ['✅ Done', done.length, '#10b981'],
          ['⚡ In Progress', inProgress.length, '#3b82f6'],
          ['🔴 Overdue', overdue.length, '#ef4444']
        ].map(([label, val, color]) => (
          <div key={label} style={{...styles.statCard, borderTop:`4px solid ${color}`}}>
            <div style={{...styles.statNum, color}}>{val}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['tasks', 'projects', ...(user.role === 'admin' ? ['create_task', 'create_project'] : [])].map(t => (
          <button key={t} style={{...styles.tab, ...(tab===t ? styles.activeTab : {})}}
            onClick={() => { setTab(t); setMsg(''); }}>
            {t === 'tasks' ? '📋 Tasks' : t === 'projects' ? '📁 Projects' : t === 'create_task' ? '➕ New Task' : '➕ New Project'}
          </button>
        ))}
      </div>

      {msg && <div style={styles.msg}>{msg}</div>}

      <div style={styles.content}>
        {/* Tasks List */}
        {tab === 'tasks' && (
          <div style={styles.grid}>
            {tasks.length === 0 && <p style={{color:'#888'}}>No tasks yet.</p>}
            {tasks.map(task => (
              <div key={task.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <b style={styles.cardTitle}>{task.title}</b>
                  <span style={{...styles.badge, background: PRIORITY_COLORS[task.priority]}}>
                    {task.priority}
                  </span>
                </div>
                <p style={styles.desc}>{task.description}</p>
                <div style={styles.meta}>📁 {task.project_name}</div>
                <div style={styles.meta}>👤 {task.assignee_name || 'Unassigned'}</div>
                {task.due_date && (
                  <div style={{...styles.meta, color: new Date(task.due_date) < new Date() && task.status !== 'done' ? '#ef4444' : '#666'}}>
                    📅 {new Date(task.due_date).toLocaleDateString()}
                    {new Date(task.due_date) < new Date() && task.status !== 'done' ? ' ⚠️ Overdue' : ''}
                  </div>
                )}
                <div style={styles.statusRow}>
                  {['todo', 'in_progress', 'done'].map(s => (
                    <button key={s} onClick={() => updateStatus(task.id, s)}
                      style={{...styles.statusBtn,
                        background: task.status===s ? STATUS_COLORS[s] : '#e5e7eb',
                        color: task.status===s ? 'white' : '#374151'}}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                {user.role === 'admin' && (
                  <button style={styles.deleteBtn} onClick={() => deleteTask(task.id)}>🗑️ Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects List */}
        {tab === 'projects' && (
          <div style={styles.grid}>
            {projects.length === 0 && <p style={{color:'#888'}}>No projects yet.</p>}
            {projects.map(p => (
              <div key={p.id} style={styles.card}>
                <b style={styles.cardTitle}>📁 {p.name}</b>
                <p style={styles.desc}>{p.description}</p>
                <div style={styles.meta}>📅 Created: {new Date(p.created_at).toLocaleDateString()}</div>
                <div style={styles.meta}>
                  📋 Tasks: {tasks.filter(t => t.project_id === p.id).length}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Task (Admin) */}
        {tab === 'create_task' && user.role === 'admin' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>➕ Create New Task</h3>
            <input style={styles.input} placeholder="Task Title *" value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})} />
            <textarea style={{...styles.input, height:'80px'}} placeholder="Description"
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})} />
            <select style={styles.input} value={newTask.project_id}
              onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
              <option value="">Select Project *</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select style={styles.input} value={newTask.assigned_to}
              onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
              <option value="">Assign To *</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
            <select style={styles.input} value={newTask.priority}
              onChange={e => setNewTask({...newTask, priority: e.target.value})}>
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
            <input style={styles.input} type="date" value={newTask.due_date}
              onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
            <button style={styles.btn} onClick={createTask}>Create Task</button>
          </div>
        )}

        {/* Create Project (Admin) */}
        {tab === 'create_project' && user.role === 'admin' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>➕ Create New Project</h3>
            <input style={styles.input} placeholder="Project Name *" value={newProject.name}
              onChange={e => setNewProject({...newProject, name: e.target.value})} />
            <textarea style={{...styles.input, height:'80px'}} placeholder="Description"
              value={newProject.description}
              onChange={e => setNewProject({...newProject, description: e.target.value})} />
            <button style={styles.btn} onClick={createProject}>Create Project</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight:'100vh', background:'#ffffff', fontFamily:'sans-serif' },
  navbar: { background:'#4f46e5', padding:'1rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo: { color:'white', fontWeight:'bold', fontSize:'20px' },
  userInfo: { color:'white', fontSize:'14px' },
  logoutBtn: { background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'6px 16px', borderRadius:'8px', cursor:'pointer' },
  statsRow: { display:'flex', gap:'1rem', padding:'1.5rem 2rem', flexWrap:'wrap' },
  statCard: { background:'white', borderRadius:'12px', padding:'1rem 1.5rem', minWidth:'150px', flex:1, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' },
  statNum: { fontSize:'32px', fontWeight:'bold' },
  statLabel: { color:'#333', fontSize:'13px', marginTop:'4px' },
  tabs: { display:'flex', gap:'8px', padding:'0 2rem', flexWrap:'wrap' },
  tab: { padding:'8px 20px', borderRadius:'8px', border:'none', background:'#e5e7eb', cursor:'pointer', fontWeight:'500',color:'#111' },
  activeTab: { background:'#4f46e5', color:'white' },
  content: { padding:'1.5rem 2rem' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' },
  card: { background:'white', borderRadius:'12px', padding:'1.2rem', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', gap:'8px' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  cardTitle: { fontSize:'15px', color:'#1f2937' },
  badge: { padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold' },
  desc: { color:'#333', fontSize:'13px', margin:0 },
  meta: { color:'#333', fontSize:'12px' },
  statusRow: { display:'flex', gap:'6px', marginTop:'8px', flexWrap:'wrap' },
  statusBtn: { padding:'4px 10px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:'500' },
  deleteBtn: { background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', marginTop:'4px' },
  form: { background:'white', borderRadius:'12px', padding:'2rem', maxWidth:'480px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', gap:'12px' },
  formTitle: { margin:0, color:'#4f46e5' },
  input: { padding:'10px', borderRadius:'8px', border:'1px solid #999', fontSize:'14px', width:'100%', boxSizing:'border-box' ,color:'#111',background:'#431d20'},
  btn: { padding:'10px', background:'#4f46e5', color:'black', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'15px' },
  msg: { margin:'0 2rem', padding:'10px 16px', borderRadius:'8px', background:'#f0fdf4', color:'#166534', fontWeight:'500' },
};
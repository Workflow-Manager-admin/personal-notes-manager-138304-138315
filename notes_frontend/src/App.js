import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// Theme color constants
const COLORS = {
  primary: '#4F8A8B',
  secondary: '#ECECEC',
  accent: '#F9C846'
};

// Initial user for optional "authentication"
const DEMO_USER = {
  username: "demo",
  password: "demo"
};

// PUBLIC_INTERFACE
function Sidebar({
  notes,
  selectedId,
  onSelect,
  onAdd,
  onLogout,
  showLogout,
  searchQuery,
  setSearchQuery
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>My Notes</h2>
        <button
          className="accent-btn"
          aria-label="Create Note"
          onClick={onAdd}
        >
          + New
        </button>
      </div>
      <input
        className="search-input"
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <nav className="notes-list">
        {notes.length === 0 && (
          <div className="notes-empty">No notes found.</div>
        )}
        {notes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`note-item${note.id === selectedId ? ' selected' : ''}`}
            tabIndex={0}
            aria-label={`Select note titled ${note.title || 'Untitled'}`}
          >
            <div className="note-title">{note.title || <em>Untitled</em>}</div>
            <div className="note-updated">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </nav>
      {showLogout && (
        <button className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      )}
    </aside>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onSave, onDelete, isNew, onCancel }) {
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');

  useEffect(() => {
    setTitle(note ? note.title : '');
    setContent(note ? note.content : '');
  }, [note]);

  // Save note handler
  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      ...note,
      title: title.trim(),
      content,
    });
  };

  const handleDelete = (e) => {
    e.preventDefault();
    if (
      window.confirm(
        'Are you sure you want to delete this note? This cannot be undone.'
      )
    ) {
      onDelete(note.id);
    }
  };

  return (
    <form className="editor" onSubmit={handleSave}>
      <input
        type="text"
        placeholder="Note title"
        className="editor-title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
        required
        maxLength={100}
        spellCheck
      />
      <textarea
        placeholder="Write your notes here..."
        className="editor-content"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={14}
        spellCheck
      />
      <div className="editor-actions">
        <button className="primary-btn" type="submit">Save</button>
        {isNew ? (
          <button className="secondary-btn" type="button" onClick={onCancel}>Cancel</button>
        ) : (
          <button className="danger-btn" type="button" onClick={handleDelete}>Delete</button>
        )}
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function NoteView({ note, onEdit }) {
  if (!note) return (
    <div className="note-placeholder">
      <span>Select or create a note.</span>
    </div>
  );

  return (
    <div className="note-view">
      <h2>{note.title || <em>Untitled</em>}</h2>
      <div className="note-meta">
        Updated: {new Date(note.updatedAt).toLocaleString()}
      </div>
      <pre className="note-content">
        {note.content || <em>(No content)</em>}
      </pre>
      <button className="primary-btn" onClick={() => onEdit(note.id)}>Edit</button>
    </div>
  );
}

// Optional: Simulated persistent storage (LocalStorage)
function useNotesStorage(user) {
  const storageKey = user ? `notes-${user.username}` : 'notes-demo';
  const [notes, setNotes] = useState(() => {
    try {
      const json = localStorage.getItem(storageKey);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  // PUBLIC_INTERFACE
  const createNote = () => {
    const now = new Date().toISOString();
    const newNote = {
      id: String(Date.now()),
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    setNotes([newNote, ...notes]);
    return newNote.id;
  };

  // PUBLIC_INTERFACE
  const updateNote = (id, data) => {
    setNotes(notes =>
      notes.map(n =>
        n.id === id
          ? {
              ...n,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    setNotes(notes => notes.filter(n => n.id !== id));
  };

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
    setNotes, // for reset if logout
  };
}

// PUBLIC_INTERFACE
function AuthScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      username === DEMO_USER.username &&
      password === DEMO_USER.password
    ) {
      onLogin({ username });
    } else {
      setErr('Incorrect credentials. Try demo / demo.');
    }
  };

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Sign in</h2>
        <input
          type="text"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="primary-btn" type="submit">
          Login
        </button>
        <div className="auth-hint">
          <span>Try <strong>demo</strong> / <strong>demo</strong></span>
        </div>
        {err && <div className="auth-error">{err}</div>}
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Authentication state (you can disable auth by setting AUTH_ENABLED = false)
  const AUTH_ENABLED = true;
  const [user, setUser] = useState(
    AUTH_ENABLED
      ? JSON.parse(localStorage.getItem('user')) || null
      : { username: 'demo' }
  );
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  // Notes logic
  const {
    notes,
    createNote,
    updateNote,
    deleteNote,
    setNotes,
  } = useNotesStorage(user);

  // Search/filter notes
  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    const q = search.trim().toLowerCase();
    return notes.filter(
      n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
    );
  }, [search, notes]);

  // Selected note
  const selectedNote = useMemo(
    () => notes.find(n => n.id === selectedId),
    [selectedId, notes]
  );

  const handleAddNote = () => {
    const newId = createNote();
    setSelectedId(newId);
    setEditing(true);
  };

  const handleSelectNote = (id) => {
    setSelectedId(id);
    setEditing(false);
  };

  const handleSaveNote = (data) => {
    // New note being edited?
    if (!data.id) return;
    updateNote(data.id, data);
    setEditing(false);
  };

  const handleDeleteNote = (id) => {
    deleteNote(id);
    if (selectedId === id) {
      setSelectedId(notes.length > 1 ? notes.find(n => n.id !== id)?.id : null);
      setEditing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setNotes([]);
    setSelectedId(null);
    setEditing(false);
  };

  const handleLogin = (user) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setNotes([]); // reset notes for new login
  };

  // Keyboard shortcuts: Ctrl+N for new note, Esc for cancel edit
  useEffect(() => {
    function onKey(e) {
      if (!document.activeElement || document.activeElement.tagName === 'BODY') {
        if (e.ctrlKey && e.key === 'n') {
          e.preventDefault();
          handleAddNote();
        }
      }
      if (editing && e.key === 'Escape') {
        setEditing(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [editing, notes]);

  // Responsive design: reset editing on resize (mobile)
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 600 && editing) {
        setEditing(false);
      }
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [editing]);

  if (AUTH_ENABLED && !user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="notes-app">
      <Sidebar
        notes={filteredNotes}
        selectedId={selectedId}
        onSelect={handleSelectNote}
        onAdd={handleAddNote}
        onLogout={handleLogout}
        showLogout={AUTH_ENABLED}
        searchQuery={search}
        setSearchQuery={setSearch}
      />
      <main className="main-content">
        {editing && selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            isNew={notes.length > 0 && notes[0].id === selectedNote.id && selectedNote.title === '' && selectedNote.content === ''}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <NoteView
            note={selectedNote}
            onEdit={() => setEditing(true)}
          />
        )}
      </main>
    </div>
  );
}

export default App;

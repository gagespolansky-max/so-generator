import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getComments, addComment, resolveComment, deleteComment } from '../services/api';

const TEAM_MEMBERS = ['Kim Portante', 'Amiee Lynn', 'Design Team', 'Sales Team'];

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function highlightMentions(text) {
  const parts = text.split(/(@[\w\s]+?)(?=\s|$|[^a-zA-Z\s])/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{part}</span>
      : part
  );
}

export default function CommentWidget({ orderId, styleGroups = [], currentUser = 'You' }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [showResolved, setShowResolved] = useState(false);
  const [body, setBody] = useState('');
  const [linkStyle, setLinkStyle] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPos, setMentionPos] = useState(null); // cursor position when @ typed
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getComments(orderId);
      setComments(data);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) loadComments();
  }, [open, orderId, loadComments]);

  // Scroll to bottom when comments load or new one added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments, open]);

  const unresolved = comments.filter(c => !c.resolved).length;

  const visibleComments = showResolved ? comments : comments.filter(c => !c.resolved);

  function handleTextChange(e) {
    const val = e.target.value;
    setBody(val);
    // Detect @ mention
    const cursor = e.target.selectionStart;
    const textUpToCursor = val.slice(0, cursor);
    const atMatch = textUpToCursor.match(/@([\w\s]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionPos(cursor - atMatch[0].length);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  }

  function insertMention(name) {
    const before = body.slice(0, mentionPos);
    const after = body.slice(textareaRef.current.selectionStart);
    const newBody = `${before}@${name} ${after}`;
    setBody(newBody);
    setShowMentionDropdown(false);
    textareaRef.current.focus();
  }

  function parseMentions(text) {
    const found = [];
    const regex = /@([\w\s]+?)(?=\s|$)/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const name = m[1].trim();
      if (TEAM_MEMBERS.some(t => t.toLowerCase() === name.toLowerCase())) {
        found.push(name);
      }
    }
    return [...new Set(found)];
  }

  async function handleSend() {
    if (!body.trim() || !orderId) return;
    setSending(true);
    try {
      await addComment(orderId, {
        author: currentUser,
        body: body.trim(),
        line_style_number: linkStyle || null,
        mentions: parseMentions(body),
      });
      setBody('');
      setLinkStyle('');
      await loadComments();
    } catch {}
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showMentionDropdown) return;
      handleSend();
    }
  }

  async function handleResolve(comment) {
    try {
      await resolveComment(orderId, comment.id, currentUser);
      await loadComments();
    } catch {}
  }

  async function handleDelete(comment) {
    try {
      await deleteComment(orderId, comment.id);
      await loadComments();
    } catch {}
  }

  const filteredMembers = TEAM_MEMBERS.filter(m =>
    m.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const styleOptions = styleGroups
    .filter(g => g.style_number)
    .map(g => g.style_number)
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat panel */}
        {open && (
          <div className="w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
               style={{ maxHeight: '520px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">Comments</span>
                {unresolved > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    {unresolved} open
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={e => setShowResolved(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  Show resolved
                </label>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
              </div>
            </div>

            {/* Message list */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
              {visibleComments.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">
                  {comments.length === 0 ? 'No comments yet. Start the conversation!' : 'No open comments.'}
                </p>
              )}
              {visibleComments.map(comment => (
                <div
                  key={comment.id}
                  className={`relative group flex gap-3 pl-3 border-l-2 ${
                    comment.resolved ? 'border-gray-200 opacity-60' : 'border-indigo-400'
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {(comment.author || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{comment.author}</span>
                      <span className="text-xs text-gray-400">{relativeTime(comment.created_at)}</span>
                      {comment.line_style_number && (
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {comment.line_style_number}
                        </span>
                      )}
                    </div>
                    {/* Body */}
                    <p className="text-sm text-gray-700 break-words">
                      {highlightMentions(comment.body)}
                    </p>
                    {/* Resolved indicator */}
                    {comment.resolved && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Resolved by {comment.resolved_by}
                      </p>
                    )}
                  </div>
                  {/* Hover actions */}
                  <div className="absolute top-0 right-0 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 rounded shadow-sm px-1 py-0.5">
                    <button
                      onClick={() => handleResolve(comment)}
                      title={comment.resolved ? 'Reopen' : 'Resolve'}
                      className="text-xs text-gray-500 hover:text-green-600 px-1"
                    >
                      {comment.resolved ? '↩' : '✓'}
                    </button>
                    <button
                      onClick={() => handleDelete(comment)}
                      title="Delete"
                      className="text-xs text-gray-500 hover:text-red-500 px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose area */}
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              {/* Style linker */}
              {styleOptions.length > 0 && (
                <select
                  value={linkStyle}
                  onChange={e => setLinkStyle(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Link to style (optional)</option>
                  {styleOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {/* Textarea + mention dropdown */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment… (@ to mention)"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {/* Mention autocomplete */}
                {showMentionDropdown && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                    {filteredMembers.map(member => (
                      <button
                        key={member}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); insertMention(member); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        @{member}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Enter to send · Shift+Enter for newline</span>
                <button
                  onClick={handleSend}
                  disabled={!body.trim() || sending || !orderId}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trigger button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="relative w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Comments"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
          </svg>
          {unresolved > 0 && !open && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {unresolved > 9 ? '9+' : unresolved}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { MessageCircle, Send, Pencil, Trash2, X, Check } from 'lucide-react';
import Layout from '../components/Layout';

const MENTION_REGEX = /(^|\s)@([A-Za-z0-9_.-]{2,32})/g;

const normalizeUsername = (value) => (value || '').trim().toLowerCase();

const extractMentionQuery = (text, caretPos) => {
  const beforeCaret = text.slice(0, caretPos);
  const match = beforeCaret.match(/(^|\s)@([A-Za-z0-9_.-]*)$/);
  if (!match) return null;

  const query = match[2] ?? '';
  const atIndex = beforeCaret.lastIndexOf('@');
  if (atIndex < 0) return null;

  return {
    query,
    start: atIndex,
    end: caretPos,
  };
};

const doesMessageMentionUser = (content, username) => {
  const normalizedCurrentUser = normalizeUsername(username);
  if (!normalizedCurrentUser || !content) return false;

  const mentions = Array.from(content.matchAll(MENTION_REGEX)).map((m) => normalizeUsername(m[2]));
  return mentions.includes(normalizedCurrentUser);
};

const renderMessageWithMentions = (content) => {
  if (!content) {
    return <span>[Empty message]</span>;
  }

  const parts = [];
  const mentionMatcher = /(@[A-Za-z0-9_.-]{2,32})/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionMatcher.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    parts.push(
      <span key={`${match[0]}-${match.index}`} className="font-semibold underline decoration-2 decoration-current/40">
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
};

const LeagueChats = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [signedInUserId, setSignedInUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionRange, setMentionRange] = useState(null);
  const ws = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  const EMOJI_OPTIONS = ['👍', '❤', '😂', '😮', '😢', '🔥', '✨', '👏', '🎉', '😍'];

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        setSignedInUserId(session.user.id);

        // Get current user's username for mention highlighting.
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/user`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCurrentUsername(profileData.username || '');
          if (profileData.username) {
            setUserProfiles((prev) => ({
              ...prev,
              [session.user.id]: profileData.username,
            }));
          }
        }

        // Fetch user's leagues
        const leaguesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/league/my-leagues?userId=${session.user.id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!leaguesRes.ok) {
          setError('Failed to load leagues');
          setLoading(false);
          return;
        }

        const leaguesData = await leaguesRes.json();
        setLeagues(leaguesData);
        
        if (leaguesData.length > 0) {
          setSelectedLeagueId(leaguesData[0].id);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeChat();
  }, []);

  // Load chat history when league is selected
  useEffect(() => {
    if (!selectedLeagueId) return;

    const loadChatHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const historyRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/league-chat/${selectedLeagueId}/history?limit=50&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!historyRes.ok) {
          setMessages([]);
          return;
        }

        const historyData = await historyRes.json();
        setMessages(historyData.messages);

        // Store user profiles for message display
        const profiles = {};
        historyData.messages.forEach(msg => {
          if (msg.senderUsername && !profiles[msg.senderUserId]) {
            profiles[msg.senderUserId] = msg.senderUsername;
          }
        });
        setUserProfiles(profiles);

        // Connect to WebSocket
        connectWebSocket(selectedLeagueId, session.access_token);
      } catch {
        setMessages([]);
      }
    };

    loadChatHistory();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedLeagueId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reactionPickerMessageId !== null && !e.target.closest('.relative.group')) {
        setReactionPickerMessageId(null);
      }
    };

    if (reactionPickerMessageId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [reactionPickerMessageId]);

  const connectWebSocket = (leagueId, token) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const apiHost = import.meta.env.VITE_API_URL.split('//')[1];
      const wsUrl = `${protocol}//${apiHost}/ws/league-chat?leagueId=${leagueId}&token=${encodeURIComponent(token)}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const senderUsername = data.data.senderUsername || 'Unknown';
            
            setUserProfiles(prev => ({
              ...prev,
              [data.data.senderUserId]: senderUsername
            }));
            
            // Check if message already exists to avoid duplicates
            setMessages(prev => {
              const messageExists = prev.some(m => m.id === data.data.id);
              if (messageExists) {
                return prev;
              }
              
              const newMsg = {
                id: data.data.id,
                leagueChatId: data.data.leagueChatId,
                senderUserId: data.data.senderUserId,
                senderUsername: senderUsername,
                content: data.data.content,
                createdAt: data.data.createdAt,
                updatedAt: data.data.updatedAt,
                isEdited: data.data.isEdited,
                isDeleted: data.data.isDeleted,
                reactions: data.data.reactions || []
              };
 
              return [...prev, newMsg];
            });
          } else if (data.type === 'reaction') {
            setMessages(prev => prev.map(msg => {
              if (msg.id !== data.data.messageId) return msg;

              if (data.data.action === 'add') {
                const alreadyExists = msg.reactions?.some(
                  r => r.emoji === data.data.emoji && r.userId === data.data.userId
                );
                
                if (alreadyExists) {
                  return msg;
                }

                return {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []),
                    {
                      id: new Date().getTime(),
                      messageId: data.data.messageId,
                      userId: data.data.userId,
                      username: data.data.username,
                      emoji: data.data.emoji,
                      createdAt: new Date().toISOString()
                    }
                  ]
                };
              } else if (data.data.action === 'remove') {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(
                    r => !(r.emoji === data.data.emoji && r.userId === data.data.userId)
                  )
                };
              }
              return msg;
            }));
          } else if (data.type === 'edit') {
            setMessages((prev) => prev.map((msg) => {
              if (msg.id !== data.data.id) return msg;

              return {
                ...msg,
                content: data.data.content,
                updatedAt: data.data.updatedAt,
                isEdited: true,
              };
            }));
          } else if (data.type === 'delete') {
            setMessages((prev) => prev.filter((msg) => msg.id !== data.data.messageId));
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch {
          setError('Received an invalid chat message');
        }
      };

      ws.current.onerror = () => {
        setError('WebSocket connection failed');
      };
    } catch {
      setError('Failed to connect to chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLeagueId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const messageContent = newMessage;

      // Send via WebSocket if connected
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'message', content: messageContent }));
        setNewMessage('');
        setMentionDropdownOpen(false);
        setError('');
      } else {
        // Fallback to HTTP POST
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/league-chat/${selectedLeagueId}/message`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: messageContent }),
          }
        );

        if (res.ok) {
          setNewMessage('');
          setMentionDropdownOpen(false);
          setError('');
          
          // Reload messages for HTTP fallback
          const historyRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/league-chat/${selectedLeagueId}/history?limit=50&offset=0`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setMessages(historyData.messages);
          }
        } else {
          setError('Failed to send message');
        }
      }
    } catch {
      setError('Failed to send message');
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditingMessageContent(message.content || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  const handleSaveEdit = async (messageId) => {
    const trimmed = editingMessageContent.trim();
    if (!trimmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'edit',
          messageId,
          content: trimmed,
        }));
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/league-chat/message/${messageId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: trimmed }),
        });

        if (!res.ok) {
          throw new Error('Failed to edit message');
        }

        const edited = await res.json();
        setMessages((prev) => prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            content: edited.content,
            updatedAt: edited.updatedAt,
            isEdited: true,
          };
        }));
      }

      handleCancelEdit();
      setError('');
    } catch {
      setError('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'delete',
          messageId,
        }));
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/league-chat/message/${messageId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to delete message');
        }

        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }

      setError('');
    } catch {
      setError('Failed to delete message');
    }
  };

  const getMentionCandidates = () => {
    const uniqueNames = new Set(
      Object.values(userProfiles)
        .filter(Boolean)
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    );

    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b));
  };

  const filteredMentionCandidates = getMentionCandidates().filter((name) =>
    normalizeUsername(name).includes(normalizeUsername(mentionQuery))
  );

  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    const caretPos = e.target.selectionStart ?? value.length;

    setNewMessage(value);

    const mentionToken = extractMentionQuery(value, caretPos);
    if (mentionToken) {
      setMentionDropdownOpen(true);
      setMentionQuery(mentionToken.query);
      setMentionRange(mentionToken);
    } else {
      setMentionDropdownOpen(false);
      setMentionQuery('');
      setMentionRange(null);
    }
  };

  const handleMentionSelect = (username) => {
    if (!mentionRange) return;

    const mentionText = `@${username}`;
    const before = newMessage.slice(0, mentionRange.start);
    const after = newMessage.slice(mentionRange.end);

    let nextMessage = `${before}${mentionText}`;
    if (!after.startsWith(' ')) {
      nextMessage += ' ';
    }
    nextMessage += after;

    setNewMessage(nextMessage);
    setMentionDropdownOpen(false);
    setMentionQuery('');
    setMentionRange(null);

    requestAnimationFrame(() => {
      if (!messageInputRef.current) return;
      const newCaretPos = before.length + mentionText.length + 1;
      messageInputRef.current.focus();
      messageInputRef.current.setSelectionRange(newCaretPos, newCaretPos);
    });
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      const userReaction = message?.reactions?.find(
        r => r.emoji === emoji && r.userId === signedInUserId
      );

      const action = userReaction ? 'remove' : 'add';

      // Send via WebSocket if available
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'reaction',
          messageId: messageId,
          emoji: emoji,
          action: action
        }));
      } else {
        // Fallback to HTTP
        const endpoint = userReaction
          ? `${import.meta.env.VITE_API_URL}/api/league-chat/message/${messageId}/reaction?emoji=${encodeURIComponent(emoji)}`
          : `${import.meta.env.VITE_API_URL}/api/league-chat/message/${messageId}/reaction`;

        const method = userReaction ? 'DELETE' : 'POST';
        const res = await fetch(endpoint, {
          method: method,
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: method === 'POST' ? JSON.stringify({ emoji }) : undefined,
        });

        if (!res.ok) {
          setError('Failed to add reaction');
        }
      }
    } catch {
      setError('Failed to toggle reaction');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Leagues List */}
        <div className="w-64 bg-base-200 rounded-lg p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MessageCircle size={20} />
            League Chats
          </h2>

          {leagues.length === 0 ? (
            <p className="text-base-content/60 text-sm">No leagues yet</p>
          ) : (
            <div className="space-y-2">
              {leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(league.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedLeagueId === league.id
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-300 hover:bg-base-300/80 text-base-content'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{league.name}</p>
                  <p className="text-xs opacity-75">Members: {league.memberCount}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-base-200 rounded-lg flex flex-col overflow-hidden">
          {selectedLeagueId ? (
            <>
              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-base-content/60">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`${
                        msg.senderUserId === signedInUserId
                          ? 'flex justify-end'
                          : 'flex justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderUserId === signedInUserId
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-300 text-base-content'
                        } ${
                          doesMessageMentionUser(msg.content, currentUsername)
                            ? 'ring-2 ring-warning ring-offset-1 ring-offset-base-200'
                            : ''
                        }`}
                      >
                        {msg.senderUserId !== signedInUserId && (
                          <p className="text-xs font-semibold opacity-75 mb-1">
                            {msg.senderUsername}
                          </p>
                        )}
                        {editingMessageId === msg.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingMessageContent}
                              onChange={(e) => setEditingMessageContent(e.target.value)}
                              className="input input-bordered input-xs w-full"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleCancelEdit()}
                                className="btn btn-ghost btn-xs"
                                type="button"
                                title="Cancel edit"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="btn btn-primary btn-xs"
                                type="button"
                                disabled={!editingMessageContent.trim()}
                                title="Save edit"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm break-words">
                            {renderMessageWithMentions(msg.content)}
                          </p>
                        )}
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.isEdited ? ' (edited)' : ''}
                        </p>
                      </div>
                      <div className="flex items-end gap-1 ml-2">
                        {msg.senderUserId === signedInUserId && editingMessageId !== msg.id && (
                          <>
                            <button
                              onClick={() => handleStartEdit(msg)}
                              className="btn btn-ghost btn-xs"
                              title="Edit message"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="btn btn-ghost btn-xs"
                              title="Delete message"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {/* Group reactions by emoji */}
                            {Object.entries(
                              msg.reactions.reduce((acc, reaction) => {
                                if (!acc[reaction.emoji]) {
                                  acc[reaction.emoji] = [];
                                }
                                acc[reaction.emoji].push(reaction.username || reaction.userId);
                                return acc;
                              }, {})
                            ).map(([emoji, usernames]) => {
                              const uniqueUsernames = [...new Set(usernames)];
                              const userReacted = msg.reactions.some(
                                r => r.emoji === emoji && r.userId === signedInUserId
                              );
                              
                              return (
                                <div
                                  key={emoji}
                                  className="tooltip tooltip-top"
                                  data-tip={uniqueUsernames.join(', ')}
                                >
                                  <button
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`text-sm px-2 py-0.5 rounded transition-all ${
                                      userReacted
                                        ? 'bg-primary/30 hover:bg-primary/40'
                                        : 'hover:bg-base-100/30'
                                    }`}
                                  >
                                    {emoji} {uniqueUsernames.length}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Emoji Picker */}
                        <div className="relative group">
                          <button
                            onClick={() => setReactionPickerMessageId(
                              reactionPickerMessageId === msg.id ? null : msg.id
                            )}
                            className="btn btn-ghost btn-xs"
                            title="Add reaction"
                          >
                            +😊
                          </button>
                          
                          {reactionPickerMessageId === msg.id && (
                            <div className={`absolute bottom-10 bg-base-100 border border-base-300 rounded-lg p-2 flex flex-wrap gap-2 w-64 z-50 shadow-lg ${
                              msg.senderUserId === signedInUserId ? 'right-0' : 'left-0'
                            }`}>
                              {EMOJI_OPTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    handleToggleReaction(msg.id, emoji);
                                    setReactionPickerMessageId(null);
                                  }}
                                  className="text-2xl hover:scale-125 hover:bg-base-200 rounded p-1 transition-transform cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-base-300 p-4">
                {error && (
                  <div className="alert alert-error mb-3 py-2">
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleMessageInputChange}
                      onBlur={() => {
                        setTimeout(() => setMentionDropdownOpen(false), 120);
                      }}
                      onFocus={() => {
                        if (mentionRange) {
                          setMentionDropdownOpen(true);
                        }
                      }}
                      placeholder="Type a message... Use @username to mention"
                      className="input input-bordered flex-1 input-sm w-full"
                    />
                    {mentionDropdownOpen && filteredMentionCandidates.length > 0 && (
                      <div className="absolute bottom-10 left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto">
                        {filteredMentionCandidates.slice(0, 8).map((username) => (
                          <button
                            key={username}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-base-200 text-sm"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleMentionSelect(username)}
                          >
                            @{username}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!newMessage.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-base-content/60">
              <p>Select a league to chat</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeagueChats;

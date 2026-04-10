import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { MessageCircle, Send, Reply } from 'lucide-react';
import Layout from '../components/Layout';

const LeagueChats = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [signedInUserId, setSignedInUserId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const ws = useRef(null);
  const messagesContainerRef = useRef(null);

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
        console.error('Error initializing chat:', err);
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
          console.error('Failed to load chat history');
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
      } catch (err) {
        console.error('Error loading chat history:', err);
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
      
      console.log('Attempting to connect to:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✓ WebSocket connected successfully');
        console.log('WebSocket ready state:', ws.current.readyState);
      };

      ws.current.onmessage = (event) => {
        console.log('📨 Raw message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Parsed message:', data);
          
          if (data.type === 'message') {
            const senderUsername = data.data.senderUsername || 'Unknown';
            console.log('💬 Adding new message from:', senderUsername);
            
            setUserProfiles(prev => ({
              ...prev,
              [data.data.senderUserId]: senderUsername
            }));
            
            // Check if message already exists to avoid duplicates
            setMessages(prev => {
              const messageExists = prev.some(m => m.id === data.data.id);
              if (messageExists) {
                console.log('⚠️ Message already exists, skipping:', data.data.id);
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
              
              console.log('✓ New message added:', newMsg);
              console.log('Message content check - ID:', newMsg.id, 'Content length:', newMsg.content?.length, 'Content value:', newMsg.content);
              return [...prev, newMsg];
            });
          } else if (data.type === 'reaction') {
            console.log('😊 Reaction update:', data.data);
            
            setMessages(prev => prev.map(msg => {
              if (msg.id !== data.data.messageId) return msg;

              if (data.data.action === 'add') {
                const alreadyExists = msg.reactions?.some(
                  r => r.emoji === data.data.emoji && r.userId === data.data.userId
                );
                
                if (alreadyExists) {
                  console.log('⚠️ Reaction already exists');
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
          } else if (data.type === 'error') {
            console.error('❌ Chat error:', data.message);
            setError(data.message);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err, 'Raw data:', event.data);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection failed');
      };

      ws.current.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
      };
    } catch (err) {
      console.error('❌ Error connecting to WebSocket:', err);
      setError('Failed to connect to chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLeagueId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const messageContent = newMessage;

      console.log('📤 Sending message:', messageContent);
      console.log('📊 WebSocket state:', ws.current?.readyState, 'OPEN=', WebSocket.OPEN);

      // Send via WebSocket if connected
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('✓ Sending via WebSocket...');
        ws.current.send(JSON.stringify({ type: 'message', content: messageContent }));
        setNewMessage('');
        setError('');
      } else {
        console.log('⚠️ WebSocket not ready, using HTTP fallback...');
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
          console.log('✓ Message sent via HTTP');
          setNewMessage('');
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
          console.error('❌ HTTP message failed:', res.status);
          setError('Failed to send message');
        }
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError('Failed to send message');
    }
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
        console.log(`📤 Sending reaction via WebSocket: messageId=${messageId}, emoji=${emoji}, action=${action}`);
        ws.current.send(JSON.stringify({
          type: 'reaction',
          messageId: messageId,
          emoji: emoji,
          action: action
        }));
      } else {
        // Fallback to HTTP
        console.log(`📤 WebSocket not ready, using HTTP fallback for reaction`);
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
          console.error('❌ HTTP reaction failed:', res.status);
          setError('Failed to add reaction');
        }
      }
    } catch (err) {
      console.error('❌ Error toggling reaction:', err);
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
                        }`}
                      >
                        {msg.senderUserId !== signedInUserId && (
                          <p className="text-xs font-semibold opacity-75 mb-1">
                            {msg.senderUsername}
                          </p>
                        )}
                        <p className="text-sm">
                          {msg.content || '[Empty message]'}
                        </p>
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-end gap-1 ml-2">
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
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input input-bordered flex-1 input-sm"
                  />
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

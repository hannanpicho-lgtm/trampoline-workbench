import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Search, Filter, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CustomerServiceManager() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.entities.CustomerServiceChat.subscribe(() => {
      loadData();
    });
    
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesData, usersData] = await Promise.all([
        base44.entities.CustomerServiceChat.list('-created_date', 500),
        base44.entities.AppUser.list('-created_date', 500)
      ]);
      setMessages(messagesData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedUserId) return;

    setSending(true);
    try {
      await base44.entities.CustomerServiceChat.create({
        userId: selectedUserId,
        message: replyText,
        isFromUser: false,
        isRead: false,
        status: 'replied'
      });

      // Update status of user's messages to replied
      const userMessages = messages.filter(m => m.userId === selectedUserId && m.isFromUser && m.status === 'pending');
      for (const msg of userMessages) {
        await base44.entities.CustomerServiceChat.update(msg.id, { status: 'replied' });
      }

      // Notify user
      try {
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (selectedUser) {
          const appUser = await base44.entities.AppUser.get(selectedUserId);
          const userAccount = await base44.entities.User.filter({ email: appUser.created_by });
          if (userAccount.length > 0) {
            await base44.entities.Notification.create({
              userId: userAccount[0].id,
              type: 'customer_message',
              title: '💬 Support Team Replied',
              message: replyText.substring(0, 100) + (replyText.length > 100 ? '...' : ''),
              priority: 'high',
              read: false
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to notify user:', notifError);
      }

      setReplyText('');
      toast.success('✅ Reply sent to customer!');
      loadData();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleMarkResolved = async (userId) => {
    try {
      const userMessages = messages.filter(m => m.userId === userId);
      for (const msg of userMessages) {
        await base44.entities.CustomerServiceChat.update(msg.id, { status: 'resolved' });
      }
      toast.success('Conversation marked as resolved');
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await base44.entities.CustomerServiceChat.update(messageId, { isRead: true });
      loadData();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // Group messages by user
  const userConversations = users.map(user => {
    const userMessages = messages.filter(m => m.userId === user.id);
    const unreadCount = userMessages.filter(m => m.isFromUser && !m.isRead).length;
    const lastMessage = userMessages[0];
    const status = userMessages.find(m => m.status === 'pending') ? 'pending' : 
                   userMessages.find(m => m.status === 'replied') ? 'replied' : 'resolved';
    
    return {
      user,
      messages: userMessages,
      unreadCount,
      lastMessage,
      status
    };
  }).filter(conv => conv.messages.length > 0);

  // Filter conversations
  const filteredConversations = userConversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user.created_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort by last message date
  filteredConversations.sort((a, b) => 
      new Date(b.lastMessage?.created_date).getTime() - new Date(a.lastMessage?.created_date).getTime()
    );

  const selectedConversation = userConversations.find(c => c.user.id === selectedUserId);

  if (loading) {
    return <div className="text-center py-12">Loading conversations...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[700px] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Customer Service
          </h2>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="replied">Replied</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <button
              key={conv.user.id}
              type="button"
              onClick={() => {
                setSelectedUserId(conv.user.id);
                // Mark unread messages as read
                conv.messages
                  .filter(m => m.isFromUser && !m.isRead)
                  .forEach(m => handleMarkRead(m.id));
              }}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                selectedUserId === conv.user.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {conv.user.phone || conv.user.created_by}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                {conv.lastMessage?.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(conv.lastMessage?.created_date).toLocaleTimeString()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  conv.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                  conv.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {conv.status}
                </span>
              </div>
            </button>
          ))}

          {filteredConversations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.user.phone || 'User'}
                </h3>
                <p className="text-sm text-gray-600">{selectedConversation.user.created_by}</p>
                <p className="text-xs text-gray-500">
                  VIP: {selectedConversation.user.vipLevel} • Balance: ${(selectedConversation.user.balance || 0).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleMarkResolved(selectedUserId)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                Mark Resolved
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConversation.messages.slice().reverse().map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isFromUser ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.isFromUser
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.isFromUser ? 'text-gray-500' : 'text-blue-100'}`}>
                      {new Date(msg.created_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type your reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
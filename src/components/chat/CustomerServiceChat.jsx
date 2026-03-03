import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Upload, Bot, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";

export default function CustomerServiceChat({ currentUser, initialRequest = null, onNavigate = null, onClose = null, isModal = false }) {
  const [isOpen, setIsOpen] = useState(isModal);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ((isOpen || isModal) && currentUser) {
      loadMessages();
    }
  }, [isOpen, isModal, currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = backendClient.entities.CustomerServiceChat.subscribe((event) => {
      if (event.type === "create" && event.data.userId === currentUser.id) {
        setMessages(prev => [...prev, event.data]);
        
        if (!event.data.isFromUser && !isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    return unsubscribe;
  }, [currentUser, isOpen]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length === 0) return;

      const msgs = await backendClient.entities.CustomerServiceChat.filter(
        { userId: appUserData[0].id },
        "created_date",
        100
      );
      setMessages(msgs);
      setUnreadCount(0);

      if (initialRequest && msgs.length === 0 && !welcomeSent) {
        sendWelcomeMessage(appUserData[0].id);
      }
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendWelcomeMessage = async (userId) => {
    try {
      const welcomeMsg = "Welcome! 👋 How can we help you today?\n\n📌 Press 1 for Task Reset\n📌 Press 2 for Withdrawal\n📌 Press 3 for Deposit";

      await backendClient.entities.CustomerServiceChat.create({
        userId: userId,
        message: welcomeMsg,
        isFromUser: false,
        status: "replied"
      });

      setWelcomeSent(true);
      await loadMessages();
    } catch (error) {
      console.error("Failed to send welcome message", error);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const result = await backendClient.integrations.Core.UploadFile({ file });
        uploadedFiles.push({
          name: file.name,
          url: result.file_url,
          type: file.type
        });
      }
      setAttachedFiles([...attachedFiles, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} file(s) attached`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return;
    if (sending) return;

    setSending(true);
    try {
      const appUserData = await backendClient.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length === 0) {
        toast.error("User data not found");
        return;
      }

      const messageText = newMessage.trim();
      const files = [...attachedFiles];

      // Try AI first if enabled and no files
      if (aiMode && !files.length && messageText) {
        try {
          const aiResponse = await backendClient.functions.invoke('aiSupportAssistant', {
            message: messageText,
            userId: appUserData[0].id,
            conversationHistory: messages.slice(-10)
          });

          if (aiResponse.data?.success) {
            // Save user message
            await backendClient.entities.CustomerServiceChat.create({
              userId: appUserData[0].id,
              message: messageText,
              isFromUser: true,
              status: "pending"
            });

            // Save AI response
            let responseText = aiResponse.data.aiResponse;
            
            if (aiResponse.data.needsHumanAgent) {
              responseText += "\n\n🔄 This seems complex. Would you like to speak with a human agent? Click the button in the header to switch.";
            }

            if (aiResponse.data.suggestedActions?.length > 0) {
              responseText += "\n\n💡 Quick actions:\n" + aiResponse.data.suggestedActions.map(a => `• ${a}`).join('\n');
            }

            await backendClient.entities.CustomerServiceChat.create({
              userId: appUserData[0].id,
              message: responseText,
              isFromUser: false,
              status: "replied",
              metadata: { isAI: true }
            });

            setNewMessage("");
            toast.success("✅ Message sent!");
            return;
          }
        } catch (aiError) {
          console.error("AI failed, falling back to human agent", aiError);
        }
      }

      // Regular message (human agent or with files)
      let fullMessage = messageText;
      if (files.length > 0) {
        fullMessage += "\n\n📎 Attachments:\n" + files.map(f => `${f.name}: ${f.url}`).join('\n');
      }

      const chatMessage = await backendClient.entities.CustomerServiceChat.create({
        userId: appUserData[0].id,
        message: fullMessage,
        isFromUser: true,
        status: "pending"
      });

      // Notify admins - create notification for all admin users
      try {
        const adminUsers = await backendClient.entities.User.filter({ role: 'admin' });
        for (const admin of adminUsers) {
          await backendClient.entities.Notification.create({
            userId: admin.id,
            type: 'customer_message',
            title: '💬 New Customer Message',
            message: `${appUserData[0].phone || currentUser.email}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
            priority: 'high',
            read: false
          });
        }
      } catch (notifError) {
        console.error('Failed to notify admins:', notifError);
      }

      setNewMessage("");
      setAttachedFiles([]);
      toast.success("✅ Message sent to support team!");

      // Handle quick selection
      const userInput = messageText.toLowerCase();
      if (userInput === "1") {
        toast.info("Redirecting to Task Reset...");
        setTimeout(() => onNavigate?.("tasks"), 1500);
      } else if (userInput === "2" || userInput === "3") {
        toast.info("Redirecting...");
        setTimeout(() => onNavigate?.("my"), 1500);
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen && !isModal) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-20 w-14 h-14 bg-amber-700 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-800 transition-colors"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  const containerClass = isModal 
    ? "bg-white w-full max-w-2xl rounded-2xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden"
    : "fixed bottom-24 right-4 z-50 w-80 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {aiMode ? <Bot className="w-4 h-4 text-white" /> : <MessageCircle className="w-4 h-4 text-white" />}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Customer Service</div>
            <div className="text-white/80 text-xs">{aiMode ? "AI Assistant • Instant" : "Human Agent"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiMode(!aiMode)}
            className="px-2 py-1 text-[10px] bg-white/20 hover:bg-white/30 rounded transition-colors text-white"
            title={aiMode ? "Switch to human agent" : "Switch to AI assistant"}
          >
            {aiMode ? "👤" : "🤖"}
          </button>
          <button
            type="button"
            onClick={() => isModal ? onClose?.() : setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div className="text-gray-900 font-medium mb-1">Start a conversation</div>
            <div className="text-gray-500 text-sm">{aiMode ? "Ask AI anything" : "Chat with our team"}</div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isAI = msg.metadata?.isAI;
              const hasFiles = msg.message.includes('📎 Attachments:');
              const cleanMessage = hasFiles ? msg.message.split('📎 Attachments:')[0].trim() : msg.message;
              
              return (
                <div key={msg.id || idx} className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.isFromUser ? "flex-row-reverse" : ""}`}>
                    {!msg.isFromUser && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        isAI ? "bg-purple-100" : "bg-amber-100"
                      }`}>
                        {isAI ? <Bot className="w-3 h-3 text-purple-600" /> : <UserIcon className="w-3 h-3 text-amber-600" />}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.isFromUser
                          ? "bg-amber-600 text-white rounded-br-md"
                          : isAI
                          ? "bg-purple-50 text-gray-900 border border-purple-200 rounded-bl-md"
                          : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {isAI && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-600 mb-1 font-medium">
                          <Bot className="w-3 h-3" />
                          AI
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap break-words">{cleanMessage}</div>
                      {hasFiles && (
                        <div className="mt-1 pt-1 border-t border-current/20 text-xs opacity-70">
                          📎 Files attached
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 ${msg.isFromUser ? "text-amber-100" : isAI ? "text-purple-400" : "text-gray-400"}`}>
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                <span className="text-[10px] text-gray-700 truncate max-w-[100px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Attach file"
          >
            {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={aiMode ? "Ask AI anything..." : "Type your message..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            rows={2}
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={(!newMessage.trim() && attachedFiles.length === 0) || sending}
            className="px-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
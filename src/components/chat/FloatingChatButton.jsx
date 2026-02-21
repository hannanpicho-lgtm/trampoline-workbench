import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import CustomerServiceChat from "./CustomerServiceChat";

export default function FloatingChatButton({ currentUser }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!showChat && (
        <button
          type="button"
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Contact Support"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl h-[85vh] sm:h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600">
              <h2 className="text-lg font-bold text-white">Customer Support</h2>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CustomerServiceChat currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
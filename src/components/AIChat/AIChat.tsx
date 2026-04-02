import { useState, useRef, useEffect } from "react"
import { AIIcon } from "@/assets/svg/Misc"
import styles from "./AIChat.module.scss"
import { motion, AnimatePresence } from "framer-motion"
import { chatSocket, initializeChatSocket, disconnectChatSocket } from "@/services/chatSocket"
import { useAuthStore } from "@/store/useAuthStore"

interface AIChatProps {
    projectId?: string;
    tabId?: string | null;
}

const AIChat = ({ projectId, tabId }: AIChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const { user, chatSessionId } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const chatId = chatSessionId || user?._id || 'anonymous';

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (!isOpen) {
            isFirstRender.current = true;
            return;
        }

        initializeChatSocket(user?._id || 'anonymous');
        
        chatSocket.emit("join", chatId);

        const handleHistory = (history: any[]) => {
            console.log("Chat history received:", history);
            if (history && history.length > 0) {
                setChatHistory(history);
            } else {
                setChatHistory([{ role: 'ai', content: "Hello! I'm your AI Energy Assistant. How can I help you today?" }]);
            }
        };

        const handleStream = (data: { type: string, content: any }) => {
            if (data.type === 'text') {
                setChatHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'ai' && lastMessage.isStreaming) {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, content: lastMessage.content + data.content }
                        ];
                    } else {
                        return [...prev, { role: 'ai', content: data.content, isStreaming: true }];
                    }
                });
            } else if (data.type === 'tool') {
                console.log("Tool data received:", data.content);
            }
        };

        const handleDone = () => {
            setIsLoading(false);
            setChatHistory(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'ai' && lastMessage.isStreaming) {
                    return [...prev.slice(0, -1), { ...lastMessage, isStreaming: false }];
                }
                return prev;
            });
        };

        chatSocket.on("history", handleHistory);
        chatSocket.on("stream", handleStream);
        chatSocket.on("done", handleDone);

        return () => {
            chatSocket.off("history", handleHistory);
            chatSocket.off("stream", handleStream);
            chatSocket.off("done", handleDone);
            disconnectChatSocket();
        };
    }, [isOpen, chatId]);

    // Independent effect for scrolling
    useEffect(() => {
        if (isOpen) {
            if (isFirstRender.current) {
                const timer = setTimeout(() => {
                    scrollToBottom("auto");
                    isFirstRender.current = false;
                }, 100);
                return () => clearTimeout(timer);
            } else {
                scrollToBottom("smooth");
            }
        }
    }, [chatHistory, isOpen]);

    const handleSend = () => {
        if (!message.trim() || isLoading) return;
        
        setIsLoading(true);
        const userMsg = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMsg]);
        
        chatSocket.emit("message", {
            chatId,
            message: message,
            context: { 
                userId: user?._id,
                projectId: projectId,
                tabId: tabId
            }
        });
        
        setMessage("");
    };

    return (
        <div className={styles["AIChat-container"]}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className={styles["chat-window"]}
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className={styles["chat-header"]}>
                            <div className={styles["ai-info"]}>
                                <div className={styles["ai-avatar"]}>
                                    <AIIcon />
                                </div>
                                <div className={styles["ai-status"]}>
                                    <h3>Plixy</h3>
                                    <span>Online</span>
                                </div>
                            </div>
                            <button className={styles["close-btn"]} onClick={() => setIsOpen(false)}>✕</button>
                        </div>

                        <div className={styles["messages-container"]}>
                            {chatHistory.map((chat, idx) => (
                                <div key={idx} className={`${styles["message"]} ${styles[chat.role]}`}>
                                    <div className={styles["bubble"]}>
                                        {chat.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className={styles["input-area"]}>
                            <input 
                                type="text" 
                                placeholder={isLoading ? "AI is thinking..." : "Ask Plixy..."}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button 
                                className={`${styles["send-btn"]} ${isLoading ? styles.loading : ""}`} 
                                onClick={handleSend}
                                disabled={isLoading || !message.trim()}
                            >
                                <span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg></span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className={styles["chat-btn"]} 
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <label htmlFor="AI">AI</label>
                <div className={styles["icon"]}><AIIcon /></div>
            </motion.div>
        </div>
    )
}
export default AIChat;
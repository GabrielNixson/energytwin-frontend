import { useState, useRef, useEffect } from "react"
import { AIIcon } from "@/assets/svg/Misc"
import styles from "./AIChat.module.scss"
import { motion, AnimatePresence } from "framer-motion"

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', content: "Hello! I'm your AI Energy Assistant. How can I help you today?" }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (isOpen) {
            if (isFirstRender.current) {
                // Initial scroll when opening - make it instant to avoid "fast scroll" look
                // Use a tiny timeout to ensure the DOM has updated and element is visible
                const timer = setTimeout(() => {
                    scrollToBottom("auto");
                    isFirstRender.current = false;
                }, 100);
                return () => clearTimeout(timer);
            } else {
                // Subsequent scrolls (new messages) - keep them smooth
                scrollToBottom("smooth");
            }
        } else {
            // Reset when closed so next time it's "first render" again
            isFirstRender.current = true;
        }
    }, [chatHistory, isOpen]);

    const handleSend = () => {
        if (!message.trim()) return;
        
        const newHistory = [...chatHistory, { role: 'user', content: message }];
        setChatHistory(newHistory);
        setMessage("");
        
        // Mock AI response
        setTimeout(() => {
            setChatHistory(prev => [...prev, { 
                role: 'ai', 
                content: "I'm analyzing your building's energy footprint. Based on current trends, we can reduce consumption by 12% by optimizing the HVAC schedule." 
            }]);
        }, 1000);
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
                                    <h3>Energy AI</h3>
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
                                placeholder="Ask about energy data..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button className={styles["send-btn"]} onClick={handleSend}>
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
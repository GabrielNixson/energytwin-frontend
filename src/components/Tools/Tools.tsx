import { useState, useEffect, useRef, useMemo } from "react"
import { CircleIcon, CustomIcon, DrawIcon, LineIcon, RectangleIcon } from "@/assets/svg/Tools"
import { useUIStore } from "@/store/useUIStore"
import styles from "./Tools.module.scss"

const Tools = () => {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const { selectedSubOption, setSelectedSubOption } = useUIStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const tools = useMemo(() => [
        {
            label: "Draw", 
            icon: DrawIcon, 
            options: [
                { label: "line", icon: LineIcon },
                { label: "rectangle", icon: RectangleIcon },
                { label: "circle", icon: CircleIcon },
                { label: "polygon", icon: CustomIcon }
            ]
        }
    ], []);

    // Handle outer click to close sub-menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveTool(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToolClick = (toolLabel: string) => {
        if (activeTool === toolLabel) {
            setActiveTool(null);
        } else {
            setActiveTool(toolLabel);
        }
    };

    const handleSubOptionClick = (optionLabel: string) => {
        if (selectedSubOption === optionLabel) {
            setSelectedSubOption(null);
        } else {
            setSelectedSubOption(optionLabel);
        }
        setActiveTool(null); // Close main menu after selection
    };

    return (
        <div className={styles["tools-container"]} ref={containerRef}>
            <div className={styles["tools-wrapper"]}>
                {tools.map((tool) => {
                    // Determine which icon to display for the main button
                    // If a sub-option is selected, use its icon. Else use the default tool icon.
                    const displayIcon = () => {
                        if (selectedSubOption && tool.options) {
                            const option = tool.options.find(o => o.label === selectedSubOption);
                            if (option) return <option.icon />;
                        }
                        return <tool.icon />;
                    };

                    return (
                        <div key={tool.label} className={styles["tool-item-group"]}>
                            {/* Sub-menu (Options) */}
                            {tool.options && activeTool === tool.label && (
                                <div className={styles["sub-menu"]}>
                                    {tool.options.map((option) => (
                                        <button 
                                            key={option.label} 
                                            className={`${styles["sub-tool-button"]} ${selectedSubOption === option.label ? styles.active : ""}`}
                                            onClick={() => handleSubOptionClick(option.label)}
                                        >
                                            <div className={styles.icon}>
                                                <option.icon />
                                            </div>
                                            <div className={styles.label}>{option.label}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Tool Button */}
                            <button 
                                className={`${styles["tool-button"]} ${activeTool === tool.label ? styles.active : ""}`}
                                onClick={() => handleToolClick(tool.label)}
                            >
                                <div className={styles.icon}>
                                    {displayIcon()}
                                </div>
                                <div className={styles.label}>{selectedSubOption || tool.label}</div>
                                
                                {tool.options && (
                                    <div className={`${styles["chevron"]} ${activeTool === tool.label ? styles.open : ""}`}>
                                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                            <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default Tools
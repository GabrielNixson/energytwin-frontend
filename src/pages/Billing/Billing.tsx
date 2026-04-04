import React, { useState } from "react"
import styles from "./Billing.module.scss"
import { motion } from "framer-motion"
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal"

interface BillingData {
    bill_start_date: string
    bill_end_date: string
    peak_hour_duration: string
    night_hour_duration: string
    peak_hour_price: number
    night_hour_deduction_price: number
    KVA_capacity: number
    per_unit_price: number
    tax_structure: {
        type: "percentage" | "fixed"
        value: number
    }
}

const Billing: React.FC = () => {
    const [formData, setFormData] = useState<BillingData>({
        bill_start_date: "2026-02-19",
        bill_end_date: "2026-03-19",
        peak_hour_duration: "09:00-18:00",
        night_hour_duration: "22:00-06:00",
        peak_hour_price: 1.73,
        night_hour_deduction_price: 0.345,
        KVA_capacity: 100,
        per_unit_price: 6.9,
        tax_structure: {
            type: "percentage",
            value: 18
        }
    })

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    const handleChange = (name: string, value: string | number) => {
        if (name === "tax_type") {
            setFormData(prev => ({
                ...prev,
                tax_structure: { ...prev.tax_structure, type: value as "percentage" | "fixed" }
            }))
        } else if (name === "tax_value") {
            setFormData(prev => ({
                ...prev,
                tax_structure: { ...prev.tax_structure, value: Number(value) || 0 }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: typeof value === "string" && !isNaN(Number(value)) && name !== "peak_hour_duration" && name !== "night_hour_duration" ? Number(value) : value
            }))
        }
    }

    const handleSave = () => {
        console.log("Saving Billing Data:", formData)
        setIsSuccessModalOpen(true)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6, staggerChildren: 0.08 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    }

    // Minimal Icons as SVGs
    const Icons = {
        Cycle: () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ),
        Clock: () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        ),
        Pricing: () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        ),
        Zap: () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        )
    }

    return (
        <motion.div 
            className={styles["billing-container"]}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className={styles["page-header"]}>
                <motion.h1 variants={itemVariants}>Billing Settings</motion.h1>
                <motion.p className={styles["subtitle"]} variants={itemVariants}>
                    Configure your billing cycles and regional tariffs.
                </motion.p>
            </div>

            <div className={styles["content-layout"]}>
                <div className={styles["form-grid"]}>
                    {/* Billing Cycle Section */}
                    <motion.section className={styles["section-card"]} variants={itemVariants}>
                        <div className={styles["section-header"]}>
                            <Icons.Cycle />
                            <h2>Billing Cycle</h2>
                        </div>
                        <div className={styles["input-row"]}>
                            <div className={styles["input-box"]}>
                                <label>Starts</label>
                                <input 
                                    type="date" 
                                    value={formData.bill_start_date}
                                    onChange={(e) => handleChange("bill_start_date", e.target.value)}
                                />
                            </div>
                            <div className={styles["divider"]}></div>
                            <div className={styles["input-box"]}>
                                <label>Ends</label>
                                <input 
                                    type="date" 
                                    value={formData.bill_end_date}
                                    onChange={(e) => handleChange("bill_end_date", e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* Tariff Durations Section */}
                    <motion.section className={styles["section-card"]} variants={itemVariants}>
                        <div className={styles["section-header"]}>
                            <Icons.Clock />
                            <h2>Operation Hours</h2>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Peak Hours</label>
                            <input 
                                type="text" 
                                placeholder="09:00 - 18:00"
                                value={formData.peak_hour_duration}
                                onChange={(e) => handleChange("peak_hour_duration", e.target.value)}
                            />
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Night Hours</label>
                            <input 
                                type="text" 
                                placeholder="22:00 - 06:00"
                                value={formData.night_hour_duration}
                                onChange={(e) => handleChange("night_hour_duration", e.target.value)}
                            />
                        </div>
                    </motion.section>

                    {/* Pricing Metrics Section */}
                    <motion.section className={styles["section-card"]} variants={itemVariants}>
                        <div className={styles["section-header"]}>
                            <Icons.Pricing />
                            <h2>Pricing & Rates</h2>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Peak Hour Price</label>
                            <div className={styles["number-input-wrapper"]}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.peak_hour_price}
                                    onChange={(e) => handleChange("peak_hour_price", e.target.value)}
                                />
                                <span className={styles["unit-label"]}>$/unit</span>
                            </div>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Night Hour Deduction</label>
                            <div className={styles["number-input-wrapper"]}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.night_hour_deduction_price}
                                    onChange={(e) => handleChange("night_hour_deduction_price", e.target.value)}
                                />
                                <span className={styles["unit-label"]}>$/unit</span>
                            </div>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Standard Rate</label>
                            <div className={styles["number-input-wrapper"]}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.per_unit_price}
                                    onChange={(e) => handleChange("per_unit_price", e.target.value)}
                                />
                                <span className={styles["unit-label"]}>$/kWh</span>
                            </div>
                        </div>
                    </motion.section>

                    {/* Capacity & Tax Section */}
                    <motion.section className={styles["section-card"]} variants={itemVariants}>
                        <div className={styles["section-header"]}>
                            <Icons.Zap />
                            <h2>Infrastructure & Tax</h2>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>KVA Capacity</label>
                            <div className={styles["number-input-wrapper"]}>
                                <input 
                                    type="number" 
                                    value={formData.KVA_capacity}
                                    onChange={(e) => handleChange("KVA_capacity", e.target.value)}
                                />
                                <span className={styles["unit-label"]}>KVA</span>
                            </div>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Tax Model</label>
                            <div className={styles["toggle-selector"]}>
                                <button 
                                    className={formData.tax_structure.type === "percentage" ? styles["active"] : ""}
                                    onClick={() => handleChange("tax_type", "percentage")}
                                >
                                    Percentage
                                </button>
                                <button 
                                    className={formData.tax_structure.type === "fixed" ? styles["active"] : ""}
                                    onClick={() => handleChange("tax_type", "fixed")}
                                >
                                    Fixed
                                </button>
                            </div>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Tax Value</label>
                            <div className={styles["number-input-wrapper"]}>
                                <input 
                                    type="number" 
                                    value={formData.tax_structure.value}
                                    onChange={(e) => handleChange("tax_value", e.target.value)}
                                />
                                <span className={styles["unit-label"]}>
                                    {formData.tax_structure.type === 'percentage' ? '%' : '$'}
                                </span>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>

            <motion.div className={styles["footer-actions"]} variants={itemVariants}>
                <button className={styles["btn-secondary"]} onClick={() => window.location.reload()}>
                    Discard Changes
                </button>
                <button className={styles["btn-primary"]} onClick={handleSave}>
                    Save All Changes
                </button>
            </motion.div>

            <ConfirmModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                onConfirm={() => setIsSuccessModalOpen(false)}
                title="Success"
                message="Configuration Saved Successfully!"
                confirmText="Okay"
                type="info"
            />
        </motion.div>
    )
}

export default Billing
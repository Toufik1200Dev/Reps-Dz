import React from 'react';
import { motion } from 'framer-motion';

const announcements = [
    "High quality materials and perfect service",
    "After-Sales Guarantee",
    "Fast Shipping"
];

const AnnouncementBar = () => {
    return (
        <div className="bg-black text-[#FFD700] py-2 overflow-hidden relative z-50">
            <div className="flex justify-center items-center min-h-[40px]">
                {/* Mobile View - Sliding Text */}
                <div className="md:hidden w-full overflow-hidden whitespace-nowrap">
                    <motion.div
                        className="inline-block"
                        animate={{ x: [300, -300] }}
                        transition={{
                            repeat: Infinity,
                            duration: 10,
                            ease: "linear"
                        }}
                    >
                        <span className="mx-4 text-xs font-bold tracking-wider uppercase text-[#FFD700]">
                            {announcements.join(" • ")}
                        </span>
                    </motion.div>
                </div>

                {/* Desktop View - Static Centered */}
                <div className="hidden md:flex gap-8 items-center justify-center text-xs font-bold tracking-widest uppercase text-[#FFD700]">
                    {announcements.map((text, index) => (
                        <React.Fragment key={index}>
                            <span className="whitespace-nowrap">{text}</span>
                            {index < announcements.length - 1 && (
                                <span className="text-secondary">•</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBar;

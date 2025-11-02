"use client";
import { motion } from "framer-motion";

export default function Loading({label = "Cargando..."}: {label?: string}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center 
                 bg-black/30 backdrop-blur-md pointer-events-auto"
    >
      <div className="flex flex-col items-center gap-4 text-white drop-shadow-md">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white" />
        <p className="text-sm font-medium animate-pulse">{label}</p>
      </div>
    </motion.div>
  );
}

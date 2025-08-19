"use client";

import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Header from "@/components/landing/Header";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-surface dark:bg-surface pt-20">
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <ForgotPasswordForm />
          </motion.div>
        </div>
      </div>
    </>
  );
}

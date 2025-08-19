"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ForgotPasswordFormProps {
  className?: string;
}

export default function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual password reset logic
      console.log('Password reset for:', email);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      setIsEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement resend logic
      console.log('Resending password reset for:', email);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={cn("w-full max-w-md mx-auto", className)}
      >
        <Card className="bg-surface/50 backdrop-blur-sm border-surface shadow-card">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight text-surface">
              Check your email
            </CardTitle>
            <CardDescription className="text-surface-muted">
              We've sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-surface-muted">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full h-11 border-surface text-surface hover:bg-surface-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  </motion.div>
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Sending...' : 'Resend email'}
              </Button>

              <div className="pt-4 border-t border-surface">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("w-full max-w-md mx-auto", className)}
    >
      <Card className="bg-surface/50 backdrop-blur-sm border-surface shadow-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-surface">
            Forgot your password?
          </CardTitle>
          <CardDescription className="text-surface-muted">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-surface">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-surface-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-surface border-surface focus:border-surface-accent"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  </motion.div>
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Sending reset link...' : 'Send reset link'}
              </Button>
            </div>

            {/* Back to Sign In Link */}
            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

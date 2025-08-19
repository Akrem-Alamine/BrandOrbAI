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
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleLogo } from '@/components/ui/google-logo';
import Link from 'next/link';

interface SignInFormProps {
  className?: string;
}

export default function SignInForm({ className }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual sign-in logic
      console.log('Sign in with:', { email, password });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      // TODO: Implement Google OAuth
      console.log('Sign in with Google');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate OAuth flow
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("w-full max-w-md mx-auto", className)}
    >
      <Card className="bg-background/80 backdrop-blur-sm border-border shadow-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg"
            >
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSignIn}>
            <div className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background border-border focus:border-accent"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-background border-border focus:border-accent"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
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
                ) : null}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-border text-foreground hover:bg-muted"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  </motion.div>
                ) : (
                  <GoogleLogo className="mr-2" size={16} />
                )}
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleLogo } from '@/components/ui/google-logo';
import Link from 'next/link';

interface SignUpFormProps {
  className?: string;
}

export default function SignUpForm({ className }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const criteria = [
      { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
      { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
      { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
      { label: 'Contains number', test: (p: string) => /\d/.test(p) },
      { label: 'Contains special character', test: (p: string) => /[!@#$%^&*]/.test(p) },
    ];

    return criteria.map(criterion => ({
      ...criterion,
      met: criterion.test(password)
    }));
  };

  const passwordCriteria = getPasswordStrength(password);
  const passwordStrength = passwordCriteria.filter(c => c.met).length;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (passwordStrength < 3) {
      setError("Please create a stronger password");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual sign-up logic
      console.log('Sign up with:', { fullName, email, password });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Redirect to onboarding on success
      window.location.href = '/onboarding';
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      // TODO: Implement Google OAuth
      console.log('Sign up with Google');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate OAuth flow
      
      // Redirect to onboarding on success
      window.location.href = '/onboarding';
    } catch (error) {
      console.error('Google sign up error:', error);
      setError('Google sign up failed');
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
      <Card className="bg-surface/50 backdrop-blur-sm border-surface shadow-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-surface">
            Create your account
          </CardTitle>
          <CardDescription className="text-surface-muted">
            Get started with your business planning journey
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

          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              {/* Full Name Field */}
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-surface">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-surface-muted" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-surface border-surface focus:border-surface-accent"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-surface border-surface focus:border-surface-accent"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-surface">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-surface-muted" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-surface border-surface focus:border-surface-accent"
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
                      <EyeOff className="h-4 w-4 text-surface-muted" />
                    ) : (
                      <Eye className="h-4 w-4 text-surface-muted" />
                    )}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength
                              ? passwordStrength < 3
                                ? 'bg-red-500'
                                : passwordStrength < 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-surface-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {passwordCriteria.map((criterion, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-xs ${
                            criterion.met ? 'text-green-600' : 'text-surface-muted'
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              criterion.met ? 'text-green-600' : 'text-surface-muted'
                            }`}
                          />
                          {criterion.label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-surface">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-surface-muted" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-surface border-surface focus:border-surface-accent"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-surface-muted" />
                    ) : (
                      <Eye className="h-4 w-4 text-surface-muted" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Passwords don't match
                  </div>
                )}
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
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-surface" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-surface-muted">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign Up */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-surface text-surface hover:bg-surface-hover"
                onClick={handleGoogleSignUp}
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

            {/* Sign In Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-surface-muted">Already have an account? </span>
              <Link
                href="/signin"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

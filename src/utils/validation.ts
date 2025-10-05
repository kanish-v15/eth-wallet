import { z } from 'zod';
import { ethers } from 'ethers';

// Email validation schema
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation schema with strength requirements
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Username validation schema
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .trim()
  .min(1, 'Address is required')
  .refine((address) => {
    try {
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  }, 'Invalid Ethereum address');

// Transaction amount validation
export const amountSchema = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Amount must be greater than 0')
  .refine((val) => {
    const num = parseFloat(val);
    // Check for reasonable decimal places (max 18 for ETH)
    const decimalPlaces = (val.split('.')[1] || '').length;
    return decimalPlaces <= 18;
  }, 'Too many decimal places');

// Mnemonic phrase validation
export const mnemonicSchema = z
  .string()
  .trim()
  .refine((phrase) => {
    const words = phrase.split(' ').filter(w => w.length > 0);
    return words.length === 12 || words.length === 24;
  }, 'Mnemonic must be 12 or 24 words')
  .refine((phrase) => {
    try {
      const words = phrase.split(' ').filter(w => w.length > 0);
      // Check that all words are lowercase and contain only letters
      return words.every(word => /^[a-z]+$/.test(word));
    } catch {
      return false;
    }
  }, 'Mnemonic words must contain only lowercase letters');

// Signup form validation
export const signupFormSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login form validation
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Send transaction validation
export const sendTransactionSchema = z.object({
  recipient: ethereumAddressSchema,
  amount: amountSchema,
});

// Helper function to get validation error message
export const getValidationError = (error: z.ZodError): string => {
  return error.errors[0]?.message || 'Validation failed';
};

// Email validation utilities for registration form
export const validateEmail = (email: string): boolean => {
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional validations
  const localPart = email.split('@')[0];
  const domain = email.split('@')[1];

  // Check length constraints
  if (email.length > 254 || localPart.length > 64 || domain.length > 253) {
    return false;
  }

  // Check for disposable email domains (basic list)
  const disposableDomains = [
    '10minutemail.com',
    'temp-mail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'yopmail.com',
    'maildrop.cc',
    'tempail.com',
    'dispostable.com',
  ];

  if (disposableDomains.some((disposable) => domain.toLowerCase().includes(disposable))) {
    return false;
  }

  // Check for role-based emails
  const roleBasedPrefixes = ['admin', 'support', 'info', 'contact', 'help', 'noreply'];

  if (
    roleBasedPrefixes.some(
      (prefix) => localPart.toLowerCase().startsWith(prefix + '@') || localPart.toLowerCase() === prefix,
    )
  ) {
    return false;
  }

  return true;
};

export const validateFullName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-Z\s\-'\.]+$/.test(trimmed);
};

export const validateRegistrationForm = (
  fullName: string,
  email: string,
): {
  isValid: boolean;
  errors: {
    fullName?: string;
    email?: string;
  };
} => {
  const errors: { fullName?: string; email?: string } = {};

  if (!validateFullName(fullName)) {
    errors.fullName =
      'Full name must be 2-100 characters long and contain only letters, spaces, hyphens, apostrophes, and periods';
  }

  if (!validateEmail(email)) {
    if (!email.includes('@')) {
      errors.email = 'Email address must contain an @ symbol';
    } else if (email.length > 254) {
      errors.email = 'Email address is too long (maximum 254 characters)';
    } else if (email.split('@')[0].length > 64) {
      errors.email = 'Email username is too long (maximum 64 characters before @)';
    } else if (email.split('@')[1]?.length > 253) {
      errors.email = 'Email domain is too long (maximum 253 characters after @)';
    } else {
      errors.email = 'Please enter a valid email address. Temporary/disposable emails are not allowed.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

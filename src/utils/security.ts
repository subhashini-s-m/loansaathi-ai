/**
 * Security Utilities
 * Sanitization, XSS prevention, input validation
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Create a temporary div element
  const temp = document.createElement('div');
  temp.textContent = input; // textContent is safe from XSS
  return temp.innerHTML;
}

/**
 * Sanitize user input for financial data
 */
export function sanitizeFinancialInput(input: any, type: 'number' | 'text' | 'email'): string | number {
  if (input === null || input === undefined) return type === 'number' ? 0 : '';

  switch (type) {
    case 'number': {
      const num = parseFloat(String(input).replace(/[^\d.-]/g, ''));
      return isNaN(num) ? 0 : Math.max(0, num); // Ensure non-negative
    }

    case 'email': {
      const sanitized = String(input)
        .toLowerCase()
        .trim()
        .replace(/[<>\"']/g, '');
      // Basic email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized) ? sanitized : '';
    }

    case 'text':
    default: {
      return String(input)
        .trim()
        .slice(0, 1000) // Limit length
        .replace(/[<>\"']/g, ''); // Remove dangerous chars
    }
  }
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Escape special characters for safe HTML display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>\"']/g, char => map[char]);
}

/**
 * Validate loan amount range
 */
export function validateLoanAmount(amount: number): { valid: boolean; min: number; max: number } {
  const min = 50000; // ₹50k minimum
  const max = 50000000; // ₹5 crore maximum
  return {
    valid: amount >= min && amount <= max,
    min,
    max,
  };
}

/**
 * Validate credit score range
 */
export function validateCreditScore(score: number): boolean {
  return score >= 300 && score <= 900;
}

/**
 * Validate age range for loan eligibility
 */
export function validateAge(age: number): { valid: boolean; min: number; max: number } {
  const min = 18;
  const max = 75;
  return {
    valid: age >= min && age <= max,
    min,
    max,
  };
}

/**
 * Rate limiting - track requests per user
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number = 60000; // 1 minute
  private maxRequests: number = 20; // 20 requests per minute

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }

  reset(userId?: string): void {
    if (userId) {
      this.requests.delete(userId);
    } else {
      this.requests.clear();
    }
  }

  getRemainingRequests(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    const now = Date.now();
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun >= delayMs) {
      fn(...args);
      lastRun = now;
    }
  };
}

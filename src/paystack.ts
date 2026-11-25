import { CoursePackageId, PaymentPlanId } from './types';

export const PAYSTACK_PUBLIC_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
  'pk_test_faa0137f297bce27350ed777177efd6ce2b82f23';

export const PAYSTACK_INLINE_SCRIPT_URL = 'https://js.paystack.co/v2/inline.js';

export const PAYSTACK_KOBO_AMOUNTS = {
  full_beginner_100: 6500000, // ₦65,000
  full_beginner_75: 4875000, // ₦48,750
  certificate_only: 1300000, // ₦13,000
  balance_25: 1625000, // ₦16,250
} as const;

export interface PaystackTransactionResult {
  reference: string;
  trxref?: string;
  status?: string;
  message?: string;
  trans?: string;
  channel?: string;
}

interface PaystackPopInstance {
  newTransaction: (options: {
    key: string;
    email: string;
    amount: number;
    currency: 'NGN';
    ref: string;
    onSuccess: (transaction: PaystackTransactionResult) => void;
    onCancel: () => void;
    onError?: (error: { message?: string }) => void;
  }) => void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

export function getExpectedKoboAmount(params: {
  packageId: CoursePackageId;
  paymentPlan: PaymentPlanId;
  isBalancePayment: boolean;
}): number {
  if (params.isBalancePayment) {
    return PAYSTACK_KOBO_AMOUNTS.balance_25;
  }
  if (params.packageId === 'certificate_only') {
    return PAYSTACK_KOBO_AMOUNTS.certificate_only;
  }
  return params.paymentPlan === 'deposit_75'
    ? PAYSTACK_KOBO_AMOUNTS.full_beginner_75
    : PAYSTACK_KOBO_AMOUNTS.full_beginner_100;
}

let paystackScriptPromise: Promise<void> | null = null;

export function loadPaystackInlineJs(): Promise<void> {
  if (typeof window !== 'undefined' && window.PaystackPop) {
    return Promise.resolve();
  }
  if (paystackScriptPromise) {
    return paystackScriptPromise;
  }

  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PAYSTACK_INLINE_SCRIPT_URL}"]`
    );
    if (existingScript) {
      if (window.PaystackPop) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => {
          paystackScriptPromise = null;
          reject(new Error('Failed to load Paystack InlineJS v2 checkout script.'));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.PaystackPop) {
        resolve();
      } else {
        paystackScriptPromise = null;
        reject(new Error('Paystack InlineJS loaded without PaystackPop constructor.'));
      }
    };
    script.onerror = () => {
      paystackScriptPromise = null;
      reject(
        new Error(
          'Unable to load Paystack checkout. Please check your internet connection and retry.'
        )
      );
    };
    document.head.appendChild(script);
  });

  return paystackScriptPromise;
}

export async function launchPaystackCheckout(options: {
  studentId: string;
  email: string;
  amountKobo: number;
  onSuccess: (transaction: PaystackTransactionResult) => Promise<void> | void;
  onCancel: () => void;
  onError?: (errorMessage: string) => void;
}): Promise<string> {
  await loadPaystackInlineJs();

  if (!window.PaystackPop) {
    throw new Error('Paystack checkout could not be initialized in this browser.');
  }

  const ref = `FDS-${options.studentId}-${Date.now()}`;
  const paystack = new window.PaystackPop();

  paystack.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: options.email.trim(),
    amount: options.amountKobo,
    currency: 'NGN',
    ref,
    onSuccess: (transaction) => {
      void options.onSuccess({
        ...transaction,
        reference: transaction?.reference || transaction?.trxref || ref,
      });
    },
    onCancel: () => {
      options.onCancel();
    },
    onError: (err) => {
      options.onError?.(err?.message || 'Paystack checkout encountered an error.');
    },
  });

  return ref;
}

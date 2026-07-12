'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BuyPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string | null;
}

export function BuyPassModal({ isOpen, onClose, onSuccess, userId }: BuyPassModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('geohome_session_id');
    if (stored) {
      setPhoneNumber('');
    }
  }, [isOpen]);

  const getSessionId = () => {
    if (typeof window === 'undefined') return `guest-${Date.now()}`;
    let sessionId = window.localStorage.getItem('geohome_session_id');
    if (!sessionId) {
      sessionId = globalThis.crypto?.randomUUID?.() || `guest-${Date.now()}`;
      window.localStorage.setItem('geohome_session_id', sessionId);
    }
    return sessionId;
  };

  const pollForPass = async (sessionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = window.setInterval(async () => {
      attempts += 1;
      const { data, error } = await supabase.rpc('has_active_pass', {
        user_id: userId || null,
        session_id: sessionId,
      });

      if (error) {
        console.error('Failed to poll pass status:', error);
        return;
      }

      if (data === true) {
        window.clearInterval(interval);
        setLoading(false);
        setStatus('success');
        onSuccess();
        onClose();
      } else if (attempts >= maxAttempts) {
        window.clearInterval(interval);
        setLoading(false);
        setStatus('error');
        setErrorMessage('The pass confirmation timed out. Please refresh and try again if needed.');
      }
    }, 1000);
  };

  const handleBuyPass = async () => {
    setLoading(true);
    setStatus('pending');
    setErrorMessage('');

    const sessionId = getSessionId();
    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    try {
      const response = await fetch('/api/daraja/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalizedPhone || '254700000000',
          amount: 200,
          userId: userId || null,
          sessionId,
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || 'Unable to create your pass right now.');
      }

      if (result?.bypass || result?.status === 'bypassed') {
        setStatus('success');
        setLoading(false);
        onSuccess();
        onClose();
        return;
      }

      setStatus('success');
      setLoading(false);
      pollForPass(sessionId);
    } catch (error) {
      console.error('Pass purchase error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-semibold text-[#1E3A4D]">Unlock full map access</h2>
        <p className="mt-2 text-sm text-[#5B6F82]">
          For just <span className="font-semibold text-[#2C6E5C]">KES 200</span>, you can unlock full property details, names, and contact actions.
        </p>

        <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#1F2937]">
          <div className="font-semibold">What you get</div>
          <ul className="mt-2 space-y-2">
            <li>• Full map zoom and property detail access</li>
            <li>• Full property names and contact links</li>
            <li>• Access for {userId ? '4 days' : '3 days'}</li>
          </ul>
        </div>

        {process.env.NEXT_PUBLIC_BYPASS_PAYMENT === 'true' ? (
          <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            🔓 Bypass mode is active, so your pass is created instantly.
          </div>
        ) : null}

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-[#1F2937]">M-Pesa phone number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="254700000000"
            className="w-full rounded-lg border border-[#BECCD9] px-3 py-3 text-sm outline-none focus:border-[#2C6E5C]"
            disabled={loading}
          />
        </div>

        {status === 'pending' ? (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">⏳ Processing your pass request...</div>
        ) : null}

        {status === 'success' ? (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">✅ Your pass is active.</div>
        ) : null}

        {status === 'error' ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">❌ {errorMessage}</div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-[#BECCD9] px-4 py-2 text-sm font-semibold text-[#1E3A4D] transition hover:bg-[#F9FAFB]"
          >
            Close
          </button>
          <button
            onClick={handleBuyPass}
            disabled={loading}
            className="rounded-full bg-[#2C6E5C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245b4c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Buy Pass – KES 200'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecipientConsentPage } from '@/pages/share/RecipientConsentPage';
import { ToastProvider } from '@/contexts/ToastContext';
import { sessionService } from '@/services/sessionService';

describe('RecipientConsentPage Privacy Verification', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders consent terms and does NOT start tracking without explicit click', async () => {
    const watchPositionMock = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn(),
        watchPosition: watchPositionMock,
        clearWatch: vi.fn(),
      },
      writable: true,
    });

    // Create session in demo store
    const created = await sessionService.createSession('owner-123', 'Jordan Lee', {
      title: 'Airport Terminal 3 Meetup',
      description: 'Waiting at arrivals level 2',
    });

    render(
      <MemoryRouter initialEntries={[`/share/${created.rawToken}`]}>
        <ToastProvider>
          <Routes>
            <Route path="/share/:token" element={<RecipientConsentPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    // Verify session title and owner name render
    await waitFor(() => {
      expect(screen.getByText('Airport Terminal 3 Meetup')).toBeDefined();
    });

    // Crucial Privacy Test: watchPosition MUST NOT be called simply because the page loaded!
    expect(watchPositionMock).not.toHaveBeenCalled();

    // Verify Consent button is visible
    const shareButton = screen.getByRole('button', { name: /share my live location/i });
    expect(shareButton).toBeDefined();

    // Click Consent button
    fireEvent.click(shareButton);

    // After clicking consent, watchPosition should now be called
    await waitFor(() => {
      expect(watchPositionMock).toHaveBeenCalled();
    });
  });
});

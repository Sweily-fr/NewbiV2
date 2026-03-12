import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dependencies
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/src/hooks/useCompanyInfoGuard', () => ({
  isCompanyInfoComplete: vi.fn(),
}));

// Mock UI components to simplify rendering
vi.mock('@/src/components/ui/skeleton', () => ({
  Skeleton: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock('@/src/components/ui/card', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  CardDescription: ({ children }) => <p>{children}</p>,
  CardHeader: ({ children, className }) => <div className={className}>{children}</div>,
  CardTitle: ({ children }) => <h3>{children}</h3>,
}));

vi.mock('@/src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }) => open ? <div data-testid="alert-dialog" role="dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }) => <button data-testid="alert-action" onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }) => <button data-testid="alert-cancel" onClick={onClick}>{children}</button>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children, className }) => <p className={className}>{children}</p>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock('lucide-react', () => ({
  Building2: () => <span data-testid="icon-building2" />,
  AlertCircle: () => <span data-testid="icon-alert" />,
  Settings: () => <span data-testid="icon-settings" />,
}));

import { CompanyInfoGuard } from '@/src/components/guards/CompanyInfoGuard';
import { useAuth } from '@/src/hooks/useAuth';
import { isCompanyInfoComplete } from '@/src/hooks/useCompanyInfoGuard';

describe('CompanyInfoGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while auth is loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      session: null,
    });

    render(
      <CompanyInfoGuard>
        <div data-testid="protected-content">Protected</div>
      </CompanyInfoGuard>
    );

    expect(screen.getByText("Vérification des informations d'entreprise")).toBeTruthy();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows children when company info is complete', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        company: {
          companyName: 'Test Co',
          companyEmail: 'test@test.com',
          addressStreet: '1 rue',
          addressCity: 'Paris',
          addressZipCode: '75001',
          addressCountry: 'France',
          siret: '12345678901234',
          legalForm: 'SARL',
        },
      },
      session: {},
    });
    isCompanyInfoComplete.mockReturnValue(true);

    render(
      <CompanyInfoGuard>
        <div data-testid="protected-content">Protected</div>
      </CompanyInfoGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    // No alert dialog should be shown
    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('shows alert dialog when company info is incomplete', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        company: { companyName: 'Test Co' }, // incomplete
      },
      session: {},
    });
    isCompanyInfoComplete.mockReturnValue(false);

    render(
      <CompanyInfoGuard>
        <div data-testid="protected-content">Protected</div>
      </CompanyInfoGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Configuration requise')).toBeInTheDocument();
    // Children should still be rendered (content is shown, alert just informs)
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('navigates to redirect path when "Configurer maintenant" is clicked', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { company: {} },
      session: {},
    });
    isCompanyInfoComplete.mockReturnValue(false);

    render(
      <CompanyInfoGuard redirectPath="/dashboard/settings">
        <div>Protected</div>
      </CompanyInfoGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    });

    const configButton = screen.getByTestId('alert-action');
    await userEvent.click(configButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('dismisses alert dialog when cancel is clicked without redirecting', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { company: {} },
      session: {},
    });
    isCompanyInfoComplete.mockReturnValue(false);

    render(
      <CompanyInfoGuard>
        <div data-testid="protected-content">Protected</div>
      </CompanyInfoGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('alert-cancel');
    await userEvent.click(cancelButton);

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
    // Content remains visible
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children without alert when user is not authenticated', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
    });

    render(
      <CompanyInfoGuard>
        <div data-testid="protected-content">Protected</div>
      </CompanyInfoGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    // No alert dialog for unauthenticated users (guard allows access for now)
    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });
});

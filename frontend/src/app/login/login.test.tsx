import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './page';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
}));

describe('LoginPage', () => {
    it('renders the login form correctly', () => {
        render(<LoginPage />);

        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits the form and calls NextAuth signIn', async () => {
        const mockPush = jest.fn();
        const mockRefresh = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            refresh: mockRefresh
        });

        (signIn as jest.Mock).mockResolvedValue({ error: null });

        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText('you@company.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'admin@ottobon.com' } });
        fireEvent.change(passwordInput, { target: { value: 'supersecret' } });
        fireEvent.click(submitButton);

        expect(signIn).toHaveBeenCalledWith('credentials', {
            redirect: false,
            email: 'admin@ottobon.com',
            password: 'supersecret',
        });
    });

    it('displays an error message on invalid credentials', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

        render(<LoginPage />);

        const emailInput = screen.getByPlaceholderText('you@company.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@user.com' } });
        fireEvent.change(passwordInput, { target: { value: 'badpass' } });
        fireEvent.click(submitButton);

        // Wait for the specific error state to render
        const errorMessage = await screen.findByText('Invalid credentials');
        expect(errorMessage).toBeInTheDocument();
    });
});

import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';
import { query } from '../src/config/db';

// Mock the DB connection
jest.mock('../src/config/db', () => ({
    query: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }); // missing password

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Email and password are required');
        });

        it('should successfully register a new user', async () => {
            // Mock email check (returns empty meaning no user exists)
            (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            // Mock user count check (returns 1 meaning not the first user)
            (query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '1' }] });

            // Mock insertion
            (query as jest.Mock).mockResolvedValueOnce({
                rows: [{ id: '123', email: 'test@example.com', is_approved: false, is_admin: false }]
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com', password: 'securepassword123' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('test@example.com');
            expect(res.body.data.is_approved).toBe(false);
            expect(res.body.data.is_admin).toBe(false);
        });

        it('should auto-approve the very first user', async () => {
            // Mock email check
            (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

            // Mock user count check (returns 0 meaning first user)
            (query as jest.Mock).mockResolvedValueOnce({ rows: [{ count: '0' }] });

            // Mock insertion with auto-approval
            (query as jest.Mock).mockResolvedValueOnce({
                rows: [{ id: '123', email: 'admin@example.com', is_approved: true, is_admin: true }]
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'admin@example.com', password: 'adminpassword' });

            expect(res.status).toBe(201);
            expect(res.body.data.is_admin).toBe(true);
            expect(res.body.data.is_approved).toBe(true);
        });
    });

    describe('GET /api/auth/users/pending', () => {
        it('should return a list of unapproved users', async () => {
            const mockUsers = [
                { id: '1', email: 'pending_1@example.com', created_at: new Date().toISOString() },
                { id: '2', email: 'pending_2@example.com', created_at: new Date().toISOString() }
            ];

            (query as jest.Mock).mockResolvedValueOnce({ rows: mockUsers });

            const res = await request(app).get('/api/auth/users/pending');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].email).toBe('pending_1@example.com');
        });
    });
});

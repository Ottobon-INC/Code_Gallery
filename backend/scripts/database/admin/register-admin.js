async function registerAdmin() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@company.com',
                password: 'OttobonAdmin2026!'
            })
        });

        const data = await res.json();
        console.log('Registration Result:', data);
    } catch (err) {
        console.error('Registration failed:', err);
    }
}

registerAdmin();

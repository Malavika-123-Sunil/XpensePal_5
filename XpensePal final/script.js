// Form visibility toggles
function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showSignUp() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function showForgotPassword() {
    // TODO: Implement forgot password functionality
    alert('Forgot password functionality will be implemented soon!');
}

// Form handlers
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (email && password) {
        // TODO: Implement actual login logic
        console.log('Login attempt:', { email, password });
        window.location.href = 'dashboard.html';
    }
}

function handleSignUp(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Basic validation
    if (name && email && password) {
        // TODO: Implement actual signup logic
        console.log('Sign up attempt:', { name, email, password });
        window.location.href = 'dashboard.html';
    }
}

// Form validation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('invalid', (event) => {
        event.preventDefault();
        input.classList.add('error');
    });

    input.addEventListener('input', () => {
        input.classList.remove('error');
    });
});
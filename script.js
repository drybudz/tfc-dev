const emailInput = document.getElementById('email-input');
const signupBtn = document.getElementById('signup-btn');
const errorMessage = document.getElementById('error-message');
const modalOverlay = document.getElementById('modal-overlay');
const modalBtn = document.getElementById('modal-btn');

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function handleEmailInput() {
    const email = emailInput.value.trim();
    const isValid = validateEmail(email);

    // Clear previous errors
    errorMessage.classList.remove('show');

    if (isValid) {
        signupBtn.classList.add('show');
    } else {
        signupBtn.classList.remove('show');
    }
}

function showError(message = 'Please enter a valid email address') {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function resetAnimations() {
    // Reset logo animation
    const logo = document.querySelector('.logo');
    logo.style.animation = 'none';
    setTimeout(() => {
        logo.style.animation = 'fadeInFloat 2s ease-out forwards';
    }, 10);

    // Reset email container animation
    const emailContainer = document.querySelector('.email-container');
    emailContainer.style.animation = 'none';
    emailContainer.style.opacity = '0';
    setTimeout(() => {
        emailContainer.style.animation = 'fadeUp 0.8s ease-out 0.5s forwards';
    }, 10);

    // Reset form
    emailInput.value = '';
    errorMessage.classList.remove('show');
    signupBtn.classList.remove('show');
}

async function handleSignup() {
    const email = emailInput.value.trim();

    // Validate email format
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Disable button during submission
    signupBtn.disabled = true;
    signupBtn.textContent = 'Signing up';
    signupBtn.classList.add('signing-up');

    try {
        // 1. Generate reCAPTCHA token
        const recaptchaSiteKey = '6Lc__Q0sAAAAAFJHLTR7hi-XpfoktiiyPwTB6oPv';
        const recaptchaToken = await new Promise((resolve, reject) => {
            grecaptcha.ready(() => {
                grecaptcha.execute(recaptchaSiteKey, { action: 'submit' })
                    .then(resolve)
                    .catch(reject);
            });
        });

        // 2. Call Vercel API endpoint
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                recaptchaToken: recaptchaToken
            })
        });

        const data = await response.json();

        // 3. Handle response
        if (response.ok && data.success) {
            // Success - show modal
            modalOverlay.classList.add('show');
        } else {
            // Handle different error types
            if (data.error === 'duplicate') {
                showError('This email is already registered');
            } else if (data.message) {
                showError(data.message);
            } else if (data.error) {
                showError(data.error);
            } else {
                showError('Something went wrong. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error submitting email:', error);
        showError('Something went wrong. Please try again.');
    } finally {
        // Re-enable button
        signupBtn.disabled = false;
        signupBtn.classList.remove('signing-up');
        signupBtn.textContent = 'SIGN UP';
    }
}

function closeModal() {
    modalOverlay.classList.remove('show');
    // Reset all animations after closing modal
    setTimeout(() => {
        resetAnimations();
    }, 300);
}

// Event listeners
emailInput.addEventListener('input', handleEmailInput);

emailInput.addEventListener('blur', function() {
    const email = emailInput.value.trim();
    if (email && !validateEmail(email)) {
        showError();
    }
});

signupBtn.addEventListener('click', handleSignup);

emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (signupBtn.classList.contains('show')) {
            handleSignup();
        } else if (emailInput.value.trim()) {
            showError();
        }
    }
});

modalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});


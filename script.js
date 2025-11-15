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
    emailInput.classList.remove('error');
    errorMessage.classList.remove('show');

    if (isValid) {
        signupBtn.classList.add('show');
    } else {
        signupBtn.classList.remove('show');
    }
}

function showError() {
    emailInput.classList.add('error');
    errorMessage.classList.add('show');
}

function resetAnimations() {
    // Reset logo animation
    const logo = document.querySelector('.logo');
    logo.style.animation = 'none';
    setTimeout(() => {
        logo.style.animation = 'fadeInFloat 2s ease-out forwards';
    }, 10);

    // Reset form
    emailInput.value = '';
    emailInput.classList.remove('error');
    errorMessage.classList.remove('show');
    signupBtn.classList.remove('show');
}

function handleSignup() {
    const email = emailInput.value.trim();

    // Validate email format
    if (!validateEmail(email)) {
        showError();
        return;
    }

    // TODO: Connect to Google Sheets API via Google Apps Script endpoint
    // When ready, replace this with actual API call
    // Example:
    // fetch('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email: email })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         modalOverlay.classList.add('show');
    //     } else {
    //         showError();
    //     }
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    //     showError();
    // });

    // For now, just show success modal
    modalOverlay.classList.add('show');
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


// Vercel Analytics for static HTML sites
// This will automatically work when deployed on Vercel
if (typeof window !== 'undefined') {
    // Initialize Vercel Analytics
    // The analytics will be automatically injected by Vercel when deployed
    // For local development, this won't do anything, but won't cause errors
    (function() {
        // Vercel Analytics script injection
        var vaScript = document.createElement('script');
        vaScript.src = 'https://va.vercel-scripts.com/v1/script.js';
        vaScript.defer = true;
        vaScript.setAttribute('data-debug', 'false');
        document.head.appendChild(vaScript);
    })();
}


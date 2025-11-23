// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: Supabase Dashboard > Settings > API

const SUPABASE_URL = 'https://xvgotucpsuuhjsjjmnzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2Z290dWNwc3V1aGpzamptbnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzIxMTcsImV4cCI6MjA3OTUwODExN30.8v1O8sAlAejhNZ6yo3wQgYnVysGzfYz5zwROeiwGmw4';

// Initialize Supabase client (will be set when Supabase library loads)
let supabaseClient = null;

// Function to initialize client when Supabase library is available
function initializeSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return false;
        }
    }
    return false;
}

// Wait for Supabase library to load
(function() {
    if (typeof window === 'undefined') return;
    
    function tryInitialize() {
        if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            return initializeSupabaseClient();
        }
        return false;
    }
    
    // Try immediately if library is already loaded
    if (tryInitialize()) {
        return;
    }
    
    // Wait for the library to load (check every 50ms)
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds max
    
    const checkInterval = setInterval(() => {
        attempts++;
        if (tryInitialize() || attempts >= maxAttempts) {
            clearInterval(checkInterval);
        }
    }, 50);
    
    // Also try when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitialize);
    } else {
        tryInitialize();
    }
    
    // Try on window load as well
    window.addEventListener('load', tryInitialize);
})();


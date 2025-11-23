// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://yimkfujzofljrzedpngp.supabase.co'; // e.g., https://your-project.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbWtmdWp6b2ZsanJ6ZWRwbmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTA1ODksImV4cCI6MjA3OTQ4NjU4OX0.p3339onP80q6vl8rwKMLK6LyOLhXv93VctysSTh9GLk';
// Initialize Supabase client
let supabase = null;

if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    console.warn('⚠️ Supabase library not loaded. Make sure to include the Supabase script tag.');
}

// Check if Supabase is configured
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('⚠️ Supabase credentials not configured. Please update config.js with your Supabase project credentials.');
}

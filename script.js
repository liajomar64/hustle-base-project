// Main Application JavaScript - Using Supabase

// Mobile menu toggle function
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Close mobile menu when clicking outside
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        document.addEventListener('click', function(event) {
            const nav = document.querySelector('.navbar');
            const navLinks = document.getElementById('navLinks');
            const toggle = document.querySelector('.mobile-menu-toggle');
            
            if (navLinks && navLinks.classList.contains('active')) {
                if (!nav.contains(event.target)) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
}

// Initialize Supabase client
let supabaseClientInstance = null;

function getSupabaseClient() {
    // Return cached client if available
    if (supabaseClientInstance) {
        return supabaseClientInstance;
    }
    
    // Check if client was initialized in config.js
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClientInstance = supabaseClient;
        return supabaseClientInstance;
    }
    
    // Fallback: try to create client directly
    if (typeof window !== 'undefined' && window.supabase) {
        if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && 
            SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            try {
                supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return supabaseClientInstance;
            } catch (error) {
                console.error('Error creating Supabase client:', error);
                throw new Error('Failed to create Supabase client. Please check your configuration.');
            }
        }
    }
    
    // Try to initialize from config.js if function exists
    if (typeof initializeSupabaseClient === 'function') {
        if (initializeSupabaseClient()) {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                supabaseClientInstance = supabaseClient;
                return supabaseClientInstance;
            }
        }
    }
    
    throw new Error('Supabase client not initialized. Please check your configuration in config.js and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
}

// Authentication Functions
async function signUp(data) {
    const client = getSupabaseClient();
    
    const { user, error } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                name: data.name,
                role: data.role
            },
            emailRedirectTo: window.location.origin
        }
    });

    if (error) throw error;
    
    // User profile is created automatically by trigger, but we can also create it explicitly
    if (user) {
        const { error: profileError } = await client
            .from('users')
            .insert({
                id: user.id,
                name: data.name,
                email: data.email,
                role: data.role
            });
        
        if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Error creating user profile:', profileError);
        }
    }
    
    // If email confirmation is disabled, automatically sign in the user
    if (user && !user.email_confirmed_at) {
        // Try to sign in immediately (works if email confirmation is disabled)
        try {
            const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });
            if (!signInError && signInData) {
                return signInData.user;
            }
        } catch (e) {
            // If auto-signin fails, return the user object anyway
            console.log('Auto-signin not available, user needs to confirm email or sign in manually');
        }
    }
    
    return user;
}

async function signIn(email, password) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

async function signOut() {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
}

async function getCurrentUser() {
    const client = getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// Check authentication status and update UI
async function checkAuthStatus() {
    const user = await getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileLink = document.getElementById('profileLink');
    const dashboardLink = document.getElementById('dashboardLink');

    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', signOut);
        }
        
        // Get user role from metadata or database
        const userRole = user.user_metadata?.role || await getUserRole(user.id);
        
        if (userRole === 'provider') {
            if (profileLink) profileLink.style.display = 'block';
            if (dashboardLink) {
                dashboardLink.href = 'provider-dashboard.html';
                dashboardLink.textContent = 'Dashboard';
                dashboardLink.style.display = 'block';
            }
            const browseRequestsLink = document.getElementById('browseRequestsLink');
            if (browseRequestsLink) browseRequestsLink.style.display = 'block';
        } else if (userRole === 'client') {
            if (dashboardLink) {
                dashboardLink.href = 'client-dashboard.html';
                dashboardLink.textContent = 'Dashboard';
                dashboardLink.style.display = 'block';
            }
            const postRequestLink = document.getElementById('postRequestLink');
            if (postRequestLink) postRequestLink.style.display = 'block';
        }
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (signupLink) signupLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }

    return user;
}

// Get user role from database
async function getUserRole(userId) {
    const client = getSupabaseClient();
    try {
        const { data, error } = await client
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data?.role || 'client';
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'client';
    }
}

// Provider Profile Functions
async function saveProviderProfile() {
    const user = await getCurrentUser();
    if (!user) throw new Error('You must be logged in');

    const client = getSupabaseClient();
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);

    // Upload profile photo
    let profileImgUrl = null;
    const profilePhoto = document.getElementById('profilePhoto').files[0];
    if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await client.storage
            .from('profile-photos')
            .upload(fileName, profilePhoto, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = client.storage
            .from('profile-photos')
            .getPublicUrl(fileName);
        profileImgUrl = publicUrl;
    }

    // Upload portfolio images
    const portfolioUrls = [];
    const portfolioInputs = document.querySelectorAll('.portfolio-input');
    for (let i = 0; i < portfolioInputs.length; i++) {
        const file = portfolioInputs[i].files[0];
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await client.storage
                .from('portfolio-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                console.error('Error uploading portfolio image:', uploadError);
                continue;
            }
            
            const { data: { publicUrl } } = client.storage
                .from('portfolio-images')
                .getPublicUrl(fileName);
            portfolioUrls.push(publicUrl);
        }
    }

    // Check if profile exists
    const { data: existingProfile } = await client
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const providerData = {
        user_id: user.id,
        bio: formData.get('bio'),
        skills: formData.get('skills'),
        price_range: formData.get('priceRange'),
        location: formData.get('location'),
        availability: formData.get('availability'),
        contact_link: formData.get('contactLink'),
        profile_img_url: profileImgUrl
    };

    if (existingProfile) {
        // Update existing profile
        const { error } = await client
            .from('providers')
            .update(providerData)
            .eq('id', existingProfile.id);
        
        if (error) throw error;
    } else {
        // Create new profile
        const { error } = await client
            .from('providers')
            .insert(providerData);
        
        if (error) throw error;
    }

    // Save portfolio images
    if (portfolioUrls.length > 0) {
        // Delete old portfolio images
        await client
            .from('portfolio_images')
            .delete()
            .eq('provider_id', user.id);

        // Insert new portfolio images
        const portfolioData = portfolioUrls.map(url => ({
            provider_id: user.id,
            image_url: url
        }));
        
        const { error } = await client
            .from('portfolio_images')
            .insert(portfolioData);
        
        if (error) throw error;
    }

    alert('Profile saved successfully!');
    window.location.href = 'provider-dashboard.html';
}

async function loadProviderProfile() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const client = getSupabaseClient();
    
    // Check if user is a provider
    const userRole = user.user_metadata?.role || await getUserRole(user.id);
    if (userRole !== 'provider') {
        window.location.href = 'browse.html';
        return;
    }

    // Load provider data
    const { data: provider, error: providerError } = await client
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (providerError && providerError.code !== 'PGRST116') {
        console.error('Error loading provider profile:', providerError);
        return;
    }

    if (provider) {
        // Populate form
        document.getElementById('bio').value = provider.bio || '';
        document.getElementById('skills').value = provider.skills || '';
        document.getElementById('priceRange').value = provider.price_range || '';
        document.getElementById('location').value = provider.location || '';
        document.getElementById('availability').value = provider.availability || '';
        document.getElementById('contactLink').value = provider.contact_link || '';

        // Load profile photo
        if (provider.profile_img_url) {
            document.getElementById('profilePhotoImg').src = provider.profile_img_url;
            document.getElementById('profilePhotoImg').style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
        }

        // Load portfolio images
        const { data: portfolioImages } = await client
            .from('portfolio_images')
            .select('image_url')
            .eq('provider_id', user.id)
            .limit(3);

        if (portfolioImages && portfolioImages.length > 0) {
            portfolioImages.forEach((img, index) => {
                if (index >= 3) return;
                const imgElement = document.getElementById(`portfolioImg${index}`);
                const placeholder = document.querySelector(`.portfolio-preview[data-index="${index}"] .portfolio-placeholder`);
                const removeBtn = document.querySelector(`.btn-remove[data-index="${index}"]`);
                
                if (imgElement) {
                    imgElement.src = img.image_url;
                    imgElement.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                    if (removeBtn) removeBtn.style.display = 'block';
                }
            });
        }
    }
}

// Browse Providers Functions
let allProviders = [];

async function loadProviders() {
    const grid = document.getElementById('providersGrid');
    grid.innerHTML = '<p class="loading">Loading providers...</p>';

    const client = getSupabaseClient();

    try {
        // Load providers
        const { data: providers, error: providersError } = await client
            .from('providers')
            .select('*');

        if (providersError) throw providersError;

        if (!providers || providers.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-search"></i></div>
                    <p>No providers found yet. Be the first to sign up!</p>
                </div>
            `;
            return;
        }

        // Load user info for providers
        const userIds = providers.map(p => p.user_id);
        const { data: users } = await client
            .from('users')
            .select('id, name, email')
            .in('id', userIds);

        // Map users to providers
        const userMap = {};
        if (users) {
            users.forEach(user => {
                userMap[user.id] = user;
            });
        }
        providers.forEach(provider => {
            provider.users = userMap[provider.user_id];
        });

        // Load reviews for rating calculation
        const { data: reviews } = await client
            .from('reviews')
            .select('provider_id, rating');

        // Calculate ratings for each provider
        providers.forEach(provider => {
            const providerReviews = reviews?.filter(r => r.provider_id === provider.user_id) || [];
            if (providerReviews.length > 0) {
                const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
                provider.avg_rating = Math.round(avgRating * 10) / 10;
                provider.review_count = providerReviews.length;
            } else {
                provider.avg_rating = 0;
                provider.review_count = 0;
            }
        });

        allProviders = providers;
        displayProviders(providers);
    } catch (error) {
        grid.innerHTML = `<p class="error-message">Error loading providers: ${error.message}</p>`;
    }
}

function displayProviders(providers) {
    const grid = document.getElementById('providersGrid');
    
    if (providers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-search"></i></div>
                <p>No providers match your filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = providers.map(provider => {
        const userName = provider.users?.name || 'Provider';
        const skills = provider.skills || 'Services';
        const rating = provider.avg_rating || 0;
        const reviewCount = provider.review_count || 0;
        const photo = provider.profile_img_url || 'https://via.placeholder.com/300x200?text=No+Photo';

        return `
            <div class="provider-card" onclick="showProviderDetail('${provider.user_id}')">
                <img src="${photo}" alt="${userName}" class="provider-photo" onerror="this.src='https://via.placeholder.com/300x200?text=No+Photo'">
                <div class="provider-info">
                    <h3 class="provider-name">${userName}</h3>
                    <p class="provider-skills">${skills}</p>
                    <p class="provider-location"><i class="fas fa-map-marker-alt"></i> ${provider.location || 'Location not specified'}</p>
                    <p class="provider-price">${provider.price_range || 'Price on request'}</p>
                    ${rating > 0 ? `
                        <div class="provider-rating">
                            <span class="stars">${'<i class="fas fa-star"></i>'.repeat(Math.round(rating))}</span>
                            <span>${rating.toFixed(1)} (${reviewCount})</span>
                        </div>
                    ` : '<p class="provider-rating">No reviews yet</p>'}
                    <div class="provider-actions">
                        <button class="btn btn-primary btn-view">View Profile</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterProviders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;

    let filtered = allProviders.filter(provider => {
        const matchesSearch = !searchTerm || 
            provider.users?.name?.toLowerCase().includes(searchTerm) ||
            provider.skills?.toLowerCase().includes(searchTerm) ||
            provider.bio?.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || 
            provider.skills?.toLowerCase().includes(categoryFilter.toLowerCase());

        const matchesRating = !ratingFilter || 
            (provider.avg_rating >= parseFloat(ratingFilter));

        let matchesPrice = true;
        if (priceFilter) {
            const priceRange = provider.price_range || '';
            if (priceFilter === 'low') {
                matchesPrice = priceRange.includes('$') && 
                    (parseInt(priceRange.match(/\$(\d+)/)?.[1] || 999) < 30);
            } else if (priceFilter === 'medium') {
                matchesPrice = priceRange.includes('$') && 
                    (parseInt(priceRange.match(/\$(\d+)/)?.[1] || 0) >= 30 &&
                     parseInt(priceRange.match(/\$(\d+)/)?.[1] || 999) <= 60);
            } else if (priceFilter === 'high') {
                matchesPrice = priceRange.includes('$') && 
                    (parseInt(priceRange.match(/\$(\d+)/)?.[1] || 0) > 60);
            }
        }

        return matchesSearch && matchesCategory && matchesRating && matchesPrice;
    });

    displayProviders(filtered);
}

async function showProviderDetail(providerId) {
    const client = getSupabaseClient();

    try {
        // Load provider
        const { data: providers, error: providerError } = await client
            .from('providers')
            .select('*')
            .eq('user_id', providerId)
            .single();

        if (providerError || !providers) return;

        // Load user info
        const { data: userData } = await client
            .from('users')
            .select('name, email')
            .eq('id', providerId)
            .single();

        providers.users = userData;

        // Load portfolio images
        const { data: portfolioImages } = await client
            .from('portfolio_images')
            .select('image_url')
            .eq('provider_id', providerId);

        // Load reviews
        const { data: reviewsData } = await client
            .from('reviews')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        // Load user info for reviews
        if (reviewsData && reviewsData.length > 0) {
            const reviewUserIds = reviewsData.map(r => r.client_id);
            const { data: reviewUsers } = await client
                .from('users')
                .select('id, name')
                .in('id', reviewUserIds);

            const reviewUserMap = {};
            if (reviewUsers) {
                reviewUsers.forEach(user => {
                    reviewUserMap[user.id] = user;
                });
            }
            reviewsData.forEach(review => {
                review.users = reviewUserMap[review.client_id];
            });
        }

        const reviews = reviewsData || [];
        const userName = providers.users?.name || 'Provider';
        const avgRating = reviews && reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="provider-detail">
                <div class="detail-header">
                    <img src="${providers.profile_img_url || 'https://via.placeholder.com/150?text=No+Photo'}" 
                         alt="${userName}" 
                         class="detail-photo"
                         onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
                    <div class="detail-info">
                        <h2>${userName}</h2>
                        <div class="detail-meta">
                            <p><i class="fas fa-map-marker-alt"></i> ${providers.location || 'Location not specified'}</p>
                            <p><i class="fas fa-dollar-sign"></i> ${providers.price_range || 'Price on request'}</p>
                            <p><i class="fas fa-clock"></i> ${providers.availability || 'Availability not specified'}</p>
                            ${avgRating > 0 ? `<p><i class="fas fa-star"></i> ${avgRating} (${reviews?.length || 0} reviews)</p>` : ''}
                        </div>
                    </div>
                </div>

                <div>
                    <h3>About</h3>
                    <p>${providers.bio || 'No bio provided.'}</p>
                </div>

                <div>
                    <h3>Skills & Services</h3>
                    <p>${providers.skills || 'No skills listed.'}</p>
                </div>

                ${portfolioImages && portfolioImages.length > 0 ? `
                    <div class="portfolio-section">
                        <h3>Portfolio</h3>
                        <div class="portfolio-images">
                            ${portfolioImages.map(img => `
                                <img src="${img.image_url}" alt="Portfolio">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="reviews-section">
                    <h3>Reviews (${reviews?.length || 0})</h3>
                    ${reviews && reviews.length > 0 ? reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="review-author">${review.users?.name || 'Anonymous'}</span>
                                <span class="stars">${'<i class="fas fa-star"></i>'.repeat(review.rating)}</span>
                            </div>
                            <p class="review-comment">${review.comment || 'No comment'}</p>
                            <small style="color: var(--text-secondary);">${new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                    `).join('') : '<p>No reviews yet.</p>'}
                </div>

                <div class="review-form" id="reviewFormSection">
                    <h3>Leave a Review</h3>
                    <form id="reviewForm" onsubmit="submitReview(event, '${providerId}')">
                        <div class="rating-input" id="ratingInput">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <button type="button" onclick="setRating(${i})"><i class="fas fa-star"></i></button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedRating" value="0" required>
                        <div class="form-group">
                            <textarea id="reviewComment" rows="3" placeholder="Write your review..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Review</button>
                    </form>
                </div>

                <div style="margin-top: 2rem;">
                    <a href="${getContactLink(providers.contact_link)}" 
                       class="btn btn-primary btn-large" 
                       target="_blank">
                        Contact Provider
                    </a>
                </div>
            </div>
        `;

        document.getElementById('providerModal').style.display = 'flex';
        
        // Check if user can leave review
        const user = await getCurrentUser();
        if (!user || user.id === providerId) {
            document.getElementById('reviewFormSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading provider detail:', error);
    }
}

function closeProviderModal() {
    document.getElementById('providerModal').style.display = 'none';
}

function getContactLink(contact) {
    if (!contact) return '#';
    if (contact.includes('@')) return `mailto:${contact}`;
    if (contact.includes('+') || /^\d/.test(contact)) {
        return `https://wa.me/${contact.replace(/\D/g, '')}`;
    }
    return contact;
}

let selectedRating = 0;

function setRating(rating) {
    selectedRating = rating;
    document.getElementById('selectedRating').value = rating;
    const buttons = document.querySelectorAll('#ratingInput button');
    buttons.forEach((btn, index) => {
        if (index < rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function submitReview(event, providerId) {
    event.preventDefault();
    const user = await getCurrentUser();
    if (!user) {
        alert('Please login to leave a review');
        return;
    }

    if (user.id === providerId) {
        alert('You cannot review your own profile');
        return;
    }

    const client = getSupabaseClient();
    const rating = parseInt(document.getElementById('selectedRating').value);
    const comment = document.getElementById('reviewComment').value;

    if (rating === 0) {
        alert('Please select a rating');
        return;
    }

    // Check if review already exists
    const { data: existingReview } = await client
        .from('reviews')
        .select('id')
        .eq('provider_id', providerId)
        .eq('client_id', user.id)
        .single();

    if (existingReview) {
        alert('You have already reviewed this provider');
        return;
    }

    try {
        const { error } = await client
            .from('reviews')
            .insert({
                provider_id: providerId,
                client_id: user.id,
                rating: rating,
                comment: comment
            });

        if (error) throw error;

        alert('Review submitted successfully!');
        closeProviderModal();
        loadProviders();
    } catch (error) {
        alert('Error submitting review: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('providerModal');
    if (event.target === modal) {
        closeProviderModal();
    }
}

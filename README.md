# LocalSkills - Community Micro-Jobs Platform

A modern web platform where local community members can offer small services (tutoring, cleaning, repairs, etc.) and clients can easily discover and contact them.

## Features

- 🔐 **User Authentication** - Sign up as a service provider or client
- 👤 **Provider Profiles** - Create detailed profiles with photos, skills, and portfolio
- 🔍 **Service Directory** - Browse and search for local services
- ⭐ **Reviews & Ratings** - Rate and review service providers
- 📱 **Responsive Design** - Works perfectly on all devices
- 💾 **Supabase Backend** - Secure database and file storage

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Custom CSS with Poppins font
- **Icons**: Emoji-based icons

## Project Structure

```
/public
   ├── index.html          # Landing page
   ├── browse.html         # Service directory
   ├── profile.html        # Provider profile creation/editing
   ├── signup.html         # User registration
   ├── login.html          # User login
   ├── styles.css          # All styling
   ├── script.js           # Application logic
   └── config.js           # Supabase configuration

/supabase
   └── schema.sql          # Database schema
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon key from **Settings > API**
4. **Disable Email Confirmation** (for development):
   - Go to **Authentication** → **Settings**
   - Toggle OFF **"Enable email confirmations"**
   - This allows immediate sign-in after signup

### 2. Set Up Database

1. Open **SQL Editor** in Supabase dashboard
2. Copy and paste the entire contents of `supabase/schema.sql`
3. Click **Run** to execute the schema

### 3. Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create two buckets:

   - **Bucket 1**: `profile-photos` (Public: Yes)
   - **Bucket 2**: `portfolio-images` (Public: Yes)

3. Set up storage policies (or use the SQL in schema.sql comments):
   - Allow public read access
   - Allow authenticated users to upload to their own folders

### 4. Configure Frontend

1. Open `public/config.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

### 5. Run the Application

#### Option A: Local Development

Simply open `public/index.html` in a web browser, or use a local server:

```bash
# Using Node.js
cd public
npx serve -p 5000
```

Then open `http://localhost:5000` in your browser.

#### Option B: Deploy to Static Hosting

Deploy the `public` folder to:

- **Vercel**: `vercel deploy public`
- **Netlify**: Drag and drop the `public` folder
- **GitHub Pages**: Push to repository and enable Pages
- **Supabase Storage**: Upload files and enable static hosting

## Usage Guide

### For Service Providers

1. **Sign Up**: Create an account and select "Offer Services (Provider)"
2. **Create Profile**: Fill out your profile with:
   - Profile photo
   - Bio and description
   - Skills and services offered
   - Price range
   - Location
   - Availability
   - Contact information
   - Portfolio images (up to 3)
3. **Get Discovered**: Your profile will appear in the service directory

### For Clients

1. **Sign Up**: Create an account and select "Find Services (Client)"
2. **Browse Services**: Use the directory to find providers
3. **Search & Filter**: Filter by category, rating, or price
4. **View Profiles**: Click on any provider to see full details
5. **Leave Reviews**: Rate and review providers after using their services
6. **Contact**: Use the contact button to reach out via WhatsApp or email

## Database Schema

### Tables

- **users**: User profiles with role (provider/client)
- **providers**: Service provider information
- **portfolio_images**: Provider portfolio photos
- **reviews**: Ratings and reviews from clients

### Key Features

- Row Level Security (RLS) enabled on all tables
- Automatic user profile creation on signup
- Timestamp tracking for created/updated dates
- Unique constraints to prevent duplicate reviews

## Features in Detail

### Authentication

- Email/password authentication via Supabase Auth
- Role-based access (Provider vs Client)
- Secure session management

### Provider Profiles

- Rich profile creation with multiple fields
- Image uploads (profile photo + portfolio)
- Real-time profile updates

### Service Directory

- Search by name or skill
- Filter by category, rating, price range
- Responsive card-based layout
- Average rating calculation

### Reviews System

- 5-star rating system
- Text comments
- One review per client per provider
- Providers cannot review themselves

## Customization

### Styling

Edit `public/styles.css` to customize:

- Colors (CSS variables in `:root`)
- Fonts
- Layout and spacing
- Responsive breakpoints

### Functionality

Edit `public/script.js` to modify:

- Search algorithms
- Filter logic
- UI interactions
- API calls

## Security Notes

- All database operations use Row Level Security (RLS)
- Users can only modify their own data
- File uploads are restricted to authenticated users
- Storage buckets have appropriate access policies

## Troubleshooting

### "Supabase credentials not configured"

- Make sure you've updated `config.js` with your project credentials

### "Error loading providers"

- Check that the database schema has been run
- Verify RLS policies allow SELECT operations

### "Failed to upload image"

- Ensure storage buckets are created
- Check storage bucket policies
- Verify file size limits

### "Cannot create review"

- Make sure you're logged in
- Verify you're not trying to review your own profile
- Check that you haven't already reviewed this provider

## Future Enhancements

Potential features to add:

- [ ] Messaging system between users
- [ ] Payment integration
- [ ] Booking/scheduling system
- [ ] Email notifications
- [ ] Advanced analytics for providers
- [ ] Favorites/bookmarks
- [ ] Service categories with icons
- [ ] Map integration for location-based search

## License

This project is open source and available for educational and commercial use.

## Support

For issues or questions:

- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the code comments in `script.js`
- Check browser console for error messages

## Contributing

Feel free to fork, modify, and use this project for your own community platform!

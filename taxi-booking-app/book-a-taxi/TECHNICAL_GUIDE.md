# 🛠️ Technical Implementation Guide

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 19.2.4
- **Routing**: React Router DOM 7.14.0
- **Build Tool**: Vite 8.0.4
- **HTTP Client**: Axios 1.15.0
- **Styling**: CSS3 (No CSS-in-JS library)
- **Node.js Version**: Latest (npm compatible)

### Folder Structure

```
book-a-taxi/
├── src/
│   ├── components/
│   │   ├── Navigation.jsx          (Navigation bar component)
│   │   └── Navigation.css          (Navigation styling)
│   ├── pages/
│   │   ├── Home.jsx               (Booking form page)
│   │   ├── About.jsx              (Company info page)
│   │   ├── Services.jsx           (Service offerings page)
│   │   ├── Contact.jsx            (Contact form page)
│   │   ├── Drivers.jsx            (Driver selection page)
│   │   ├── Confirmation.jsx       (Booking confirmation page)
│   │   └── Pages.css              (All pages styling)
│   ├── App.jsx                    (Main app component)
│   ├── App.css                    (Global styles)
│   ├── main.jsx                   (React entry point)
│   ├── index.css                  (Root styles)
│   └── assets/                    (Static images/assets)
├── public/                        (Static files)
├── package.json                   (Dependencies)
├── vite.config.js                 (Vite configuration)
├── eslint.config.js               (Linting rules)
└── index.html                     (HTML template)
```

---

## Component Architecture

### Component Tree

```
App
├── Navigation (Header)
└── main (Routes)
    ├── Home (/)
    ├── Services (/services)
    ├── About (/about)
    ├── Contact (/contact)
    ├── Drivers (/drivers)
    └── Confirmation (/confirmation)
```

### Component Responsibilities

#### Navigation.jsx
- **Purpose**: Display site navigation
- **Props**: None
- **State**: None  
- **Features**: 
  - Sticky header
  - Navigation links to all pages
  - Brand logo with hover effects
  - Responsive mobile menu support

#### Home.jsx
- **Purpose**: Booking form and landing page
- **Props**: None (uses Router)
- **State**: `bookingData`, `errors`
- **Features**:
  - Form state management
  - Real-time validation
  - Error display
  - Session storage
  - Features showcase

#### Drivers.jsx
- **Purpose**: Driver selection interface
- **Props**: None (uses Router)
- **State**: `bookingData`, `selectedDriver`
- **Features**:
  - Driver selection
  - Price comparison
  - Booking summary
  - Driver ratings display

#### Confirmation.jsx
- **Purpose**: Booking confirmation display
- **Props**: None (uses Router)
- **State**: `bookingData`
- **Features**:
  - Booking details display
  - Next steps guide
  - Success animation
  - New booking option

#### Services.jsx
- **Purpose**: Service tier information
- **Props**: None
- **State**: None (static content with map)
- **Features**:
  - Service cards grid
  - Pricing breakdown
  - Feature comparison
  - FAQ section

#### About.jsx
- **Purpose**: Company information
- **Props**: None
- **State**: None (static content)
- **Features**:
  - Company story
  - Values section
  - Statistics display
  - Team introduction

#### Contact.jsx
- **Purpose**: Contact form and information
- **Props**: None
- **State**: `formData`, `submitted`, `errors`
- **Features**:
  - Contact form with validation
  - Business hours
  - Social media links
  - FAQ section

---

## State Management Pattern

### Lifting State Up
```javascript
// Home.jsx
const [bookingData, setBookingData] = useState({
  pickupLocation: '',
  dropoffLocation: '',
  pickupDate: '',
  pickupTime: '',
  passengerCount: '1',
  specialRequests: '',
});

// Store in sessionStorage
sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

// Drivers.jsx retrieves it
const [bookingData, setBookingData] = useState(null);
useEffect(() => {
  const data = sessionStorage.getItem('bookingData');
  if (data) {
    setBookingData(JSON.parse(data));
  }
}, []);
```

### Form State Management Pattern
```javascript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
  // ...
});

const [errors, setErrors] = useState({});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value,
  }));
  // Clear error when user types
  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: '',
    }));
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = validateForm();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  // Process form
};
```

---

## Styling Strategy

### CSS Organization
```css
/* Global Styles (App.css) */
* { }                          /* Reset */
body { }                       /* Root */
#root { }                      /* React root */
.app-main { }                  /* Main container */
.container { }                 /* Content wrapper */

/* Component-Specific Styles (Navigation.css, Pages.css) */
.navbar { }                    /* Navigation styles */
.navigation-specific { }       /* Component-specific */
```

### Color Variables (Embedded)
```css
--primary-bg: #FFFFFF;         /* White */
--primary-text: #001F3F;       /* Navy Blue */
--primary-accent: #660022;     /* Burgundy */
--secondary-accent: #001F3F;   /* Navy Blue */
--light-bg: #EEEEEE;           /* Light Gray */
--text-secondary: #666666;     /* Gray text */
```

### Responsive Design Pattern
```css
/* Desktop First */
.element {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* Tablet */
@media (max-width: 1024px) {
  .element {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .element {
    grid-template-columns: 1fr;
  }
}
```

---

## Validation System

### Validation Pattern
```javascript
// Centralized validation function
const validateForm = () => {
  const newErrors = {};
  
  if (!value.trim()) {
    newErrors.field = 'Field is required';
  } else if (value.length < minLength) {
    newErrors.field = `Minimum ${minLength} characters`;
  } else if (!regex.test(value)) {
    newErrors.field = 'Invalid format';
  }
  
  return newErrors;
};

// Email validation
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Phone validation
const validatePhone = (phone) => {
  return /^[\d\s\-\+\(\)]+$/.test(phone) && 
         phone.replace(/\D/g, '').length >= 10;
};

// Date validation
const validateDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};
```

### Error Display Pattern
```jsx
<div className="form-group">
  <label htmlFor="field">Field Label</label>
  <input
    id="field"
    name="field"
    value={formData.field}
    onChange={handleChange}
    className={errors.field ? 'input-error' : ''}
  />
  {errors.field && (
    <span className="error-message">{errors.field}</span>
  )}
</div>
```

---

## Routing Structure

### React Router Setup
```javascript
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Navigation />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
    </Router>
  );
}
```

### Navigation Pattern
```javascript
// Using useNavigate hook
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to page
navigate('/drivers');

// Navigate with state preservation
sessionStorage.setItem('bookingData', JSON.stringify(data));
navigate('/drivers');
```

---

## Data Flow

### Booking Flow Diagram
```
1. HOME PAGE
   ├── User fills booking form
   └── Click "Find Drivers"
       └── Saves to sessionStorage
           └── Navigate to /drivers

2. DRIVERS PAGE
   ├── Retrieve booking data from sessionStorage
   ├── User selects driver
   └── Click "Confirm Selection"
       └── Combine data with driver info
           └── Save to sessionStorage
               └── Navigate to /confirmation

3. CONFIRMATION PAGE
   ├── Retrieve combined data from sessionStorage
   ├── Display booking details
   └── User options:
       ├── "View Full Details" (show JSON)
       └── "Book Another Ride" (clear storage, go home)
```

---

## Session Storage Usage

### Data Persistence Pattern
```javascript
// Save data
const bookingData = { /* ... */ };
sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

// Retrieve data
const data = sessionStorage.getItem('bookingData');
if (data) {
  setBookingData(JSON.parse(data));
}

// Clear data
sessionStorage.clear();
```

### Available Session Keys
- `bookingData`: Initial booking information
- `completeBooking`: Complete booking with driver selection

---

## CSS3 Features Used

### Gradients
```css
background: linear-gradient(135deg, #660022 0%, #001F3F 100%);
```

### Flexbox
```css
display: flex;
justify-content: space-between;
align-items: center;
gap: 20px;
```

### Grid
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 20px;
```

### Transitions
```css
transition: all 0.3s ease;
```

### Transforms
```css
transform: translateY(-5px);
transform: scale(1.1);
```

### Animations
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

animation: bounce 0.6s ease;
```

### Focus States
```css
input:focus {
  outline: none;
  border-color: #660022;
  box-shadow: 0 0 0 3px rgba(102, 0, 34, 0.1);
}
```

---

## Dependencies

### Production Dependencies
```json
{
  "axios": "^1.15.0",              // HTTP requests
  "react": "^19.2.4",              // UI library
  "react-dom": "^19.2.4",          // DOM rendering
  "react-router-dom": "^7.14.0"   // Routing
}
```

### Dev Dependencies
```json
{
  "@eslint/js": "^9.39.4",
  "@vitejs/plugin-react": "^6.0.1",
  "eslint": "^9.39.4",
  "vite": "^8.0.4"
}
```

### Version Compatibility
- Node.js: 14.0.0 or higher
- npm: 6.0.0 or higher
- ES6 syntax support required

---

## Development Commands

### Setup
```bash
npm install                  # Install dependencies
```

### Development
```bash
npm run dev                  # Start Vite dev server (http://localhost:5173)
npm run lint               # Run ESLint
```

### Production
```bash
npm run build              # Build for production
npm run preview            # Preview production build
```

---

## Extending the Application

### Adding a New Page

1. **Create new component:**
   ```javascript
   // src/pages/NewPage.jsx
   function NewPage() {
     return (
       <div className="container">
         <h1 className="heading">New Page</h1>
         {/* Content */}
       </div>
     );
   }
   export default NewPage;
   ```

2. **Import in App.jsx:**
   ```javascript
   import NewPage from './pages/NewPage';
   ```

3. **Add route:**
   ```javascript
   <Route path="/newpage" element={<NewPage />} />
   ```

4. **Add navigation link:**
   ```javascript
   <li className="nav-item">
     <Link to="/newpage" className="nav-link">New Page</Link>
   </li>
   ```

### Adding a New Component

1. **Create component file:**
   ```javascript
   // src/components/MyComponent.jsx
   function MyComponent({ prop1, prop2 }) {
     return <div>{/* Content */}</div>;
   }
   export default MyComponent;
   ```

2. **Import and use:**
   ```javascript
   import MyComponent from './components/MyComponent';
   // Use: <MyComponent prop1="value" prop2="value" />
   ```

### Adding Backend API Integration

```javascript
// Example with axios
import axios from 'axios';

// Get services
axios.get('http://localhost:3001/api/services')
  .then(response => setServices(response.data))
  .catch(error => console.error(error));

// Post booking
axios.post('http://localhost:3001/api/bookings', bookingData)
  .then(response => navigate('/confirmation'))
  .catch(error => setError(error.message));
```

---

## Performance Optimization Tips

1. **Lazy Loading**: Use React.lazy() for pages
2. **Memoization**: Use useMemo/useCallback for expensive operations
3. **Image Optimization**: Use modern formats (WebP)
4. **Code Splitting**: Leverage Vite's code splitting
5. **Caching**: Use localStorage for user preferences
6. **Minification**: Vite handles this automatically

---

## Troubleshooting

### Port Already in Use
```bash
# Windows: Find and kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5173
kill <PID>
```

### Module Not Found
- Check file paths (case-sensitive on Linux/Mac)
- Verify imports match exports
- Run `npm install` again

### Build Errors
```bash
npm run build  # See detailed errors
```

---

## Browser Support

- Chrome: 90+
- Firefox: 88+
- Safari: 14+
- Edge: 90+
- Mobile browsers: Latest versions

---

**Technical Documentation Version**: 1.0.0
**Last Updated**: April 11, 2026

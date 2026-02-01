# 🚀 3D Portfolio Website - O.F.M. Rakibul Hasan

A stunning, modern portfolio website featuring impressive 3D depth effects, glassmorphism design, and iOS-inspired aesthetics. Built with pure HTML, CSS, and JavaScript - no frameworks required.

![Portfolio Preview](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Features

### 🎨 **Stunning 3D Design**
- **True Depth Perspective**: Elements pop out toward you using `translateZ` transforms
- **Layered Shadows**: 6+ shadow layers create realistic depth perception
- **Interactive Mouse Tracking**: Cards respond to cursor position with subtle tilts
- **Depth-Based Animations**: Elements lift 50-100px forward in 3D space on hover

### 💎 **Glassmorphism UI**
- Frosted glass effect with backdrop blur
- Semi-transparent cards with subtle borders
- Gradient overlays and glow effects
- iOS-inspired clean aesthetics

### 🌈 **Visual Effects**
- **Animated Background**: Floating gradient shapes with pulse animations
- **Glowing Halos**: Radial gradients expand on hover
- **Pulsing Icons**: Brightness animations for interactive elements
- **Smooth Transitions**: 60fps animations with cubic-bezier easing

### 📱 **Fully Responsive**
- Mobile-first design approach
- Optimized for phones, tablets, and desktops
- Hamburger menu for mobile navigation
- Adaptive layouts and spacing

### 🎯 **Sections**
1. **Hero Section**: Eye-catching introduction with animated stats
2. **About Section**: Professional background and education
3. **Services Section**: Backend development offerings
4. **Tech Stack Section**: Categorized technology badges
5. **Projects Section**: Featured work showcase
6. **Contact CTA**: Call-to-action with social links
7. **Footer**: Quick links and contact information

## 🛠️ Technologies Used

- **HTML5**: Semantic markup structure
- **CSS3**: Advanced animations, transforms, and effects
- **JavaScript (ES6+)**: Interactive features and 3D effects
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (optional, for local server)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Open the website**
   
   **Option A: Direct File**
   - Simply open `index.html` in your browser

   **Option B: Local Server (Recommended)**
   ```bash
   npx serve
   ```
   Then visit `http://localhost:3000`

   **Option C: Python Server**
   ```bash
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`

## 📁 Project Structure

```
portfolio/
├── index.html          # Main HTML file
├── style.css           # Complete styling and animations
├── script.js           # Interactive JavaScript features
├── README.md           # This file
└── assets/             # Images and media (optional)
```

## 🎨 Design System

### Color Palette
- **Primary Gradient**: `#667eea → #764ba2` (Purple)
- **Secondary Gradient**: `#f093fb → #f5576c` (Pink)
- **Accent Gradient**: `#4facfe → #00f2fe` (Blue)
- **Success Gradient**: `#43e97b → #38f9d7` (Green)
- **Background**: `#0a0a0f` (Dark)

### Key CSS Variables
```css
--primary-color: #667eea;
--accent-color: #4facfe;
--bg-primary: #0a0a0f;
--glass-bg: rgba(255, 255, 255, 0.05);
--radius-lg: 24px;
```

## 🎭 3D Effects Explained

### Depth Transform
Elements use `perspective()` and `translateZ()` for true 3D depth:
```css
transform: perspective(1000px) translateZ(80px) scale(1.05);
```

### Layered Shadows
Multiple shadow layers create realistic depth:
```css
box-shadow: 
    0 2px 2px rgba(102, 126, 234, 0.2),
    0 4px 4px rgba(102, 126, 234, 0.2),
    0 8px 8px rgba(102, 126, 234, 0.2),
    0 16px 16px rgba(102, 126, 234, 0.2),
    0 32px 32px rgba(102, 126, 234, 0.2),
    0 64px 64px rgba(102, 126, 234, 0.2);
```

### Mouse Tracking
JavaScript calculates depth based on cursor distance from center:
```javascript
const depth = (1 - (distance / maxDistance)) * 20;
card.style.transform = `perspective(1000px) translateZ(${depth}px)`;
```

## 🎯 Customization Guide

### Update Personal Information

1. **Edit `index.html`**:
   - Update name, title, and bio
   - Modify education details
   - Change email and social links
   - Update project descriptions

2. **Customize Colors in `style.css`**:
   ```css
   :root {
       --primary-gradient: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
   }
   ```

3. **Add Your Photo**:
   - Add image to `assets/` folder
   - Update hero section in HTML

### Modify Sections

- **Add/Remove Services**: Edit `.services-grid` in HTML
- **Update Tech Stack**: Modify `.tech-grid` items
- **Change Projects**: Edit `.projects-grid` cards

## 📊 Performance

- **Optimized Animations**: 60fps smooth transitions
- **Debounced Scroll Events**: Reduced CPU usage
- **CSS Hardware Acceleration**: GPU-powered transforms
- **Minimal Dependencies**: Fast load times

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 (Limited support, no 3D effects)

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

## 🔧 Advanced Features

### Scroll Animations
Elements fade in as they enter viewport using Intersection Observer API.

### Parallax Background
Floating shapes move at different speeds based on scroll position.

### Dynamic Gradients
Text gradients animate with hue rotation for visual interest.

### Button Ripple Effect
Material Design-inspired ripple on button clicks.

## 📝 SEO Best Practices

- ✅ Semantic HTML5 elements
- ✅ Meta descriptions and keywords
- ✅ Proper heading hierarchy (H1-H4)
- ✅ Alt text for images (when added)
- ✅ Descriptive page title

## 🚀 Deployment

### GitHub Pages
1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select main branch
4. Your site will be live at `https://username.github.io/portfolio`

### Netlify
1. Drag and drop the `portfolio` folder to Netlify
2. Your site is live instantly!

### Vercel
```bash
npm i -g vercel
vercel
```

## 🤝 Contributing

This is a personal portfolio template. Feel free to fork and customize for your own use!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**O.F.M. Rakibul Hasan**
- Backend Developer
- BSc in CSE, Daffodil International University
- Email: rakibulhasan@gmail.com
- Facebook: [rakibulx33](https://www.facebook.com/rakibulx33)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for Inter typeface
- Inspiration from modern iOS design principles

## 📞 Support

For questions or issues, please reach out via:
- Email: rakibulhasan@gmail.com
- Facebook: [facebook.com/rakibulx33](https://www.facebook.com/rakibulx33)

---

**Made with ❤️ and ☕ by Rakibul Hasan**

*Last Updated: January 2026*

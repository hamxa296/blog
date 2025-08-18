# 🤝 GIKI Chronicles - Contributing Guide

## 🎯 **Welcome Contributors!**

Thank you for your interest in contributing to GIKI Chronicles! This guide will help you get started with contributing to our community-driven platform.

---

## 📋 **Getting Started**

### **Prerequisites**
- Basic knowledge of HTML, CSS, and JavaScript
- Familiarity with Firebase (helpful but not required)
- Git and GitHub experience
- A modern web browser
- Text editor (VS Code recommended)

### **Quick Setup**
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/blog.git
   cd blog
   ```
3. **Set up Firebase project** (see [Deployment Guide](DEPLOYMENT.md))
4. **Configure environment variables** (copy `.env.template` to `.env`)
5. **Open `index.html`** in your browser to test locally

---

## 🔧 **Development Workflow**

### **1. Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

### **2. Make Your Changes**
- Follow the coding standards below
- Test your changes thoroughly
- Ensure security best practices are followed

### **3. Commit Your Changes**
```bash
git add .
git commit -m "feat: add new feature description"
```

### **4. Push and Create Pull Request**
```bash
git push origin feature/your-feature-name
```
Then create a Pull Request on GitHub.

---

## 📝 **Coding Standards**

### **JavaScript Standards**
```javascript
// Use ES6+ features
const user = { name: 'John', age: 25 };
const { name, age } = user;

// Use async/await for promises
async function fetchUserData() {
    try {
        const response = await fetch('/api/user');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Use meaningful variable names
const isUserLoggedIn = auth.currentUser !== null;
const userProfileData = await getUserProfile(userId);

// Add JSDoc comments for functions
/**
 * Creates a new blog post
 * @param {Object} postData - The post data
 * @param {string} postData.title - Post title
 * @param {string} postData.content - Post content
 * @returns {Promise<Object>} The created post
 */
async function createPost(postData) {
    // Implementation
}
```

### **HTML Standards**
```html
<!-- Use semantic HTML5 elements -->
<main>
    <article>
        <header>
            <h1>Post Title</h1>
            <time datetime="2024-01-15">January 15, 2024</time>
        </header>
        <section>
            <p>Post content...</p>
        </section>
    </article>
</main>

<!-- Use proper accessibility attributes -->
<button aria-label="Close modal" onclick="closeModal()">
    <span aria-hidden="true">&times;</span>
</button>

<!-- Use data attributes for JavaScript hooks -->
<div data-post-id="123" data-action="edit">
    <!-- Content -->
</div>
```

### **CSS Standards**
```css
/* Use Tailwind CSS classes when possible */
.post-card {
    @apply bg-white rounded-lg shadow-md p-6;
}

/* Use BEM methodology for custom CSS */
.post-card__title {
    @apply text-xl font-bold text-gray-900;
}

.post-card__content {
    @apply text-gray-700 mt-2;
}

/* Use CSS custom properties for theming */
:root {
    --primary-color: #3b82f6;
    --secondary-color: #64748b;
}

.button--primary {
    background-color: var(--primary-color);
}
```

---

## 🛡️ **Security Guidelines**

### **Input Validation**
```javascript
// Always validate user input
function validatePostData(postData) {
    const errors = [];
    
    if (!postData.title || postData.title.trim().length < 3) {
        errors.push('Title must be at least 3 characters long');
    }
    
    if (!postData.content || postData.content.trim().length < 10) {
        errors.push('Content must be at least 10 characters long');
    }
    
    return errors;
}

// Use the input sanitizer
const sanitizedTitle = window.InputSanitizer.inputSanitizer(title, 'text');
const sanitizedContent = window.ContentSanitizer.sanitizeHTML(content, 'user');
```

### **Authentication Checks**
```javascript
// Always check authentication before sensitive operations
async function deletePost(postId) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Authentication required');
    }
    
    // Check if user is admin or post owner
    const isAdmin = await window.SecureAdmin.isAdmin(user.uid);
    const post = await getPost(postId);
    
    if (!isAdmin && post.authorId !== user.uid) {
        throw new Error('Unauthorized');
    }
    
    // Proceed with deletion
}
```

### **Error Handling**
```javascript
// Use the error handler for all errors
try {
    await createPost(postData);
} catch (error) {
    window.errorHandler.handleError(error, {
        context: 'post_creation',
        userId: user.uid,
        postData: postData
    });
}
```

---

## 🧪 **Testing Guidelines**

### **Manual Testing Checklist**
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test with different screen sizes
- [ ] Test with slow internet connection
- [ ] Test error scenarios (network failures, invalid input)
- [ ] Test accessibility (keyboard navigation, screen readers)

### **Security Testing**
- [ ] Test input validation
- [ ] Test authentication requirements
- [ ] Test authorization checks
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test file upload security

### **Performance Testing**
- [ ] Check page load times
- [ ] Test with large datasets
- [ ] Monitor memory usage
- [ ] Test real-time features
- [ ] Check image optimization

---

## 📁 **Project Structure**

### **File Organization**
```
blog/
├── index.html              # Main landing page
├── guide.html              # Freshmen guide
├── gallery.html            # Photo gallery
├── admin.html              # Admin panel
├── login.html              # Authentication
├── write.html              # Blog post creation
├── posts.html              # Blog posts listing
├── post.html               # Individual post view
├── profile.html            # User profile
├── contact.html            # Contact page
├── about.html              # About page
├── calendar.html           # Event calendar
├── browse.html             # Content browsing
├── submissions.html        # Admin submissions
├── debug-posts.html        # Debug interface
├── admin-access.html       # Secure admin access
├── freshman-guide.html     # Freshman guide
├── giki_dining_guide.html  # Dining guide
├── detail_packing_list.html # Packing list detail
├── 404.html                # Error page
├── docs/                   # Documentation
├── freshmen/               # Freshman resources
├── favicons/               # Favicon assets
├── pfps/                   # Profile pictures
├── assets/                 # Static assets
│   └── fonts/              # Custom fonts
├── src/                    # Source code
│   ├── components/         # React components
│   ├── services/           # Service modules
│   └── utils/              # Utility functions
└── [JavaScript files]      # Various JS modules
```

### **Naming Conventions**
- **HTML files**: Use kebab-case (`freshman-guide.html`)
- **JavaScript files**: Use kebab-case (`file-upload-security.js`)
- **CSS classes**: Use Tailwind CSS or BEM methodology
- **Functions**: Use camelCase (`createPost`, `validateInput`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

---

## 🚀 **Feature Development**

### **Adding New Features**
1. **Plan the feature**:
   - Define requirements
   - Consider security implications
   - Plan UI/UX design
   - Consider mobile responsiveness

2. **Implement the feature**:
   - Follow coding standards
   - Add proper error handling
   - Implement security measures
   - Add input validation

3. **Test thoroughly**:
   - Manual testing
   - Security testing
   - Performance testing
   - Cross-browser testing

4. **Document the feature**:
   - Update relevant documentation
   - Add code comments
   - Update API documentation if needed

### **Example Feature: Adding Comments**
```javascript
// 1. Add to Firestore security rules
match /comments/{commentId} {
    allow read: if true;
    allow create: if isAuthenticated();
    allow update, delete: if isOwner(resource.data.authorId);
}

// 2. Create comment component
function CommentSection({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    // Implementation...
}

// 3. Add to API documentation
// See docs/API.md for comment endpoints
```

---

## 🐛 **Bug Reports**

### **Reporting Bugs**
When reporting bugs, please include:
- **Description**: Clear description of the issue
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, device
- **Screenshots**: If applicable
- **Console errors**: Any error messages

### **Example Bug Report**
```
**Bug Title**: Login button not working on mobile

**Description**: The login button doesn't respond to taps on mobile devices.

**Steps to reproduce**:
1. Open the website on a mobile device
2. Navigate to the login page
3. Enter credentials
4. Tap the login button

**Expected behavior**: User should be logged in and redirected to dashboard.

**Actual behavior**: Button doesn't respond to taps.

**Environment**:
- Device: iPhone 12
- Browser: Safari 15
- OS: iOS 15.0

**Screenshots**: [Attach screenshots if available]

**Console errors**: None
```

---

## 🔄 **Pull Request Process**

### **Before Submitting**
1. **Test your changes** thoroughly
2. **Follow coding standards**
3. **Add/update documentation**
4. **Ensure security compliance**
5. **Test on multiple devices/browsers**

### **Pull Request Template**
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Security improvement
- [ ] Performance optimization

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] Security testing completed
- [ ] Performance testing completed

## Screenshots
[If applicable, add screenshots]

## Checklist
- [ ] Code follows project standards
- [ ] Security measures implemented
- [ ] Error handling added
- [ ] Documentation updated
- [ ] No console errors
- [ ] Mobile responsive
```

### **Review Process**
1. **Automated checks** (if configured)
2. **Code review** by maintainers
3. **Security review** for sensitive changes
4. **Testing** by maintainers
5. **Approval and merge**

---

## 🏆 **Recognition**

### **Contributor Levels**
- **🌱 Newcomer**: First contribution
- **🌿 Regular**: Multiple contributions
- **🌳 Veteran**: Significant contributions
- **🏆 Maintainer**: Core team member

### **Contributor Hall of Fame**
We recognize contributors in our documentation and website. Your contributions help build a better community for GIKI students!

---

## 🆘 **Getting Help**

### **Resources**
- [Security Guide](SECURITY.md) - Security best practices
- [Deployment Guide](DEPLOYMENT.md) - Setup and deployment
- [API Documentation](API.md) - API reference
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### **Community Support**
- Create an issue on GitHub
- Contact the development team
- Join our community discussions

---

## 📄 **Code of Conduct**

### **Our Standards**
- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards other community members

### **Unacceptable Behavior**
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other conduct inappropriate in a professional setting

---

## 🎉 **Thank You!**

Your contributions help make GIKI Chronicles a better platform for the GIKI community. Every contribution, no matter how small, makes a difference!

**Happy Contributing!** 🚀

---

**Contributing Status**: ✅ Open  
**Community**: Welcoming 🤝  
**Support**: Available 📞  
**Recognition**: Active 🏆

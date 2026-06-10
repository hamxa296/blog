# Environment Setup Guide for GIKI Chronicles

This guide will help you set up environment variables for different deployment environments.

## 🚀 Quick Start

1. **For Local Development:**
   ```bash
   # Copy the development template
   cp env.development .env.local
   
   # Edit .env.local with your actual Firebase values
   # NEVER commit this file to version control
   ```

2. **For Production:**
   - Set environment variables in your hosting platform
   - Or use the `env.production` template

3. **Run the setup script:**
   ```bash
   node setup-env.js
   ```

## 📁 Environment Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `env.development` | Development template | Copy to `.env.local` for local development |
| `env.production` | Production template | Set in hosting platform or use directly |
| `env.staging` | Staging template | For testing environments |
| `env-example.txt` | General template | Reference for all available variables |

## 🔧 Environment Variables

### Required Firebase Configuration
```bash
FIREBASE_API_KEY=your_actual_api_key_here
FIREBASE_AUTH_DOMAIN=giki-chronicles.firebaseapp.com
FIREBASE_PROJECT_ID=giki-chronicles
FIREBASE_STORAGE_BUCKET=giki-chronicles.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=80968785263
FIREBASE_APP_ID=1:80968785263:web:666d2e69fef2ef6f5a5c9a
```

### Security Settings
```bash
NODE_ENV=production
ENABLE_CSP=true
ENABLE_SECURITY_OVERRIDES=true
```

### Environment Settings
```bash
DEBUG=false
CACHE_BUSTING=true
MINIFY=true
```

### Optional Analytics
```bash
GOOGLE_ANALYTICS_ID=your_ga_id_here
SENTRY_DSN=your_sentry_dsn_here
```

## 🌐 Hosting Platform Setup

### Vercel
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the appropriate environment (Production, Preview, Development)
4. Redeploy your project

### Netlify
1. Go to your site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Add each variable
4. Redeploy your site

### Firebase Hosting
1. Create a `.env.production` file in your project root
2. Add your environment variables
3. Deploy using Firebase CLI

### GitHub Pages
1. Go to your repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add repository secrets for each variable
4. Use them in your GitHub Actions workflow

## 🔒 Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use different Firebase projects for staging and production**
3. **Rotate API keys regularly**
4. **Use environment-specific configurations**
5. **Validate environment variables at startup**

## 🧪 Testing Your Setup

1. **Local Testing:**
   ```bash
   # Start your development server
   # Check browser console for any configuration errors
   ```

2. **Production Testing:**
   - Deploy to staging first
   - Verify all features work correctly
   - Check security headers and CSP
   - Test authentication flows

3. **Validation Script:**
   ```bash
   node setup-env.js
   ```

## 🚨 Troubleshooting

### Common Issues

1. **"process is not defined" error:**
   - This happens in browsers because `process.env` is Node.js specific
   - Use the `firebase-config-secure.js` file instead
   - Or set up a build process to inject environment variables

2. **Firebase configuration not loading:**
   - Check that `firebase-config-secure.js` is included in your HTML
   - Verify the file path is correct
   - Check browser console for errors

3. **Environment variables not working:**
   - Ensure your hosting platform supports environment variables
   - Check that variable names match exactly
   - Redeploy after adding variables

### Debug Mode

Enable debug mode to see more information:
```bash
DEBUG=true
```

This will show:
- Environment variable loading
- Firebase configuration status
- Security feature status

## 📚 Additional Resources

- [Firebase Environment Configuration](https://firebase.google.com/docs/projects/learn-more#config-files)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/get-started/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run `node setup-env.js` to validate your setup
3. Check browser console for error messages
4. Verify your hosting platform's environment variable documentation

---

**Remember:** Environment variables contain sensitive information. Always keep them secure and never expose them in client-side code or version control.

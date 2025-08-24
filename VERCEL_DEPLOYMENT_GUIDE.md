# 🚀 Vercel Deployment Guide for GIKI Chronicles

This guide will walk you through deploying your blog to Vercel with proper environment variable support.

## 📋 **Prerequisites**
- ✅ Your project is ready (all security fixes applied)
- ✅ Environment files are set up
- ✅ Firebase project is configured

## 🌐 **Step 1: Deploy to Vercel (Web Interface)**

### **Option A: Deploy via GitHub (Recommended)**
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository:**
   - Select `blog` repository
   - Vercel will automatically detect it's a static site
5. **Configure project:**
   - Project Name: `giki-chronicles`
   - Framework Preset: `Other`
   - Root Directory: `./`
6. **Click "Deploy"**

### **Option B: Deploy via Drag & Drop**
1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login**
3. **Click "New Project"**
4. **Choose "Upload"**
5. **Drag your entire project folder**
6. **Click "Deploy"**

## ⚙️ **Step 2: Set Environment Variables**

After deployment, set your environment variables:

1. **Go to your project dashboard**
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add these variables:**

```bash


# Security Settings
NODE_ENV=production
ENABLE_CSP=true
ENABLE_SECURITY_OVERRIDES=true
```

5. **Set Environment to "Production"**
6. **Click "Save"**

## 🔄 **Step 3: Redeploy with Environment Variables**

1. **Go to "Deployments" tab**
2. **Click "Redeploy" on your latest deployment**
3. **Wait for deployment to complete**

## 🧪 **Step 4: Test Your Deployment**

1. **Visit your Vercel URL** (e.g., `https://giki-chronicles.vercel.app`)
2. **Check browser console** for any errors
3. **Test key features:**
   - ✅ Homepage loads
   - ✅ Navigation works
   - ✅ Firebase authentication
   - ✅ Gallery functionality
   - ✅ Contact form

## 🔧 **Step 5: Update Your HTML Files**

Update your HTML files to use the Vercel-optimized Firebase config:

**Replace this line in all HTML files:**
```html
<script src="firebase-config-secure.js"></script>
```

**With this:**
```html
<script src="firebase-config-vercel.js"></script>
```

**Files to update:**
- `index.html`
- `login.html`
- `signup.html`
- `gallery.html`
- `contact.html`
- `about.html`
- `calendar.html`
- `guide.html`
- `newmap.html`

## 🌍 **Step 6: Custom Domain (Optional)**

1. **Go to "Settings" → "Domains"**
2. **Add your custom domain** (if you have one)
3. **Follow DNS configuration instructions**

## 📊 **Vercel Free Tier Limits**

- ✅ **Unlimited deployments**
- ✅ **Unlimited bandwidth**
- ✅ **100GB storage**
- ✅ **Environment variables**
- ✅ **Custom domains**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"process is not defined" error:**
   - Make sure you're using `firebase-config-vercel.js`
   - Environment variables should be set in Vercel dashboard

2. **Firebase not working:**
   - Check environment variables are set correctly
   - Verify Firebase project settings
   - Check browser console for errors

3. **Build errors:**
   - Check `vercel.json` configuration
   - Ensure all file paths are correct

### **Debug Mode:**
Add this to your HTML files for debugging:
```html
<script>
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Firebase Config:', window.firebaseConfig);
</script>
```

## 🎯 **Success Checklist**

- [ ] Project deployed to Vercel
- [ ] Environment variables set
- [ ] Firebase configuration working
- [ ] All features functional
- [ ] Custom domain configured (optional)
- [ ] HTTPS working
- [ ] Performance optimized

## 🔗 **Useful Links**

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

## 🎉 **You're Done!**

Your GIKI Chronicles blog is now:
- ✅ **Deployed to production**
- ✅ **Secure and optimized**
- ✅ **Using environment variables**
- ✅ **100% free hosting**
- ✅ **Global CDN performance**

---

**Need help?** Check the troubleshooting section or visit Vercel's support documentation.

# Dorm Room Media

This folder contains photos and videos of GIKI hostel rooms for the Freshman Guide.

## File Structure

```
dorm-media/
├── photos/          # Room photos (JPG, PNG)
├── videos/          # Room videos (MP4, WebM)
├── media-config.json # Media metadata and organization
└── README.md        # This file
```

## Adding New Media

### Photos
1. Add your photo files to the `photos/` folder
2. Update `media-config.json` with the file information:
   - `filename`: The actual filename
   - `title`: Display title
   - `description`: Detailed description
   - `alt`: Alt text for accessibility

### Videos
1. Add your video files to the `videos/` folder
2. Keep videos under 10MB for optimal loading
3. Use MP4 or WebM format for best browser compatibility
4. Update `media-config.json` with video information

## File Naming Convention
- Use descriptive names: `boys-room-1.jpg`, `girls-bathroom.jpg`
- Use lowercase and hyphens: `common-room-tour.mp4`
- Include category prefix: `boys-`, `girls-`, `common-`

## Recommended File Sizes
- **Photos**: 800x600px to 1920x1080px, under 500KB
- **Videos**: 720p or 1080p, under 10MB, 2-5 minutes duration

## Supported Formats
- **Photos**: JPG, PNG, WebP
- **Videos**: MP4, WebM
- **Posters**: JPG, PNG (for video thumbnails)

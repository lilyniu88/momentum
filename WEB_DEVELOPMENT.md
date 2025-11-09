# Web Development Guide

## Running on Web

To develop and test the app on the web:

```bash
npm run web
```

Or:

```bash
npx expo start --web
```

The app will automatically open in your browser at `http://localhost:8081`.

## Fonts on Web

The app uses two fonts:
- **Oswald** - For album names and stats
- **Figtree** - For headers and secondary text

### Option 1: Google Fonts (Recommended)

Add these to your HTML `<head>` (Expo handles this automatically):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Option 2: System Fonts

If fonts don't load, the app will automatically fall back to system fonts:
- Oswald → Arial, sans-serif
- Figtree → -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

The app will function correctly with system fonts, though the design may look slightly different.

## Web-Specific Features

- **Custom Dropdowns**: The app uses web-compatible dropdowns instead of native pickers
- **Hot Reloading**: Changes automatically refresh in the browser
- **Developer Tools**: Use browser DevTools (F12) to debug

## Troubleshooting

### Blank Page

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab to ensure bundle is loading
4. Try clearing cache: `npx expo start --web --clear`

### Fonts Not Loading

1. Check internet connection (for Google Fonts)
2. Fonts will fall back to system fonts automatically
3. App will still function correctly

### Styling Issues

1. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
2. Check browser console for CSS errors
3. Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)


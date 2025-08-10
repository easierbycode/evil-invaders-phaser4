# Normal dev server (auto-inlines small images)
vite

# Production web build (for gh-pages)
BUILD_TARGET=web vite build --mode production

# Cordova packaging
BUILD_TARGET=cordova vite build --mode production
cordova build android   # or ios, etc.
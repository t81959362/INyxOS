Requested fixes and improvements have now been implemented:

(22 April 2025)

Package Manager Registry Load (GitHub Pages)
The registry URL now uses import.meta.env.BASE_URL, ensuring it works on both localhost and GitHub Pages deployments.Image Request Handling
Nexa now only returns one image per request from both Pexels and Wikipedia.

Mobile Device Compatibility
Added and improved CSS media queries for .window-root, .window-titlebar, and .window-close to ensure windows and controls are fully responsive and fit all mobile screen sizes.
Windows now auto-fit and scroll on small screens.

Window Resizing UI
Removed all custom blue resize handles and related markup.
Enabled native-like resizing using resize: both; overflow: auto; for .window-root.

Window Close Button Hit Detection
Increased the clickable area and padding for the .window-close button.
Improved focus and active states for better accessibility and responsiveness.

Jittery and Flickering Animations
Added smooth CSS transitions for window movement and resizing.
Removed unnecessary elements that could cause flicker during drag/resize.
(If further animation issues persist, let me know the specific scenario for deeper optimization.)

SCSS Lint Fixes
Fixed all SCSS syntax errors and removed stray/duplicate properties.

To do list:

Add an 'MS Paint' app
YouTube Player App (with iframe support)
Embed a YouTube player using an iframe or the YouTube Player API.
Features: Search, playlists, mini-player mode, dark/light theme toggle.
 implement a secure iframe-based YouTube player that works inside your window system.
 Full-featured player in a window using iframes or the YouTube API.
Search, playlists, mini-player, and theming are all possible.

Music Player
Play local music files or stream from online sources (with a modern UI).
Visualizations and playlists.
Something like mpv.io 

Email Client (Eos Mail, already in progress)
Expand with advanced features: rules/filters, unified inbox, calendar integration, offline mode.

Web Browser
Already present (Nyxium), but could expand: extensions, ad-block, incognito, dev tools.

Possible discord?

FLAC, ALA, MP3, AAC support 
Album/Cover art support 

Controls bar at the bottom, Central player controls (play/pause, skip, etc.) at the bottom center.
Album/Cover Art Support to show of the current playing file
Keep existing logic 
Add FLAC/AAC/MP3/WAV support 

# Play Minesweeper Online
[![Netlify Status](https://api.netlify.com/api/v1/badges/172478bd-afc5-4e47-95ba-d9ab814248fb/deploy-status)](https://app.netlify.com/sites/mnswpr/deploys)

This is the classic game **Minesweeper** built with vanilla JS (i.e., no framework dependency).

Stack:
- HTML, JS, and CSS
- Webpack for bundling
- Firebase for leader board store
- Netlify for hosting

## Project motivation
One day, while working in my home office, I heard loud and fast mouse clicks coming from our bedroom. It's my wife, playing her favorite game (Minesweeper) on a crappy website full of advertisements.

I can't allow this, it's a security issue. 🤣

But it is also an opportunity.

I wanted to give her the same game, with a similar leader board she can dominate. But I also saw it as a chance to dig deeper into vanilla JS.

Can I make page with complex interactions (more on this later) without any dependency?

## What I have learned:

✨ We don't always necessarily *need* JS frameworks (or TS) ✨

✨ Even subtle UI changes *can improve* user gameplay experience ✨

✨ There's more ways to break you're app than you are initially aware of ✨

✨ Competition motivates users to use your app more ✨

✨ Hash in bundled filenames help issues in browser caching (when shipping versions fast) ✨
## Development
To start development, you need node v16 (the dev server doesn't work on v18 *yet*). Once you know you have this, you can do the following:
1. Install dependencies: `npm i`
2. Start the dev server: `npm run dev`

## Running Locally
After running the commands to start development, open in a browser: `http://localhost:4200`

## Contribution reminders

1. There's no hot reloading. You have to reload the app after making a change. OR contribute to enable HMR? ;)
2. This is a very messy code; a product of quick hacking and shipping while live users are giving feedback. Let's clean it up!

## Live Demo
*👉 The live site is here: [Minesweeper](https://mnswpr.com)*

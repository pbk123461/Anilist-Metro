# AniList Metro

AniList Metro is a browser-based anime and manga tracker with a Windows Phone and Zune-inspired interface. It uses the AniList GraphQL API and supports browsing without signing in.

[Open the live demo](https://pbk123461.github.io/Anilist-Metro/)

## Use the app

Open the demo and choose **Guest Mode** to browse without an AniList account. Sign in to sync your anime and manga lists with AniList.

## Features

- Browse seasonal anime, search anime and manga, and view airing schedules.
- Track progress in your AniList library when signed in.
- Explore community activity and media details.
- Customize the theme, wallpaper, and sound effects.

## Run locally

The app is plain HTML, CSS, and JavaScript. It has no build step or package installation.

You can open `index.html` directly, or serve the project directory with Python:

```sh
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Project structure

- `index.html` contains the application markup, styles, and JavaScript.
- `vendor/metro-ui/` contains the vendored Metro UI assets.
- `docs/` contains notes on the app's main modules.
- `xbox360 metro soundeffects/` contains the sound files used by the app.

## Development notes

Read [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) before making changes. The app depends on AniList's public GraphQL API. Metro UI assets are kept in the repository; the page also loads Font Awesome and date-fns from CDNs.

## Credits

- [AniList](https://anilist.co/) for its GraphQL API.
- [Metro UI](https://v4.metroui.org.ua/) for the UI components.
- Microsoft for the Windows Phone and Zune interface inspiration.
- [Font Awesome](https://fontawesome.com/) for icons.
- Sound effects adapted from the Xbox 360 Dashboard sound pack by *fantomnotphantom*.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

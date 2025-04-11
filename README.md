# AI Bookmark Manager

A Chrome extension that uses AI to automatically categorize and organize your bookmarks.

## Features

- **Smart Bookmarking**: Add or remove bookmarks with one click
- **AI Categorization**: Automatically place bookmarks in appropriate folders
- **Sorting Options**: Organize bookmarks by type and alphabetically
- **User Preferences**: Save settings and customize organization behavior
- **Dark Mode**: Seamless integration with browser theme preferences

## Project Structure

- **client/**: Chrome extension frontend
  - React interface for user interactions
  - Background service worker for extension functionality
- **server/**: Backend API
  - Express server for AI processing
  - OpenAI integration for content analysis and categorization

## Technology Stack

### Client

- TypeScript
- React
- Tailwind CSS
- Chrome Extension API
- Vite for building

### Server

- Node.js with Express
- OpenAI API integration
- Cheerio for web scraping

## Installation

### Prerequisites

- Node.js (latest LTS version)
- pnpm package manager

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/marqasa/bookmarks-extension.git
   cd bookmarks-extension
   ```

2. Install dependencies:

   ```
   # Install server dependencies
   cd server
   pnpm install

   # Install client dependencies
   cd ../client
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the server directory with:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Development

1. Start the server:

   ```
   cd server
   pnpm dev
   ```

2. Start the client development build in watch mode:

   ```
   cd client
   pnpm build --watch
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `client/dist` directory
   - After making changes to the client code, the dist folder will automatically update

## How It Works

1. When you click the bookmark icon, the extension checks if the current page is already bookmarked
2. If not, it creates a bookmark and sends the page data to the backend
3. The server uses AI to analyze the page content and determine appropriate categories
4. The bookmark is then moved to the correct folder in your bookmark hierarchy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# QR Studio

A modern, web-based QR code generator built with React and Vite. Generate, customize, and download QR codes with an intuitive interface.

**Live Demo:** [mligtenberg.github.io/qrcodes](https://mligtenberg.github.io/qrcodes)

## Features

- **Fast QR Generation** – Instantly generate QR codes from any text or URL
- **Customization** – Adjust error correction level and output size
- **Download Support** – Export QR codes as PNG images
- **Responsive Design** – Works seamlessly on desktop and mobile devices
- **Real-time Preview** – See QR code changes instantly as you type

## Tech Stack

- **React 18** – Modern UI library
- **Vite** – Lightning-fast build tool and dev server
- **pnpm** – Fast, disk space-efficient package manager

## Quick Start

### Prerequisites

- Node.js 16+ (or use `nvm` to manage versions)
- pnpm 10.30.3+

### Installation

```bash
# Clone the repository
git clone https://github.com/mligtenberg/qrcodes.git
cd qrcodes

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

The app will open at `http://localhost:5173` by default.

### Building

```bash
# Create an optimized production build
pnpm build

# Preview the production build locally
pnpm preview
```

## Usage

1. **Enter Text/URL** – Type any text or URL in the input field
2. **Customize** – Adjust settings as needed:
   - Error correction level (L, M, Q, H)
   - Size scaling
3. **Download** – Click the download button to save as PNG

## Project Structure

```
qrcodes/
├── src/
│   ├── index.jsx           # React entry point
│   └── components/         # React components
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── pnpm-lock.yaml          # Locked dependency versions
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build optimized production bundle |
| `pnpm preview` | Preview production build locally |

## Configuration

### Vite

The project uses Vite with React plugin for fast module reloading and optimal bundling. Configuration is in `vite.config.js`.

### Package Manager

This project uses `pnpm` for faster and more efficient package management. You can install it globally with:

```bash
npm install -g pnpm
```

## Deployment

The project is deployed to GitHub Pages at `mligtenberg.github.io/qrcodes`. To deploy your own fork:

1. Update the `homepage` field in `package.json` (if needed)
2. Configure GitHub Pages in repository settings
3. Push to the `main` branch or create a GitHub Actions workflow

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## QR Code Standard

This project uses the QR Code ISO/IEC 18004 standard. Error correction levels are:

- **L** – ~7% recovery capacity (smallest size)
- **M** – ~15% recovery capacity
- **Q** – ~25% recovery capacity
- **H** – ~30% recovery capacity (largest size)

## License

This project is open source. Please check the repository for license details.

## Author

[Martin Ligtenberg](https://github.com/mligtenberg)

## Feedback & Support

For issues, questions, or suggestions, please open a [GitHub Issue](https://github.com/mligtenberg/qrcodes/issues).

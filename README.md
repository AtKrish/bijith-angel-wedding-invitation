# Bijith & Angel — Wedding Invitation

A responsive static wedding invitation featuring an animated envelope opening, wedding photographs, 3D gold rings, background music, scratch-to-reveal date, countdown, photo gallery, and venue directions.

**Architecture:** Static website built with Vite. No backend or database required.

## Project Structure

```text
.
├── index.html
├── app.html
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   └── assets/
│       ├── photos/
│       ├── audio/
│       └── models/
├── src/
│   ├── css/
│   └── js/
├── dist/
└── deploy/
    └── apache/
        ├── bijith-invitation.conf
        └── deploy-centos.sh
```

*Note: The directory names above are illustrative. Refer to the actual project structure.*

## Prerequisites

- Node.js 22 LTS or Node.js 20.19+
- npm
- Git

## Local Development

Clone the repository:

```bash
git clone https://github.com/AtKrish/bijith-angel-wedding-invitation.git
cd bijith-angel-wedding-invitation
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Build the production website:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Production Hosting

The website is a static application and can be hosted using:

- AWS S3 and CloudFront
- AWS EC2 with Apache or Nginx
- Cloudflare Pages
- GitHub Pages

No continuously running application backend is required for the core invitation functionality.

## AWS EC2 Deployment

The project can also be deployed to a CentOS EC2 instance using Apache.

The deployment scripts and Apache configuration are located in:

```text
deploy/apache/
```

For EC2 deployment:

1. Configure the EC2 security group to allow HTTP (80) and HTTPS (443).
2. Restrict SSH (22) access to your own IP.
3. Install Apache.
4. Upload the production build.
5. Configure the Apache document root.
6. Enable HTTPS before sharing the invitation publicly.

Use an Elastic IP if you want a stable public IPv4 address.

## Updating the Website

After modifying the website:

```bash
npm ci
npm run build
```

Deploy the newly generated production files to your hosting provider.

## Configuration

Wedding-related configuration is maintained in:

```text
src/js/config.js
```

Update the following details there, where supported by the existing implementation:

- Couple names
- Wedding date
- Venue information
- Google Maps directions
- Background music
- Countdown settings
- Interaction settings

Current countdown target:

```text
2027-01-25T00:00:00+05:30
```

This represents midnight on 25 January 2027 in India Standard Time. Update the time if the actual ceremony time is confirmed.

## Assets

Original wedding photographs, audio files and 3D ring models are maintained in the project's asset directories.

The website uses WebGL for 3D rendering where supported, with appropriate fallbacks.

Music playback starts after visitor interaction to comply with browser autoplay restrictions.

## Security

- Never commit `.env` files or AWS credentials.
- Keep SSH access restricted.
- Enable HTTPS.
- Avoid exposing private configuration or access tokens.

## Repository

[GitHub – Bijith & Angel Wedding Invitation](https://github.com/AtKrish/bijith-angel-wedding-invitation)
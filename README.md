# Bijith & Angel — Wedding Invitation

A responsive static invitation with an envelope opening, supplied photos and the ring_02 model, music, scratch-to-reveal date, countdown, photo gallery, and venue directions. It has no backend or database. Production hosting is Apache on CentOS under `/var/www/html`.

## Project layout

```text
.
├── index.html                 # Generated standalone page for double-click / Apache
├── app.html                   # Vite source page
├── package.json / lockfile    # Reproducible Node build dependencies
├── vite.config.js             # Relative paths and self-contained file-open build
├── public/assets/             # Original photos, music, and ring_02.glb
├── src/css/                   # Responsive styles
├── src/js/                    # Config and interactions
├── dist/                      # Generated static site
└── deploy/apache/
    ├── bijith-invitation.conf # Apache MIME and document-root settings
    └── deploy-centos.sh       # Install Apache and publish to /var/www/html
```

The build embeds its JavaScript and the ring model in `dist/app.html`, then generates the root `index.html` as a standalone copy with relative references into `dist/assets/`. After `npm run build`, double-click the root `index.html` to open the invitation directly. Keep `dist/` beside it. Apache publishes that same root index and `dist/` tree under `/var/www/html`.

## Build locally

Install Node.js 22 LTS (or Node.js 20.19+). From this project folder:

```powershell
npm ci
npm run build
```

For local development, run `npm run dev`. To test the production output locally, run `npm run preview`. After the build completes, double-click the project-root `index.html`. It is the full built invitation, not a launcher, and needs no server. Keep `dist/` beside it.

## Publish on an AWS EC2 CentOS instance with Apache

These steps target CentOS Stream 9/10 with `dnf`, the usual `httpd` package, and the Apache document root `/var/www/html`. CentOS images can use different SSH usernames; use the username documented for the AMI you launched (often `centos`).

### 1. Prepare the EC2 instance

1. Launch a CentOS Stream instance and note its public IPv4 address.
2. In the instance security group, allow inbound TCP port **80** from the visitors who should see the invitation. For a public IPv4 invitation, that is `0.0.0.0/0`; add IPv6 access only if the instance/VPC uses IPv6.
3. Allow SSH TCP port **22** only from your current IP address. AWS recommends restricting SSH rather than opening it to all addresses.
4. Connect from PowerShell. Replace the key path, username, and address:

```powershell
ssh -i "$env:USERPROFILE\Downloads\bijith-key.pem" centos@EC2_PUBLIC_IP
```

### 2. Copy the project to EC2

From another PowerShell window, in the project root, copy the built output and deploy files. Replace the key, user, and IP as needed:

```powershell
$key = "$env:USERPROFILE\Downloads\bijith-key.pem"
$server = "centos@EC2_PUBLIC_IP"
ssh -i $key $server "mkdir -p ~/bijith-invitation"
scp -i $key -r index.html dist deploy "$($server):~/bijith-invitation/"
```

You do not need to copy `node_modules/` to the server. Node is only needed to build; Apache serves static files.

### 3. Install Apache and publish

Back in the EC2 SSH session:

```sh
sudo bash ~/bijith-invitation/deploy/apache/deploy-centos.sh
```

The script installs `httpd`, copies the launcher and `dist/` into `/var/www/html`, installs the Apache MIME configuration, restores the default SELinux web-content labels when available, opens HTTP in `firewalld` when it is active, checks Apache configuration, and enables the service at boot.

Open `http://EC2_PUBLIC_IP/`. AWS security groups must allow HTTP, and the CentOS host firewall must allow HTTP if `firewalld` is active. Apache must be able to read the files; the deployment script installs them with public read permissions.

For a domain name, point its DNS record to the instance (an Elastic IP avoids the address changing after stop/start). Configure HTTPS before sharing the invitation broadly; HTTP alone is not encrypted.

### Updating the invitation

Edit the source/configuration, then locally run:

```powershell
npm ci
npm run build
```

Copy the updated build and deployment files with the same `scp` command, then run the deploy script again over SSH. It overwrites matching build files in `/var/www/html` and keeps the Apache service configuration.

## Configuration and assets

Change names, wedding date, venue, map URL, music, and interaction settings in `src/js/config.js`. Countdown target `2027-01-25T00:00:00+05:30` is a provisional midnight in Asia/Kolkata; ceremony/reception details remain `null` until confirmed. Original media is in `public/assets/` and is copied into `dist/assets/` by Vite.

The invitation starts music only after the visitor opens the envelope. WebGL is optional and has a fallback. Google Fonts use system fallbacks when offline.

## References

- [AWS EC2 security-group rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)
- [Red Hat Apache HTTP Server setup](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/deploying_web_servers_and_reverse_proxies/setting-up-the-apache-http-web-server)
- [Red Hat SELinux guidance](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html-single/using_selinux/index)






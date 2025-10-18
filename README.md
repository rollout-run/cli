# Rollout CLI

A powerful CLI tool for deploying static sites to [rollout.run](https://rollout.run) - the fastest way to deploy and host your static websites.

## 🚀 Features

- **One-Command Deployment**: Deploy with just `rollout` (deploy is the default action)
- **Beautiful Status Dashboard**: Visual project status with real-time information
- **Deployment History**: Track all deployments in a clean table format
- **Project Management**: Create and manage multiple projects
- **Automatic Subdomains**: Each project gets a unique subdomain on rollout.run
- **Real-time Data**: All data fetched from API - no local file management
- **Heroku-style Naming**: Auto-generated project names with memorable slugs
- **Cloudflare Integration**: Powered by Cloudflare R2 and Workers for global performance

## 📦 Installation

```bash
npm install -g @rollout-run/cli
```

## 🎯 Quick Start

1. **Login to your account**:
   ```bash
   rollout login
   ```

2. **Deploy your static site**:
   ```bash
   rollout
   # or explicitly:
   rollout deploy
   ```

3. **Check your deployment status**:
   ```bash
   rollout status
   ```

4. **View deployment history**:
   ```bash
   rollout history
   ```

## 📋 Commands

### `rollout` / `rollout deploy`
Deploy your static site to rollout.run

```bash
# Deploy current directory (default action)
rollout

# Deploy specific folder
rollout deploy ./dist

# Deploy with project name
rollout deploy --project my-awesome-site
```

**Options:**
- `-p, --project <name>` - Project name (auto-generated if not provided)

### `rollout status`
Show current project status and latest deployment information

```bash
# Basic status
rollout status

# Detailed status with recent deployments
rollout status --verbose
```

**Features:**
- 📊 Beautiful card-based layout
- 🎨 Color-coded status indicators
- 📈 Real-time deployment data
- 🚀 Quick action suggestions

### `rollout history`
View deployment history in a clean table format

```bash
# Show last 10 deployments
rollout history

# Show more deployments
rollout history --limit 20
```

**Features:**
- 📜 Clean table format with status indicators
- 📊 File count and size information
- 🔗 Deployment URLs
- ⏰ Deployment timestamps

### `rollout list`
List all your projects

```bash
rollout list
```

### `rollout login`
Authenticate with your rollout.run account

```bash
rollout login
```

### `rollout register`
Create a new rollout.run account

```bash
rollout register
```

### `rollout logout`
Sign out of your account

```bash
rollout logout
```

## 🎨 Visual Features

### Status Command
The `rollout status` command provides a beautiful dashboard with:

- **Project Information Card**: Clean bordered display of project details
- **Latest Deployment Card**: Color-coded status with deployment metrics
- **Recent Deployments Table**: (with `--verbose`) Shows recent deployments in a table
- **Quick Actions**: Helpful command suggestions

### History Command
The `rollout history` command displays deployments in a professional table format:

```
┌────────┬────────────┬────────────────────┬────────┬────────────┬────────────────────────────────────────┐
│ Version│ Status     │ Date               │ Files  │ Size       │ URL                                     │
├────────┼────────────┼────────────────────┼────────┼────────────┼────────────────────────────────────────┤
│ 3      │ ✅ Success │ 12/15/2024 2:30:15 │ 12     │ 1.2 MB     │ https://my-project.rollout.run           │
│ 2      │ ✅ Success │ 12/15/2024 1:45:22 │ 10     │ 980 KB     │ https://my-project.rollout.run           │
│ 1      │ ✅ Success │ 12/15/2024 1:20:10 │ 8      │ 756 KB     │ https://my-project.rollout.run           │
└────────┴────────────┴────────────────────┴────────┴────────────┴────────────────────────────────────────┘
```

## 🔧 Configuration

The CLI automatically creates a `.rollout` directory in your project with:
- `config.json` - Project configuration and tracking

**No local deployment files are stored** - all data is fetched from the API in real-time.

## 🌐 Project URLs

Your deployed sites will be available at:
- `https://your-project-slug.rollout.run`

## 🚀 Performance

Rollout is powered by:
- **Cloudflare R2**: Global object storage
- **Cloudflare Workers**: Edge computing for instant deployments
- **Cloudflare CDN**: Global content delivery network

## 📝 Examples

### Deploy a React App
```bash
# Build your React app
npm run build

# Deploy the build folder
rollout deploy ./build
```

### Deploy a Vue.js App
```bash
# Build your Vue app
npm run build

# Deploy with custom project name
rollout deploy ./dist --project my-vue-app
```

### Check Deployment Status
```bash
# Quick status check
rollout status

# Detailed status with history
rollout status --verbose
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: [hello@rollout.run](mailto:hello@rollout.run)
- 🐛 Issues: [GitHub Issues](https://github.com/rollout-run/cli.rollout.run/issues)
- 📖 Docs: [rollout.run/docs](https://rollout.run/docs)

---

Made with ❤️ by the Rollout team


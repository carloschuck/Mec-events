# 🔌 MCP Servers Setup Guide

## Current Status: ❌ Not Connected

Both MCP servers need authentication credentials:
- ❌ GitHub MCP - Not connected
- ❌ DigitalOcean MCP - Not connected

---

## 🚀 Quick Fix: Configure MCP Servers in Cursor

### Step 1: Open Cursor Settings

**Option A: Via Menu**
```
Cursor → Settings → Features → MCP Servers
```

**Option B: Via Command Palette**
1. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux)
2. Type: "MCP: Configure Servers"
3. Press Enter

### Step 2: Add Server Configurations

You'll need to configure the MCP servers with your API credentials. The configuration file is typically located at:

```
~/Library/Application Support/Cursor/User/globalStorage/anysphere.cursor-mcp/config.json
```

---

## 🔑 GitHub MCP Configuration

### 1. Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Cursor MCP Access`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:org` (Read org and team membership)
   - ✅ `read:user` (Read user profile data)
   - ✅ `user:email` (Access user email addresses)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

### 2. Configure in Cursor

Add to your MCP config or set as environment variable:

**Option A: Environment Variable**
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

**Option B: MCP Config File**
```json
{
  "github": {
    "token": "ghp_your_token_here"
  }
}
```

---

## 🌊 DigitalOcean MCP Configuration

### 1. Create a DigitalOcean API Token

1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Click **"Generate New Token"**
3. Name: `Cursor MCP Access`
4. Scopes: **Read & Write** (for full management)
5. Click **"Generate Token"**
6. **Copy the token** immediately

### 2. Configure in Cursor

**Option A: Environment Variable**
```bash
export DIGITALOCEAN_TOKEN="dop_v1_your_token_here"
```

**Option B: MCP Config File**
```json
{
  "digitalocean": {
    "token": "dop_v1_your_token_here"
  }
}
```

---

## 📝 Complete MCP Configuration File Example

Create or update: `~/Library/Application Support/Cursor/User/globalStorage/anysphere.cursor-mcp/config.json`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_github_token_here"
      }
    },
    "digitalocean": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-digitalocean"],
      "env": {
        "DIGITALOCEAN_TOKEN": "dop_v1_your_do_token_here"
      }
    }
  }
}
```

---

## 🔄 Alternative: Environment Variables in Shell Profile

If you prefer, add to your `~/.zshrc` or `~/.bashrc`:

```bash
# MCP Server Credentials
export GITHUB_TOKEN="ghp_your_github_token_here"
export DIGITALOCEAN_TOKEN="dop_v1_your_do_token_here"
```

Then restart your terminal and Cursor.

---

## ✅ Verify Configuration

After setting up, restart Cursor and test:

### Test GitHub Connection
1. Try creating an issue
2. Try listing repositories
3. Try checking notifications

### Test DigitalOcean Connection
1. Try listing apps
2. Try listing regions
3. Try viewing droplets

---

## 🎯 What MCP Servers Enable

### GitHub MCP Features:
- ✅ Create and manage repositories
- ✅ Create and update issues
- ✅ Create and manage pull requests
- ✅ Review code and add comments
- ✅ Manage GitHub Actions workflows
- ✅ Search repositories and code
- ✅ Manage projects and tasks

### DigitalOcean MCP Features:
- ✅ Create and deploy apps
- ✅ Manage App Platform deployments
- ✅ View deployment status and logs
- ✅ Update app configurations
- ✅ List available regions
- ✅ Manage resources

---

## 🚀 For Your MEC Dashboard Project

Once MCP is configured, you'll be able to:

1. **Deploy to DigitalOcean App Platform** directly from Cursor
2. **Create GitHub repository** for version control
3. **Set up CI/CD** with GitHub Actions
4. **Manage deployments** without leaving Cursor
5. **Monitor app status** in real-time

---

## 🆘 Troubleshooting

### MCP Still Not Connecting?

1. **Restart Cursor** completely
2. **Check token validity**:
   ```bash
   # Test GitHub token
   curl -H "Authorization: token YOUR_GITHUB_TOKEN" https://api.github.com/user
   
   # Test DigitalOcean token
   curl -H "Authorization: Bearer YOUR_DO_TOKEN" https://api.digitalocean.com/v2/account
   ```
3. **Check Cursor logs**:
   ```
   ~/Library/Application Support/Cursor/logs/
   ```
4. **Verify token permissions** match requirements above

### Token Not Working?

- GitHub: Ensure you selected all required scopes
- DigitalOcean: Ensure you selected "Read & Write" access
- Both: Make sure tokens haven't expired

---

## 📚 Documentation

- **GitHub MCP**: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- **DigitalOcean MCP**: https://github.com/modelcontextprotocol/servers/tree/main/src/digitalocean
- **Cursor MCP Guide**: https://docs.cursor.com/features/mcp

---

## 🎯 Next Steps

1. [ ] Create GitHub Personal Access Token
2. [ ] Create DigitalOcean API Token
3. [ ] Configure MCP servers in Cursor
4. [ ] Restart Cursor
5. [ ] Test connections
6. [ ] Deploy MEC Dashboard to production!

---

**Note**: You can proceed with testing locally without MCP. MCP is only needed for automated deployment to DigitalOcean through Cursor.

For manual deployment, you can use the DigitalOcean web interface or CLI tools instead.

---

*Last Updated: October 10, 2025*



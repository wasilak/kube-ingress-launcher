# GitHub Token Setup for Automated Homebrew Updates

To enable automated Homebrew tap updates, you need to create a GitHub Personal Access Token (PAT) and add it to your repository secrets.

## Step 1: Create Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Developer settings"** (bottom left)
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token (classic)"**

### Token Configuration

- **Note**: `Homebrew Tap Updates for kube-ingress-launcher`
- **Expiration**: Choose duration (recommend 1 year or no expiration)
- **Scopes**: Select **`repo`** (Full control of private repositories)
  - This gives access to both public and private repositories
  - Required for pushing to the tap repository

5. Click **"Generate token"**
6. **⚠️ IMPORTANT**: Copy the token immediately! You won't see it again.

## Step 2: Add Token to Repository Secrets

1. Go to your main repository: https://github.com/wasilak/kube-ingress-launcher
2. Click **"Settings"** tab
3. Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**

### Secret Configuration

- **Name**: `TAP_GITHUB_TOKEN`
- **Value**: Paste the token you copied in Step 1
- Click **"Add secret"**

## Step 3: Verify Setup

The token is now configured! To verify it works:

1. Create a test release:
   ```bash
   ./scripts/bump-version.sh 0.1.1
   git push origin v0.1.1
   ```

2. Watch the GitHub Actions:
   - Go to **Actions** tab
   - Look for **"Update Homebrew Tap"** workflow
   - It should complete successfully

3. Check the tap repository:
   - Visit: https://github.com/wasilak/homebrew-kube-ingress-launcher
   - Verify the formula was updated with version 0.1.1

## Troubleshooting

### "Authentication failed" Error

**Cause**: Token is invalid, expired, or missing.

**Solution**:
1. Verify the secret exists: Settings → Secrets and variables → Actions
2. Check the secret name is exactly: `TAP_GITHUB_TOKEN`
3. Create a new token if expired
4. Update the secret with the new token

### "Resource not accessible by integration" Error

**Cause**: Token doesn't have sufficient permissions.

**Solution**:
1. Create a new token with `repo` scope
2. Update the repository secret

### Token Expiration

When your token expires:
1. Create a new token (follow Step 1 above)
2. Update the repository secret (follow Step 2 above)
3. No need to change any code or workflows

## Security Best Practices

✅ **Use token with minimal required permissions** (`repo` scope only)
✅ **Set expiration date** (recommend 1 year, then rotate)
✅ **Store as repository secret** (never commit to code)
✅ **Use different tokens** for different purposes
✅ **Revoke tokens** when no longer needed

## Token Permissions Explained

The `repo` scope grants:
- ✅ Read/write access to code
- ✅ Read/write access to commit statuses
- ✅ Read/write access to pull requests
- ✅ Read/write access to repository hooks

For this automation, we only use:
- Write access to push commits to the tap repository

## Alternative: Fine-Grained Tokens

GitHub also offers fine-grained tokens with more specific permissions:

1. Go to: https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Configure:
   - **Repository access**: Only select repositories → `homebrew-kube-ingress-launcher`
   - **Permissions**:
     - Contents: Read and write
     - Metadata: Read-only
4. Generate and add to secrets as above

Fine-grained tokens are more secure but require more setup.

## Revoking a Token

If you need to revoke a token:

1. Go to: https://github.com/settings/tokens
2. Find the token in the list
3. Click **"Delete"** or **"Revoke"**
4. Create a new token and update the repository secret

## Resources

- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Token Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)

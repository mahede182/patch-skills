# Publishing to NPM - Step by Step Guide

## Prerequisites

1. **Node.js >= 18.0.0** installed
2. **npm account** - Create one at https://www.npmjs.com/signup
3. **Logged in to npm** in terminal

## Step 1: Login to NPM

```bash
npm login
```

Enter your npm username, password, and email when prompted.

## Step 2: Update Package Metadata

Update these fields in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/patch-skills.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/patch-skills/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/patch-skills#readme"
}
```

## Step 3: Version Bump (if needed)

```bash
npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor   # 1.0.0 -> 1.1.0 (new features)
npm version major   # 1.0.0 -> 2.0.0 (breaking changes)
```

## Step 4: Dry Run Test

```bash
npm publish --dry-run
```

Check the output:
- Files included in package
- Package size
- No sensitive files included

## Step 5: Publish to NPM

```bash
npm publish --access public
```

Use `--access public` for scoped packages (@username/patch-skills).

## Step 6: Verify Installation

```bash
# Install from npm
npm install -g patch-skills

# Test it works
patch-skills --help
```

Or test with npx:

```bash
npx patch-skills --help
```

## Step 7: Tag Release on GitHub

```bash
git add .
git commit -m "v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

## Updating the Package

1. Make your changes
2. Update version: `npm version patch|minor|major`
3. Publish: `npm publish`
4. Push tags: `git push origin --tags`

## Troubleshooting

### "You do not have permission to publish..."
- Check you're logged in: `npm whoami`
- Verify package name is available: `npm search patch-skills`
- If name taken, change "name" in package.json

### "Package too large"
- Check `.npmignore` excludes tests, docs, .git
- Use `npm publish --dry-run` to see what's included

### "Missing README"
- Ensure README.md is at root level
- Check `files` array in package.json includes README.md

## NPM Best Practices

- **Semantic Versioning**: https://semver.org/
- **Keep package small**: Only include necessary files
- **Good README**: Clear installation and usage instructions
- **License**: Always include a license file
- **Keywords**: Help users find your package

## Resources

- NPM Documentation: https://docs.npmjs.com/
- Package.json guide: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
- Publishing scoped packages: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages

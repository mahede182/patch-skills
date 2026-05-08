# patch-skills

A tool for creating and applying patches to Warp agent skills, similar to `patch-package`. This allows you to maintain modifications to skills without losing changes when skills are regenerated or reinstalled.

## Installation

```bash
npm install patch-skills
# or use directly with npx
npx patch-skills
```

## Quick Start

### Workflow

```bash
# 1. Add skill using external tool (e.g., npx skills)
npx skills add my-skill
# Creates .agents/skills/my-skill/SKILL.md

# 2. Mark the original state (required before creating patches)
npx patch-skills mark my-skill

# 3. Edit the skill file
vim .agents/skills/my-skill/SKILL.md

# 4. Create a patch (auto-incrementing version)
npx patch-skills create my-skill
# Creates patches/skills+my-skill+1.0.0.patch

# 5. Patches apply automatically via postinstall
npm install  # runs patch-skills apply
```

## Commands

### `patch-skills mark <skill-name>`

Mark the current state of a skill as the original baseline. **Required before creating patches.**

**Options:**
- `-v, --verbose`: Enable verbose output

**Example:**
```bash
npx patch-skills mark my-skill
```

**Behavior:**
- Stores original content in `patches/.orig/{skill}.md.orig`
- Must be run before `create` command
- Only needs to be run once per skill

### `patch-skills create <skill-name>`

Create a versioned patch file from changes made to a skill's SKILL.md file.

**Options:**
- `-v, --verbose`: Enable verbose output
- `--version <version>`: Specify patch version (e.g., 1.0.0, 1.1.0)

**Example:**
```bash
npx patch-skills create my-skill -v
npx patch-skills create my-skill --version 1.2.0
```

**Behavior:**
- Requires `mark` command to be run first
- First patch: Creates v1.0.0
- Subsequent runs: Auto-increments version (1.0.0 → 1.0.1 → 1.0.2)
- Only one patch file per skill exists (old versions replaced)
- Creates `patches/skills+{skill}+{version}.patch`

### `patch-skills apply`

Apply all patches from the `patches/` directory.

**Options:**
- `-v, --verbose`: Enable verbose output
- `--include <skills>`: Comma-separated list of skills to include
- `--exclude <skills>`: Comma-separated list of skills to exclude

**Examples:**
```bash
npx patch-skills apply -v
npx patch-skills apply --include skill1,skill2
```

### `patch-skills verify`

Verify that all patches apply cleanly (dry-run, useful for CI/CD).

**Options:**
- `-v, --verbose`: Enable verbose output
- `--include <skills>`: Comma-separated list of skills to include
- `--exclude <skills>`: Comma-separated list of skills to exclude

**Example:**
```bash
npx patch-skills verify -v
```

## Postinstall Setup

To automatically apply patches after `npm install`, add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-skills apply"
  }
}
```

## Project Structure

```
.agents/
  skills/
    my-skill/
      SKILL.md                    ← Current skill file (with your edits)
patches/
  .orig/
    my-skill.md.orig              ← Original baseline (stored by mark)
  skills+my-skill+1.0.1.patch     ← Current patch file (single file per skill)
```

## How It Works

1. **Mark**: Stores original state in `patches/.orig/`
2. **Create**: Compares current `SKILL.md` against original, creates cumulative patch
3. **Update**: Replaces old patch with new version (only one patch per skill)
4. **Apply**: Applies patch and stores state for future patches

## Best Practices

- Add `patches/.orig/` to your `.gitignore` to avoid committing original files
- Commit only patch files to version control
- Run `mark` before editing a skill for the first time
- Use semantic versioning with `--version` flag for major changes

## License

MIT

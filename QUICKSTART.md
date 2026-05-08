# patch-skills Quick Start Guide

## Installation

```bash
npm install patch-skills
# or use directly with npx
npx patch-skills
```

## Essential Commands

### 1. Mark a skill (first time setup)
```bash
npx patch-skills mark <skill-name>
# Creates .agents/skills/<skill-name>/.SKILL.md.bak
```

### 2. Create a patch (after making changes)
```bash
npx patch-skills create <skill-name>
# Creates patches/skills+<skill-name>.patch
# Compares current SKILL.md against the backup
```

### 3. Apply patches (restore changes)
```bash
npx patch-skills apply
# Applies all patches from the patches/ directory
```

## In package.json (for automation)

```json
{
  "scripts": {
    "postinstall": "patch-skills apply"
  }
}
```

## Complete Workflow

```bash
# 1. Generate skill
npx skills my-skill

# 2. Mark as base
npx patch-skills mark my-skill

# 3. Edit your skill
vim .agents/skills/my-skill/SKILL.md

# 4. Create patch
npx patch-skills create my-skill

# 5. Commit patch
git add patches/skills+my-skill.patch
git commit -m "Customize my-skill"

# 6. Next time (patches apply automatically via postinstall)
npm install
```

## File Structure

```
.agents/skills/
  my-skill/
    SKILL.md           ← Your edited version
    .SKILL.md.bak      ← Original (hidden backup)

patches/
  skills+my-skill.patch  ← Commit this to git
```

## Useful Flags

```bash
# Verbose output (see what's happening)
npx patch-skills create <skill-name> -v
npx patch-skills apply -v
npx patch-skills mark <skill-name> -v
```

## Troubleshooting

**No backup exists**
- Solution: `npx patch-skills mark <skill-name>` (marks current as base)

**No changes detected**
- Means: Current SKILL.md matches the backup (no new patch created)
- Solution: Edit the file and try again

**Patch doesn't apply**
- Skill was updated/changed
- Solution: Manually edit SKILL.md, then run `npx patch-skills create <skill-name>` again

## Team Workflow

```bash
# Developer A (creates patch)
npx patch-skills create my-skill
git add patches/
git commit -m "Update my-skill"
git push

# Developer B (gets patch)
git pull
npm install  # postinstall hook applies patches automatically
```

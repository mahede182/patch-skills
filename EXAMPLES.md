# patch-skills Examples

This document walks through real-world scenarios for using `patch-skills`.

## Scenario 1: Creating and Applying Patches

### Step 1: Initialize with a skill

You've just run `npx skills my-agent` and got a generated skill file:

```bash
$ ls -la .agents/skills/my-agent/
SKILL.md
```

### Step 2: Mark as base

Mark this as your starting point:

```bash
$ npx patch-skills mark my-agent
✓ Marked "my-agent" as base version for future patches
```

This creates `.SKILL.md.bak` as a hidden backup.

### Step 3: Edit your skill

You customize the skill's behavior:

```bash
$ vim .agents/skills/my-agent/SKILL.md
# Make changes to prompts, behavior, constraints, etc.
```

### Step 4: Create a patch

Generate a patch file for your changes:

```bash
$ npx patch-skills create my-agent
✓ Patch created: patches/skills+my-agent.patch
  Lines changed: +12/-5
```

### Step 5: Commit patches

Commit the patch file to your repository:

```bash
$ git add patches/skills+my-agent.patch
$ git commit -m "Add custom behavior to my-agent skill"
```

### Step 6: Automatic re-application

Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-skills apply"
  }
}
```

Now when teammates or CI/CD runs `npm install`, the patch is automatically applied.

---

## Scenario 2: Multiple Skills

You're managing patches for several skills:

```bash
# Create patches for multiple skills
$ npx patch-skills create skill-1
✓ Patch created: patches/skills+skill-1.patch

$ npx patch-skills create skill-2
✓ Patch created: patches/skills+skill-2.patch

$ npx patch-skills create skill-3
✓ Patch created: patches/skills+skill-3.patch

# Apply all at once
$ npx patch-skills apply
Applying 3 patch(es)...

✓ skill-1
✓ skill-2
✓ skill-3

3 patch(es) applied successfully
```

---

## Scenario 3: Updating a Skill

The original skill is updated via `npx skills upgrade`, but you have custom changes.

### Problem

```bash
$ npx skills upgrade my-agent
# The original .agents/skills/my-agent/SKILL.md is overwritten
# Your custom changes are lost!
```

### Solution with patch-skills

Before updating, save your patch:

```bash
# Your patch already exists in git
$ git status
  patches/skills+my-agent.patch
```

After upgrading:

```bash
# Regenerate the backup with the new version
$ npx patch-skills mark my-agent

# Re-apply your custom patch
$ npx patch-skills apply

# Your changes are restored!
```

---

## Scenario 4: Debugging Failed Patches

A patch doesn't apply cleanly to a new version of a skill.

```bash
$ npx patch-skills apply
Applying 1 patch(es)...

✗ Failed to apply skills+my-agent.patch: Patch does not apply cleanly to my-agent
```

### Resolution

1. **Manually merge** the changes:

```bash
# View the patch
$ cat patches/skills+my-agent.patch

# Edit the skill to manually apply the changes
$ vim .agents/skills/my-agent/SKILL.md

# Generate a new patch
$ npx patch-skills create my-agent
✓ Patch created: patches/skills+my-agent.patch
  Lines changed: +15/-3

# Commit the updated patch
$ git add patches/skills+my-agent.patch
$ git commit -m "Update my-agent patch for new version"
```

---

## Scenario 5: Verbose Debugging

Need more details about what's happening?

```bash
# Create with verbose output
$ npx patch-skills create my-agent -v
Skill path: /path/to/.agents/skills/my-agent/SKILL.md
Backup path: /path/to/.agents/skills/my-agent/.SKILL.md.bak
Generated patch:
Index: my-agent/SKILL.md
===================================================================
--- my-agent/SKILL.md	original
+++ my-agent/SKILL.md	modified
@@ -5,10 +5,12 @@
 
 You are a helpful assistant.
 
-Your role is generic.
+Your role is specialized: {CUSTOM_ROLE}
+
+Always use {CUSTOM_TONE} tone.

✓ Patch created: patches/skills+my-agent.patch
  Lines changed: +3/-1

# Apply with verbose output
$ npx patch-skills apply -v
Applying 1 patch(es)...

Applying patch: skills+my-agent.patch
  Target: /path/to/.agents/skills/my-agent/SKILL.md
  ✓ Applied successfully

1 patch(es) applied successfully
```

---

## Scenario 6: Integration with Workflows

### Pre-commit Hook (using husky)

```json
{
  "scripts": {
    "precommit": "npx patch-skills create my-agent && git add patches/"
  }
}
```

### GitHub Actions

```yaml
name: Apply Skills Patches

on: [pull_request, push]

jobs:
  apply-patches:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx patch-skills apply
```

---

## Scenario 7: Monitoring Patch Status

Check which patches have been generated but not committed:

```bash
$ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update the thing to be committed)
        modified:   .agents/skills/my-agent/SKILL.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        patches/skills+my-agent.patch

$ npx patch-skills create my-agent
⚠ No changes detected in "my-agent". Patch not created.
```

---

## Scenario 8: Working with Teams

### Developer A: Creates a patch

```bash
$ npx patch-skills mark my-skill
$ # ... make edits ...
$ npx patch-skills create my-skill
$ git add patches/skills+my-skill.patch
$ git commit -m "Customize my-skill behavior"
$ git push
```

### Developer B: Gets the patch

```bash
$ git pull
$ npm install  # Runs postinstall → patch-skills apply
$ # Skills automatically patched!
```

---

## Project Structure After Using patch-skills

```
my-project/
├── package.json
├── .gitignore
├── node_modules/
├── .agents/
│   └── skills/
│       ├── skill-1/
│       │   ├── SKILL.md           # Current (may have edits)
│       │   ├── .SKILL.md.bak      # Backup (original)
│       │   └── ...
│       └── skill-2/
│           ├── SKILL.md
│           ├── .SKILL.md.bak
│           └── ...
└── patches/
    ├── skills+skill-1.patch        # Committed to git
    └── skills+skill-2.patch        # Committed to git
```

---

## Tips & Best Practices

1. **Always commit patch files**: The `.patch` files are what restore your changes. Add them to `.gitignore` exclusions or commit them directly.

2. **Use descriptive commit messages**: When committing patches, explain what customizations they contain.

   ```bash
   git commit -m "Add custom prompt to search-skill

   - Customize search behavior
   - Add domain-specific constraints
   - Improve relevance scoring"
   ```

3. **Run patches on CI/CD**: Use `npm run postinstall` in your CI pipeline to ensure consistency.

4. **Regenerate after upgrades**: When a skill is upgraded, regenerate the patch with the new version as base:

   ```bash
   npx patch-skills mark <skill>
   npx patch-skills create <skill>
   ```

5. **Use verbose mode for debugging**: The `-v` flag helps understand what's happening behind the scenes.

6. **Keep patches small and focused**: Each patch should represent one logical set of changes, making them easier to review and maintain.

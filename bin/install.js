#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

const banner = `
${cyan}  ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝${reset}

  FORGE Framework ${dim}v${pkg.version}${reset}
  Autonomous Engineering on PAUL patterns
`;

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    return configDirArg.split('=')[1];
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx forge-framework [options]

  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}              Install globally (to Claude config directory)
    ${cyan}-l, --local${reset}               Install locally (to ./.claude in current directory)
    ${cyan}-c, --config-dir <path>${reset}   Specify custom Claude config directory
    ${cyan}-h, --help${reset}                Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Install to default ~/.claude directory${reset}
    npx forge-framework --global

    ${dim}# Install to custom config directory${reset}
    npx forge-framework --global --config-dir ~/.claude-custom

    ${dim}# Install to current project only${reset}
    npx forge-framework --local

  ${yellow}What gets installed:${reset}
    commands/forge/     - Slash commands (/forge:init, /forge:plan, etc.)
    forge-framework/    - Templates, workflows, references, rules
`);
  process.exit(0);
}

/**
 * Expand ~ to home directory
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Recursively copy directory, replacing paths in .md files.
 * Wraps fs calls so permission/IO errors surface as friendly messages.
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  try {
    fs.mkdirSync(destDir, { recursive: true });

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        copyWithPathReplacement(srcPath, destPath, pathPrefix);
      } else {
        // Replace ~/.claude/ with the appropriate prefix in text files
        // Covers .md, FORGE manifest, and any other text content
        const textExts = ['.md', '.txt', '.json', '.yaml', '.yml'];
        const isText = textExts.some(ext => entry.name.endsWith(ext))
          || !entry.name.includes('.');  // extensionless files (e.g. FORGE manifest)
        if (isText) {
          let content = fs.readFileSync(srcPath, 'utf8');
          content = content.replace(/~\/\.claude\//g, pathPrefix);
          fs.writeFileSync(destPath, content);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  } catch (err) {
    console.error(`  ${yellow}Failed to copy ${srcDir} → ${destDir}${reset}`);
    console.error(`  ${dim}${err.message}${reset}`);
    process.exit(1);
  }
}

/**
 * Back up an existing install directory to a timestamped sibling, so
 * re-running the installer never silently clobbers user customizations.
 */
function backupIfExists(dir) {
  if (!fs.existsSync(dir)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `${dir}.backup-${stamp}`;
  fs.renameSync(dir, backup);
  return backup;
}

/**
 * Install to the specified directory
 */
function install(isGlobal) {
  const src = path.join(__dirname, '..');
  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.CLAUDE_CONFIG_DIR);
  const defaultGlobalDir = configDir || path.join(os.homedir(), '.claude');
  const claudeDir = isGlobal
    ? defaultGlobalDir
    : path.join(process.cwd(), '.claude');

  const locationLabel = isGlobal
    ? claudeDir.replace(os.homedir(), '~')
    : claudeDir.replace(process.cwd(), '.');

  // Path prefix for file references
  const pathPrefix = isGlobal
    ? (configDir ? `${claudeDir}/` : '~/.claude/')
    : './.claude/';

  console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

  // Create commands directory
  const commandsDir = path.join(claudeDir, 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  // Copy src/commands to commands/forge (backing up any prior install)
  const commandsSrc = path.join(src, 'src', 'commands');
  const commandsDest = path.join(commandsDir, 'forge');
  const commandsBackup = backupIfExists(commandsDest);
  if (commandsBackup) {
    console.log(`  ${dim}↳ backed up existing commands/forge → ${path.basename(commandsBackup)}${reset}`);
  }
  copyWithPathReplacement(commandsSrc, commandsDest, pathPrefix);
  console.log(`  ${green}✓${reset} Installed commands/forge`);

  // Copy src/* (except commands) to forge-framework/
  const skillDest = path.join(claudeDir, 'forge-framework');
  const skillBackup = backupIfExists(skillDest);
  if (skillBackup) {
    console.log(`  ${dim}↳ backed up existing forge-framework → ${path.basename(skillBackup)}${reset}`);
  }
  fs.mkdirSync(skillDest, { recursive: true });

  const srcDirs = ['templates', 'workflows', 'references', 'rules', 'carl'];
  for (const dir of srcDirs) {
    const dirSrc = path.join(src, 'src', dir);
    const dirDest = path.join(skillDest, dir);
    if (fs.existsSync(dirSrc)) {
      copyWithPathReplacement(dirSrc, dirDest, pathPrefix);
    }
  }
  console.log(`  ${green}✓${reset} Installed forge-framework`);

  console.log(`
  ${green}Done!${reset} Launch Claude Code and run ${cyan}/forge:help${reset}.
`);
}

/**
 * Prompt for install location
 */
function promptLocation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.CLAUDE_CONFIG_DIR);
  const globalPath = configDir || path.join(os.homedir(), '.claude');
  const globalLabel = globalPath.replace(os.homedir(), '~');

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${globalLabel})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(./.claude)${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    const isGlobal = choice !== '2';
    install(isGlobal);
  });
}

// Main
if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasGlobal) {
  install(true);
} else if (hasLocal) {
  install(false);
} else {
  promptLocation();
}

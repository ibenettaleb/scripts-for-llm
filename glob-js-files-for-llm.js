import {globby} from 'globby';
import {Command} from 'commander';
import untildify from 'untildify';
import {readFile, appendFile, unlink} from 'node:fs/promises';
import {ensureDir} from 'fs-extra/esm';
import path from 'node:path';
import open from 'open';

const program = new Command();
program
  .name('concat-js-files-for-llm')
  .description('Concatenate all JavaScript files in a directory and subdirectories')
  .argument('[path]', 'Path to the directory containing JavaScript files')
  .parse();

const rawPath = program.args[0];
const expandedPath = untildify(rawPath);

// Recursively glob .js and .jsx files from the provided path
const globPattern = path.join(expandedPath, '**', '*.{js,jsx}');
const files = await globby(globPattern, {
  onlyFiles: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/android/**', '**/ios/**', '**/build/**'],
});

// Convert rawPath into an array of path segments
const pathSegments = rawPath.split(path.sep).filter(Boolean);
// Don't prefix the dash
const fileName = pathSegments.join('-');
const outputPath = path.join(process.cwd(), 'tmp', `${fileName}.txt`);
await ensureDir(path.dirname(outputPath));

// if output file exists, delete it
try {
  await unlink(outputPath);
} catch (error) {
  // ignore error
}

for (const file of files) {
  const contents = await readFile(file, 'utf-8');
  // Append the absolute path to the file prefixed with a comment
  await appendFile(outputPath, `// ${file}\n`);
  // Append the contents
  await appendFile(outputPath, contents);
}

// Reveal the output file in Finder or File Explorer
await open(path.dirname(outputPath));

console.log(`Concatenated ${files.length} files to ${outputPath}`);

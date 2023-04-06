import fs from 'fs-extra';
import path from 'path';
import { htmlToText } from 'html-to-text';

// Function to read files from a directory recursively
async function readFilesRecursively(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const filePromises = entries.map(async entry => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return readFilesRecursively(fullPath);
    } else if (entry.isFile()) {
      return fullPath;
    }
  });

  const files = await Promise.all(filePromises);
  return files.flat().filter((file): file is string => typeof file === 'string');
}

// Function to convert HTML files to text files
async function convertHtmlToText(dirPath: string): Promise<void> {
  const htmlFiles = await readFilesRecursively(dirPath);
  console.log('found files:', htmlFiles.length);
  const textPromises = htmlFiles.map(async htmlFilePath => {
    const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
    const textContent = htmlToText(htmlContent);
    const outputFileName = path.basename(htmlFilePath, '.html') + '.txt';
    const outputPath = path.join(path.dirname(htmlFilePath), outputFileName);
    console.log('Converting:', htmlFilePath, 'to', outputPath);
    return fs.writeFile(outputPath, textContent);
  });

  await Promise.all(textPromises);
  console.log('HTML files have been successfully converted to text files.');
}

// Replace 'path/to/directory' with the path to the directory containing HTML files
const directoryPath = 'help.bringg.com';
convertHtmlToText(directoryPath).catch(console.error);

import { existsSync, openSync, readFileSync, writeFileSync } from "fs";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { Entity } from "./entities";
import * as Nunjucks from "nunjucks";
import { logLine } from "./log";
import * as fs from "fs";

import path = require("path");
import request = require("request");
const decompress = require('decompress');

async function askToSelectFilesFor(
  whatFor: string,
  entityType: any,
  canPickMany = true
) {
  const title = "Please select " + whatFor;
  const options: vscode.QuickPickOptions = {
    canPickMany: true,
    title: title,
  };
  const itemMap = new Map<String, Uri>();
  const items: string[] = [];
  let foundEntities: Uri[] = await vscode.workspace.findFiles(
    entityType.globPattern
  );
  for (let foundEntity of foundEntities) {
    const fileName = path.basename(foundEntity.fsPath);
    itemMap.set(fileName, foundEntity);
    items.push(fileName);
  }
  const selections: any = await vscode.window.showQuickPick(items, options);
  if (Array.isArray(selections)) {
    return selections;
  }
  return [];
}

function postEntityCreation(entity: Entity, context: any) {
  vscode.workspace.openTextDocument(entity.fileUri).then((doc) => {
    const templatePath = path.resolve(
      __dirname,
      "..",
      "templates",
      entity.templatePath
    );
    logLine("[Templating] Try reading template from " + templatePath);
    if (existsSync(templatePath)) {
      logLine("[Templating] Template path exsists");
      const templateContent = readFileSync(templatePath);
      const content = Nunjucks.renderString(
        templateContent.toString(),
        context
      );
      writeFileSync(entity.fileUri.fsPath, content);
    } else {
      logLine("[Templating] Template not found");
    }
    entity.reportNewEntity();
    vscode.window.showTextDocument(doc);
  });
}

function createFileIfNotExists(filePath: string) {
  if (!existsSync(filePath)) {
    openSync(filePath, "w");
  }
}

function loadEntities(what: any, entitiesJson: any) {
  const result = [];
  if (entitiesJson) {
    for (let entityJson of entitiesJson) {
      const entityFilePath = entityJson.fileUri.fsPath;
      const assumption = new what(Uri.file(entityFilePath));
      result.push(assumption);
    }
  }
  return result;
}

function sendEvent(event: any) {
  const uri = "http://localhost:5000/capturer/process-event";
  request(uri, {
    method: "POST",
    json: true,
    body: JSON.stringify(event),
  }).on("error", function (err) {
    console.error(err);
  });
}

function downloadZipFile(url:string, baseUri:Uri) {
  // Correctly join paths using fsPath where needed
  const fileName = Uri.joinPath(baseUri, "archive.zip").fsPath;
  const fileStream = fs.createWriteStream(fileName);

  // Start downloading the file
  request(url)
    .on('error', (err) => {
      console.error('Error during file download:', err);
    })
    .pipe(fileStream);

  // Once the file is fully downloaded
  fileStream.on('finish', async () => {
    console.log('Download complete. Starting decompression...');

    try {
      // Decompress the downloaded file to the baseUri directory
      const files = await decompress(fileName, baseUri.fsPath);
      console.log('Decompressed files:', files);
      console.log('Decompression complete!');
      fs.rmSync(fileName);

    } catch (err) {
      console.error('Error during decompression:', err);
    }

    // Path to the extracted folder
    const extractedDir = Uri.joinPath(baseUri, "simprov-quickstart-main").fsPath;

    try {
      // Ensure extracted directory exists before reading its contents
      if (fs.existsSync(extractedDir)) {
        const files = fs.readdirSync(extractedDir);
        files.forEach((file) => {
          const srcFile = path.join(extractedDir, file);
          const destFile = path.join(baseUri.fsPath, file);
          const stats = fs.statSync(srcFile);
          if (stats.isDirectory()){
            copyDirectory(srcFile,destFile)
          } else {
          fs.copyFileSync(srcFile, destFile);
        }
        });

        // Remove the extracted folder after copying the files
        fs.rmSync(extractedDir, { recursive: true, force: true });
      } else {
        console.error('Extracted directory does not exist:', extractedDir);
      }
    } catch (err) {
      console.error('Error copying files or cleaning up:', err);
    }
  });

  // Handle file stream errors
  fileStream.on('error', (err) => {
    console.error('Error writing file:', err);
  });
}

// Function to copy files and directories
function copyFileOrDirectory(src:any, dest:any) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    // If it's a directory, recursively copy the contents
    copyDirectory(src, dest);
  } else {
    // If it's a file, copy it directly
    fs.copyFileSync(src, dest);
  }
}

// Function to copy an entire directory
function copyDirectory(srcDir:any, destDir:any) {
  // Ensure the destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Read all items in the source directory
  const items = fs.readdirSync(srcDir);

  // Iterate over all items and copy them to the destination
  items.forEach((item) => {
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);

    // Copy files or directories accordingly
    copyFileOrDirectory(srcItem, destItem);
  });
}


export {
  createFileIfNotExists,
  loadEntities,
  sendEvent,
  postEntityCreation,
  askToSelectFilesFor,
  downloadZipFile

};

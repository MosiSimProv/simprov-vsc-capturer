import * as vscode from "vscode";

const outputChannel = vscode.window.createOutputChannel("SimProv");

function logLine(line: string) {
  console.log(line);
  outputChannel.append(line + "\n");
}

export { logLine };

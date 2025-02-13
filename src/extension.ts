import * as vscode from "vscode";
import { existsSync } from "fs";
import { SimulationStudy } from "./entities";
import { currentState } from "./state";
import {
  newAssumptionCommand,
  newExperimentCommand,
  newModelCommand,
  newReferenceCommand,
  newRequirementCommand,
  newResearchQuestionCommand,
  newStudyCommand,
} from "./commands";
import { logLine } from "./log";

export function activate(context: vscode.ExtensionContext) {
  console.log("SIMPROV Extension FOOOO");
  console.log("SIMPROV Extension active");

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "simprov-capturer.NewSimulationStudy",
      newStudyCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewResearchQuestion",
      newResearchQuestionCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewAssumption",
      newAssumptionCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewRequirement",
      newRequirementCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewModel",
      newModelCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewExperiment",
      newExperimentCommand
    ),
    vscode.commands.registerCommand(
      "simprov-capturer.NewReference",
      newReferenceCommand
    )
  );

  //Register Save Hooks
  vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
    const documentUri = document.uri;
    if (documentUri.path.includes(".study")) return;
    if (currentState.activeStudy) {
      const entity = currentState.activeStudy.lookupEntity(documentUri);

      if (entity !== undefined) {
        logLine("Entity was edited " + entity.fileUri.fsPath);
        entity.reportChange();
      } else {
        logLine("Entity for URI unknown " + documentUri.fsPath);
      }
    }
  });

  //Register File edit Hook
  vscode.workspace.onDidCreateFiles((e: vscode.FileCreateEvent) => {
    const fileURI = e.files[0];
    if (currentState.activeStudy) {
      const entity = currentState.activeStudy.incorporateNewFile(fileURI);
      if (entity !== null) {
        entity.reportNewEntity();
        logLine("New file was incorporated  " + entity.fileUri.fsPath);
      }
    }
  });

  //Load Study If .study file exists
  if (vscode.workspace.rootPath !== undefined) {
    const currentDirectoryURI = vscode.Uri.file(vscode.workspace.rootPath);
    const possibleStudyFileUri = vscode.Uri.joinPath(
      currentDirectoryURI,
      ".study"
    );
    if (existsSync(possibleStudyFileUri.fsPath)) {
      const study = new SimulationStudy(currentDirectoryURI);
      study.loadState();
      currentState.activeStudy = study;
    }
  }
}

export function deactivate() { }

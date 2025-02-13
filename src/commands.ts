import * as vscode from "vscode";
import {
  Assumption,
  MLRulesModel,
  Reference,
  Requirement,
  ResearchQuestion,
  SimulationExperiment,
  SimulationModel,
  SimulationStudy,
  TelluriumModel,
} from "./entities";
import { logLine } from "./log";
import { currentState } from "./state";
import { askToSelectFilesFor, postEntityCreation } from "./utils";
import { FILE } from "dns";

function newStudyCommand() {
  var dialogOptions: vscode.OpenDialogOptions = {
    title: "Select Simulation Study Folder",
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  };
  vscode.window.showOpenDialog(dialogOptions).then((selection) => {
    console.log(selection);
    if (selection === undefined) {
      vscode.window.showErrorMessage("Selection undefined");
      return;
    }
    let uri = selection[0];
    currentState.activeStudy = new SimulationStudy(uri);
    vscode.commands.executeCommand("vscode.openFolder", uri).then((value) => {
      currentState.activeStudy!.initStudy();
      currentState.activeStudy!.storeState();
    });
  });
}

function newResearchQuestionCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  const study = currentState.activeStudy;
  const fileName = "research question.md";
  const researchQuestionFileUri = vscode.Uri.joinPath(study.baseUri, fileName);
  const researchQuestionEntity = new ResearchQuestion(researchQuestionFileUri);
  study.researchQuestion = researchQuestionEntity;
  study.storeState();
  study!.addEntityEntry(researchQuestionEntity);

  askToSelectFilesFor("References", Reference).then((result) => {
    const context: any = {};
    if (result.length !== 0) {
      context.references = result;
    }
    postEntityCreation(researchQuestionEntity, context);
  });
}

async function newAssumptionCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  var options: vscode.InputBoxOptions = {
    title: "Assumption File Name",
  };
  vscode.window.showInputBox(options).then((input) => {
    var dirs = vscode.workspace.workspaceFolders;
    if (dirs === undefined) {
      vscode.window.showErrorMessage("Workspace folders are undefined");
      return;
    }
    const study = currentState.activeStudy;
    const rootUri = dirs[0].uri;
    const filename = "assumption " + input + ".md";
    const assumptionURI = vscode.Uri.joinPath(rootUri, filename);
    const assumption = new Assumption(assumptionURI);
    study!.assumptions.push(assumption);
    study!.storeState();
    study!.addEntityEntry(assumption);

    askToSelectFilesFor("References", Reference).then((result) => {
      const context: any = {};
      context.name = input;
      if (result.length !== 0) {
        context.references = result;
      }
      postEntityCreation(assumption, context);
    });
  });
}

function newRequirementCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  var options: vscode.InputBoxOptions = {
    title: "Requirement File Name",
  };
  vscode.window.showInputBox(options).then((input) => {
    var dirs = vscode.workspace.workspaceFolders;
    if (dirs === undefined) {
      vscode.window.showErrorMessage("Workspace folders are undefined");
      return;
    }
    const study = currentState.activeStudy;
    const rootUri = dirs[0].uri;
    const filename = "requirement " + input + ".md";
    const requirementUri = vscode.Uri.joinPath(rootUri, filename);
    const requirement = new Requirement(requirementUri);
    study!.requirements.push(requirement);
    study!.storeState();
    study!.addEntityEntry(requirement);

    askToSelectFilesFor("References", Reference).then((result) => {
      const context: any = {};
      context.name = input;
      if (result.length !== 0) {
        context.references = result;
      }
      postEntityCreation(requirement, context);
    });
  });
}

function newModelCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  var options: vscode.InputBoxOptions = {
    title: "Model File Name",
  };
  vscode.window.showInputBox(options).then((input) => {
    var dirs = vscode.workspace.workspaceFolders;
    if (dirs === undefined) {
      vscode.window.showErrorMessage("Workspace folders are undefined");
      return;
    }
    const study = currentState.activeStudy;
    const rootUri = dirs[0].uri;
    vscode.window.showQuickPick(["Tellurium", "MLRules"], { canPickMany: false, title: "Modeling Formalism" }).then((formalism) => {

      logLine("Formalism: " + formalism)
      //TODO: make this adaptive to support tel and mlr
      var cls;
      var file_extension;
      if (formalism == "Tellurium") {
        cls = TelluriumModel;
        file_extension = "tel"
      } else if (formalism == "MLRules") {
        cls = MLRulesModel;
        file_extension = "mlr";
      } else {
        return;
      }


      const filename = "model " + input + "." + file_extension;
      const simulationModelUri = vscode.Uri.joinPath(rootUri, filename);
      const simulationModel = new cls(simulationModelUri);
      study!.models.push(simulationModel);
      study!.storeState();
      study!.addEntityEntry(simulationModel);

      askToSelectFilesFor("Research Question", ResearchQuestion).then(
        (result) => {
          const context: any = {};
          context.name = input;
          if (result.length !== 0) {
            context.researchQuestion = result;
          }
          askToSelectFilesFor("Requirements", Requirement).then((result) => {
            if (result.length !== 0) {
              context.requirements = result;
            }
            askToSelectFilesFor("Simulation Model", SimulationModel, false).then((result) => {
              if (result.length !== 0) {
                context.model = result;
              }
              askToSelectFilesFor("References", Reference).then((result) => {
                if (result.length !== 0) {
                  context.references = result;
                }
                askToSelectFilesFor("Assumption", Assumption).then((result) => {
                  if (result.length !== 0) {
                    context.assumptions = result;
                  }
                  postEntityCreation(simulationModel, context);
                });
              });
            });
          });
        });
    });
  });
}


//TODO: Implement proper creation
function newExperimentCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  var options: vscode.InputBoxOptions = {
    title: "Experiment File Name",
  };
  vscode.window.showInputBox(options).then((input) => {
    var dirs = vscode.workspace.workspaceFolders;
    if (dirs === undefined) {
      vscode.window.showErrorMessage("Workspace folders are undefined");
      return;
    }
    const study = currentState.activeStudy;
    const rootUri = dirs[0].uri;
    const filename = "experiment " + input + ".py";
    const simulationExperimentUri = vscode.Uri.joinPath(rootUri, filename);
    const simulationExperiment = new SimulationExperiment(
      simulationExperimentUri
    );
    study!.experiments.push(simulationExperiment);
    study!.storeState();
    simulationExperiment.reportNewEntity();
    study!.addEntityEntry(simulationExperiment);

    askToSelectFilesFor("Simulation Model", SimulationModel, false).then(
      (result) => {
        const context: any = {};
        context.name = input;
        if (result.length !== 0) {
          context.model = result;
        }
        askToSelectFilesFor("Requirements", Requirement).then((result) => {
          if (result.length !== 0) {
            context.requirements = result;
          }
          askToSelectFilesFor("Assumption", Assumption).then((result) => {
            if (result.length !== 0) {
              context.assumptions = result;
            }
            postEntityCreation(simulationExperiment, context);
          });
        });
      }
    );
  });
}

function newReferenceCommand() {
  if (currentState.activeStudy === null) {
    logLine("Study is not loaded");
    return;
  }
  var options: vscode.InputBoxOptions = {
    title: "Reference File Name",
  };
  vscode.window.showInputBox(options).then((input) => {
    var dirs = vscode.workspace.workspaceFolders;
    if (dirs === undefined) {
      vscode.window.showErrorMessage("Workspace folders are undefined");
      return;
    }
    const study = currentState.activeStudy;
    const rootUri = dirs[0].uri;
    const filename = "reference " + input + ".md";
    const referenceUri = vscode.Uri.joinPath(rootUri, filename);
    const reference = new Reference(referenceUri);
    study!.addEntityEntry(reference);
    study!.references.push(reference);
    study!.storeState();

    postEntityCreation(reference, { name: input });
  });
}

export {
  newStudyCommand,
  newResearchQuestionCommand,
  newAssumptionCommand,
  newRequirementCommand,
  newModelCommand,
  newExperimentCommand,
  newReferenceCommand,
};

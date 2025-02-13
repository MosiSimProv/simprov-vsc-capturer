import {Uri} from "vscode";
import * as fs from "fs";
import {logLine} from "./log";
import {createFileIfNotExists, loadEntities, sendEvent,downloadZipFile} from "./utils";
import path = require("path");

class SimulationStudy {
  researchQuestion: any;

  assumptions: any = [];
  requirements: any = [];
  references: any = [];
  models: any = [];
  experiments: any = [];

  baseUri: Uri;
  baseStudyFileUri: Uri;

  entityMap: Map<String, Entity> = new Map();

  constructor(studyUri: Uri) {
    logLine("Study created for uri");
    this.baseUri = studyUri;
    this.baseStudyFileUri = Uri.joinPath(studyUri, ".study");
    logLine("[Study] Study created at base:  " + this.baseUri.path);
  }

  initStudy() {
    createFileIfNotExists(this.baseStudyFileUri.fsPath);
    downloadZipFile("https://github.com/MosiSimProv/simprov-quickstart/archive/refs/heads/main.zip",this.baseUri);
    logLine("[Study] Study init at " + this.baseStudyFileUri.toString());
  }

  storeState() {
    logLine("[Study] Storing state");
    const jsonString = JSON.stringify(this);
    logLine("[Study] JSON STRING: \n" + jsonString);
    fs.writeFileSync(this.baseStudyFileUri.fsPath, jsonString, "utf-8");
  }

  entities() {
    let rv: Entity[] = Array<Entity>().concat(
      this.assumptions,
      this.references,
      this.assumptions,
      this.models,
      this.experiments
    );
    if (this.researchQuestion !== undefined) {
      return [this.researchQuestion].concat(rv);
    }
    return rv;
  }

  addEntityEntry(entity: Entity) {
    this.entityMap.set(entity.fileUri.fsPath, entity);
  }

  lookupEntity(entityUri: Uri) {
    return this.entityMap.get(entityUri.fsPath);
  }

  loadState() {
    logLine("[Study] Loading state");
    const jsonString = fs.readFileSync(this.baseStudyFileUri.fsPath, "utf-8");
    if (jsonString === "") {
      return;
    }
    const studyJson = JSON.parse(jsonString);
    logLine("[Study] JSON STRING: \n" + jsonString);
    if (studyJson.researchQuestion) {
      const researchQuestionFilePath =
        studyJson.researchQuestion.fileUri.fsPath;
      this.researchQuestion = new ResearchQuestion(
        Uri.file(researchQuestionFilePath)
      );
    }
    this.assumptions = loadEntities(Assumption, studyJson.assumptions);
    this.requirements = loadEntities(Requirement, studyJson.requirements);
    this.models = loadEntities(SimulationModel, studyJson.models);
    this.references = loadEntities(Reference, studyJson.references);
    this.experiments = loadEntities(
      SimulationExperiment,
      studyJson.experiments
    );
    this.entities().map((entity: Entity) => {
      this.addEntityEntry(entity);
    });
  }

  incorporateNewFile(fileUri: Uri) {
    let entity;
    for (let possibleEntityType of allEntities) {
      if (possibleEntityType.matchesUri(fileUri)) {
        entity = new possibleEntityType(fileUri);
        switch (entity.constructor.name) {
          case "ResearchQuestion":
            this.researchQuestion = entity;
          case "SimulationExperiment":
            this.experiments.push(entity);
          case "SimulationModel":
            this.models.push(entity);
          case "Assumption":
            this.assumptions.push(entity);
          case "Reference":
            this.references.push(entity);
          case "Requirement":
            this.requirements.push(entity);
        }
        this.addEntityEntry(entity);
        this.storeState();
        return entity;
      }
    }
    return null;
  }
}

class Entity {
  fileUri: Uri;
  static pattern: RegExp;
  static globPattern: String;
  templatePath: string = "";

  constructor(uri: Uri) {
    this.fileUri = uri;
    this.initEntity();
  }

  initEntity() {
    createFileIfNotExists(this.fileUri.fsPath);
    logLine("[Entity] Inited new entity at " + this.fileUri.fsPath);
  }

  reportChange() {
    const eventType = this.constructor.name + " Specified";
    const filePath = this.fileUri.fsPath;
    const content = fs.readFileSync(filePath).toString();
    const event = {type: eventType, filePath: filePath, content: content};
    logLine("[Entity] Send change event\n" + event);
    sendEvent(event);
  }
  reportNewEntity() {
    const eventType = this.constructor.name + " Created";
    const filePath = this.fileUri.fsPath;
    const content = fs.readFileSync(filePath).toString();
    const event = {type: eventType, filePath: filePath, content: content};
    logLine("[Entity] Send new entity event\n" + event);
    sendEvent(event);
  }
}

class ResearchQuestion extends Entity {
  static pattern = /^research question.md/;
  templatePath: string = "research question.md";
  static globPattern = "research question.md";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class Assumption extends Entity {
  static pattern = /^assumption(.|\s)*\.md/;
  templatePath: string = "assumption.md";
  static globPattern = "assumption *.md";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class Requirement extends Entity {
  static pattern = /^requirement(.|\s)*\.md/;
  static globPattern = "requirement *.md";
  templatePath: string = "requirement.md";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class Reference extends Entity {
  static pattern = /^reference(.|\s)*\.md/;
  templatePath: string = "reference.md";
  static globPattern = "reference *.md";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class SimulationExperiment extends Entity {
  static pattern = /^experiment(.|\s)*\.py/;
  static globPattern = "experiment *.md";
  templatePath: string = "simulation experiment.py";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class SimulationModel extends Entity {
  static pattern = /^model(.|\s)*\.(tel|mlr)/;
  templatePath: string = "simulation model.mlr";
  static globPattern = "model *.{mlr,tel}";

  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class MLRulesModel extends SimulationModel {
  static pattern = /^model(.|\s)*\.mlr/;
  templatePath: string = "simulation model.mlr";
  static globPattern = "model *.mlr";


  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

class TelluriumModel extends SimulationModel {
  static pattern = /^model(.|\s)*\.tel/;
  templatePath: string = "simulation model.tel";
  static globPattern = "model *.tel";


  static matchesUri(fileUri: Uri) {
    const baseName = path.basename(fileUri.fsPath);
    return this.pattern.test(baseName);
  }
}

const allEntities = [
  ResearchQuestion,
  Assumption,
  Requirement,
  Reference,
  SimulationExperiment,
  SimulationModel,
  TelluriumModel,
  MLRulesModel
];

export {
  Entity,
  SimulationStudy,
  ResearchQuestion,
  Assumption,
  Requirement,
  Reference,
  SimulationExperiment,
  SimulationModel,
  TelluriumModel,
  MLRulesModel
};

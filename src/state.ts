import { SimulationStudy } from "./entities";

interface State {
  activeStudy: SimulationStudy | null;
}

let currentState: State = {
  activeStudy: null,
};

export { currentState };

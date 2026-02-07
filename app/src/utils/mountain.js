import { getClimberPosition as getNewClimberPos, getLedgePositions as getNewLedgePos, lerp as logicLerp } from './mountainLogic';

export const lerp = logicLerp;

// Delegate to the new logic file
export const getClimberPosition = getNewClimberPos;
export const getLedgePositions = getNewLedgePos;

// Deprecated or unused path getters can be kept empty or return null as we are manually drawing the SVG now
export function getMountainPath() {
  return "";
}
export function getSummitCapPath() {
  return "";
}

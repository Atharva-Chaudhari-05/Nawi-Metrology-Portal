export enum AccuracyClass {
  I = 'I',
  II = 'II',
  III = 'III',
  IIII = 'IIII',
}

/**
 * Calculates the Maximum Permissible Error (MPE) for a Non-Automatic Weighing Instrument (NAWI)
 * based on OIML R-76 recommendations for Type Evaluation / Initial Verification.
 * 
 * @param accuracyClass The accuracy class of the instrument (I, II, III, IIII)
 * @param e The verification scale interval (in the same unit as loadValue)
 * @param loadValue The load applied to the instrument (in the same unit as e)
 * @returns The MPE in the same unit as e and loadValue
 */
export function calculatePermissibleError(
  accuracyClass: AccuracyClass,
  e: number,
  loadValue: number
): number {
  // Convert load to number of scale intervals
  const m = Math.abs(loadValue) / e;

  let mpeInE = 0;

  switch (accuracyClass) {
    case AccuracyClass.I:
      if (m > 0 && m <= 50000) mpeInE = 0.5;
      else if (m > 50000 && m <= 200000) mpeInE = 1.0;
      else if (m > 200000) mpeInE = 1.5;
      break;

    case AccuracyClass.II:
      if (m > 0 && m <= 5000) mpeInE = 0.5;
      else if (m > 5000 && m <= 20000) mpeInE = 1.0;
      else if (m > 20000) mpeInE = 1.5;
      break;

    case AccuracyClass.III:
      if (m > 0 && m <= 500) mpeInE = 0.5;
      else if (m > 500 && m <= 2000) mpeInE = 1.0;
      else if (m > 2000) mpeInE = 1.5;
      break;

    case AccuracyClass.IIII:
      if (m > 0 && m <= 50) mpeInE = 0.5;
      else if (m > 50 && m <= 200) mpeInE = 1.0;
      else if (m > 200) mpeInE = 1.5;
      break;
  }

  // Return the error in actual units
  return mpeInE * e;
}

/**
 * Determines if a given test reading passes the MPE check.
 */
export function isReadingPass(
  accuracyClass: AccuracyClass,
  e: number,
  referenceValue: number,
  indicatedValue: number
): { pass: boolean; error: number; mpe: number } {
  const mpe = calculatePermissibleError(accuracyClass, e, referenceValue);
  const error = Math.abs(indicatedValue - referenceValue);
  
  return {
    pass: error <= mpe,
    error,
    mpe
  };
}

/**
 * Fraction of total ammonia that is present as toxic, un-ionised NH₃ (Emerson et al., 1975):
 * pKa = 0.09018 + 2729.92 / T(K), fraction = 1 / (10^(pKa − pH) + 1).
 * Derived for fresh water; in seawater the fraction is slightly lower, so this errs on the safe side.
 */
export function freeAmmoniaFraction(ph: number, temperatureC: number): number {
  const pKa = 0.09018 + 2729.92 / (temperatureC + 273.15);
  return 1 / (10 ** (pKa - ph) + 1);
}

/** Free NH₃ in mg/L from a total ammonia reading. */
export const freeAmmonia = (total: number, ph: number, temperatureC: number) =>
  total * freeAmmoniaFraction(ph, temperatureC);

/** Free NH₃ (mg/L) from which long-term exposure stresses fish. */
export const FREE_NH3_WARN = 0.02;
/** Free NH₃ (mg/L) from which it is acutely harmful to many fish. */
export const FREE_NH3_BAD = 0.05;

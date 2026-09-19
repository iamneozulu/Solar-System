// Real-world physical data used to build the "to scale" view.
// Distances are proportional to reality and scaled down to fit the
// camera render distance. Planet/moon sizes keep their real ordering
// but are compressed upward so bodies stay visible.

export const PLANET_RADII_KM = {
  Sun: 695700,
  Mercury: 2439.7,
  Venus: 6051.8,
  Earth: 6371,
  Mars: 3389.5,
  Jupiter: 69911,
  Saturn: 58232,
  Uranus: 25362,
  Neptune: 24622,
};

export const PLANET_ORBITS_KM = {
  Mercury: 57909000,
  Venus: 108208000,
  Earth: 149598023,
  Mars: 227939100,
  Jupiter: 778479000,
  Saturn: 1433530000,
  Uranus: 2870660000,
  Neptune: 4495060000,
};

// The scene distance we want Neptune's orbit to occupy so the whole
// system stays within the renderable camera range.
export const TARGET_NEPTUNE_UNITS = 500;

export function unitsPerKm() {
  return TARGET_NEPTUNE_UNITS / PLANET_ORBITS_KM.Neptune;
}

const MIN_RADIUS = 0.08;
const MAX_RADIUS = 1.2;

export function displayRadius(radiusKm) {
  const rMin = PLANET_RADII_KM.Mercury;
  const rMax = PLANET_RADII_KM.Sun;
  const n = Math.max(0, (radiusKm - rMin) / (rMax - rMin));
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(n);
}

// Real moon size / orbit as a ratio of the host planet's radius.
export const MOON_RATIOS = {
  Moon:     { size: 1737 / 6371,      orb: 384400 / 6371 },
  Phobos:   { size: 11.27 / 3389.5,   orb: 9376 / 3389.5 },
  Deimos:   { size: 6.2 / 3389.5,     orb: 23463 / 3389.5 },
  Io:       { size: 1821 / 69911,     orb: 421800 / 69911 },
  Europa:   { size: 1561 / 69911,     orb: 671100 / 69911 },
  Ganymede: { size: 2634 / 69911,     orb: 1070400 / 69911 },
  Callisto: { size: 2410 / 69911,     orb: 1882700 / 69911 },
  Mimas:    { size: 198 / 58232,      orb: 185540 / 58232 },
  Enceladus:{ size: 252 / 58232,      orb: 238040 / 58232 },
  Tethys:   { size: 531 / 58232,      orb: 294670 / 58232 },
  Dione:    { size: 561 / 58232,      orb: 377420 / 58232 },
  Rhea:     { size: 764 / 58232,      orb: 527110 / 58232 },
  Titan:    { size: 2575 / 58232,     orb: 1221870 / 58232 },
  Iapetus:  { size: 735 / 58232,      orb: 3561300 / 58232 },
  Miranda:  { size: 236 / 25362,      orb: 129900 / 25362 },
  Ariel:    { size: 579 / 25362,      orb: 190900 / 25362 },
  Umbriel:  { size: 585 / 25362,      orb: 266000 / 25362 },
  Titania:  { size: 789 / 25362,      orb: 436300 / 25362 },
  Oberon:   { size: 761 / 25362,      orb: 583500 / 25362 },
  Triton:   { size: 1353 / 24622,     orb: 354759 / 24622 },
  Nereid:   { size: 170 / 24622,      orb: 5513400 / 24622 },
};

// Earth's Moon, shown in the main solar system view.
export const MAIN_MOON_KM = { size: 1737, orb: 384400 };

export const AU_KM = 149597870.7;
export const BELT_AU = { inner: 2.2, outer: 3.3 };
export const KUIPER_BELT_AU = { inner: 30, outer: 50 };
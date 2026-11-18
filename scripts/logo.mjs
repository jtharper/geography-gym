// The GeoGym logo: a gold medal with a globe on it, on a dark rounded square (64×64 units).
const globe = (cx, cy, r, c, w) => `<circle cx="${cx}" cy="${cy}" r="${r - w / 2}" fill="none" stroke="${c}" stroke-width="${w}"/><path d="M${cx - r} ${cy}H${cx + r}" stroke="${c}" stroke-width="${w}"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 0.42}" ry="${r - w / 2}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
export const MARK = `<path d="M19 7h9.5l6 17h-9.5z" fill="#2f6bff"/><path d="M45 7h-9.5l-6 17h9.5z" fill="#ff5a5f"/><circle cx="32" cy="39" r="17" fill="#ffb800"/>${globe(32, 39, 12, '#15171c', 2.6)}`;
// rounded: the site logo and favicon. square: home-screen icons (phones round the corners themselves)
export const logoSVG = ({ rounded = true, size = 64 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64"${rounded ? ' rx="15"' : ''} fill="#15171c"/>${MARK}</svg>`;

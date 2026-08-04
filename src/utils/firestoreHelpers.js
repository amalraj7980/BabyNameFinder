/** Strip undefined / null so Firestore writes never fail */
export const stripUndefined = data => {
  const clean = {};
  Object.keys(data || {}).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      clean[key] = data[key];
    }
  });
  return clean;
};

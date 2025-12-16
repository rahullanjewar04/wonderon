/**
 * Recursively calculates the difference between two objects.
 *
 * This function takes two objects and returns an object containing the differences
 * between the two input objects. The differences are returned in the form of
 * `old` and `new` properties.
 *
 * @param {any} obj1 - The first object to compare.
 * @param {any} obj2 - The second object to compare.
 * @param {string} [path] - The path to the current location in the objects.
 * @returns {object} An object containing the differences between the two input objects.
 */
export function deepDiffRight(obj1: any, obj2: any, path = '') {
  /**
   * If the two objects are equal, return an empty object.
   */
  if (obj1 === obj2) return {};

  const type1 = Array.isArray(obj1) ? 'array' : typeof obj1;
  const type2 = Array.isArray(obj2) ? 'array' : typeof obj2;

  /**
   * If the types don't match, or either object is null, return the difference
   */
  if (type1 !== type2 || obj1 == null || obj2 == null) {
    return path ? { [path]: { old: obj1, new: obj2 } } : {};
  }

  /**
   * If the type isn't an object or an array, return the difference
   */
  if (type1 !== 'object' && type1 !== 'array') {
    return path ? { [path]: { old: obj1, new: obj2 } } : {};
  }

  const result: Record<string, any> = {};

  /**
   * Check REMOVED items (old has, new doesn't)
   */
  Object.keys(obj1).forEach((key) => {
    if (!(key in obj2)) {
      const keyPath = path ? `${path}.${key}` : key;
      result[keyPath] = { old: obj1[key], new: undefined };
    }
  });

  /**
   * Check NEW/CHANGED items (from previous version)
   */
  Object.keys(obj2).forEach((key) => {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in obj1)) {
      result[keyPath] = { old: undefined, new: obj2[key] };
    } else {
      const diff = deepDiffRight(obj1[key], obj2[key], keyPath);
      Object.assign(result, diff);
    }
  });

  return result;
}

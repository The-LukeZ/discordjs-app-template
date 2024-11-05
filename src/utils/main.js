/**
 * Parses a custom ID string.
 *
 * The separator is `/`.
 * 
 * @param {string} customId - The custom ID string to parse.
 * @param {boolean} [onlyPrefix=false] - Whether to return only the prefix or the full parsed object.
 * @returns {string | Object} Either the prefix string or an object with parsed components.
 */
function parseCustomId(customId, onlyPrefix = false) {
  if (onlyPrefix) {
    return (
      customId.match(/^(?<prefix>.+?)(\/|\?)/i)?.groups?.prefix || customId
    );
  }

  const [path, params] = customId.split("?");
  const pathParts = path.split("/");
  
  return {
    compPath: pathParts,
    prefix: pathParts[0],
    lastPathItem: pathParts[pathParts.length - 1],
    component: pathParts[1] || null,
    params: params?.split("/") || [],
    firstParam: params?.split("/")[0] || null,
    lastParam: params?.split("/").pop() || null,
  };
}

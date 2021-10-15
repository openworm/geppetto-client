
/**
 *
 * Creates function from string
 *
 * @param body
 */

export function strToFunc (body){
  return new Function('x', 'return ' + body + ';');
}

/**
 *
 * Merge the contents of two or more objects together into the first object.
 *
 * @param obj1
 * @param obj2
 */

export function extend (obj1, obj2){
  Object.assign(obj1, obj2);
  return obj1
}


/**
 *
 * Gets the current coordinates of element relative to the document.
 *
 * @param el
 */


export function offset (el){
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + document.body.scrollTop,
    left: rect.left + document.body.scrollLeft
  }
}


/**
 *
 * Copies the values of all enumerable own and inherited properties from one or more source objects to a target object.
 *
 * @param target
 * @param sources
 */

export function _extend (target, ...sources){
  let source = [];
  sources.forEach(src => {
    source = source.concat([src, Object.getPrototypeOf(src)])
  });
  return Object.assign(target, ...source)
}

/**
 *
 * Converts an array of keys and values to an object.
 *
 * @param array
 */

export function _object (array){
  return array.reduce((result, [key, val]) => Object.assign(result, { [key]: val }), {})
}


/**
 *
 * Produces a duplicate-free version of the array
 *
 * @param array
 */
export function uniq (array) {
  return [...new Set(array)];
}


/**
 *
 * Creates a new array with the results of getting a property for every element in array.
 *
 * @param array
 * @param property
 */
export function pluck (array, property) {
  return array.map(x => x[property])
}

/**
 *
 * Creates a new array with the results of calling a function for every array element.
 *
 * @param array
 * @param func
 */
export function map (array, func) {
  return array.map(x => func(x))
}

/**
 *
 * Creates a new array with all elements that pass the test implemented by the provided function.
 *
 * @param array
 * @param func
 */
export function filter (array, func) {
  return array.filter(x => func(x))
}


/**
 *
 * Sorts a list into groups and returns a count for the number of objects in each group.
 *
 * @param list
 * @param func
 */
export function countBy (list, func){
  let dict = {};
  for (let index in list){
    let key = func(list[index]);
    if (key in dict){
      dict[key]++
    } else {
      dict[key] = 1
    }
  }
  return dict
}


/**
 *
 * Creates the HTML element specified by tagName,
 *
 * @param tagName
 * @param options
 */
export function createElement (tagName, options) {
  let el = document.createElement(tagName, options);
  for (let attr in options){
    if (attr === "text"){
      el.innerHTML += options[attr]
    } else {
      el.setAttribute(attr, options[attr])
    }
  }
  return el
}


/**
 *
 * Insert child to the end of the target
 *
 * @param target
 * @param child
 */
export function appendTo (target, child) {
  target.appendChild(child)
}

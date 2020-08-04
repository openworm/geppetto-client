/* eslint-disable import/prefer-default-export */
export function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

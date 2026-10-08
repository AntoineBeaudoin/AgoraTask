/** @file File containing functions that alter the dom. (Modifies Html and Css elements of a page) */

/**
 * Function to toggle on and off the disabled proprety of a button via it's Id
 * @param buttonId Id of the button to toggle on or off the disabled proprety
 */
export function switchIsButtonActiveById(buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    if (button.disabled) {
      button.disabled = false;
    }
    else {
      button.disabled = true;
    }
  }
}
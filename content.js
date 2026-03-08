// content.js — DocFill Chrome Extension
// pairwise symbol autofill — MVP

console.log("DocFill loaded");

// table of symbols that will be autofilled 
// " was removed — causes scroll issues due to Google Docs canvas behaviour (can revisit later)
const PAIRS = { "(": ")", "[": "]", "{": "}" };

// tells handleKeyDown to ignore events we triggered 
let isInsertingClosing = false;

// all keyboard events in Gdocs are routed through a hidden iframe where we listen for keystrokes 
function findEditorIframe() {
  return document.querySelector("iframe.docs-texteventtarget-iframe");
}

// called everytime a key is pressed inside the iframe 
// dispatch closing character if char in PAIRS, then move cursor in between opening and closing
function handleKeyDown(e) {
  if (isInsertingClosing) return;
  if (!PAIRS[e.key]) return;

  const closing = PAIRS[e.key];
  const iframe = findEditorIframe();
  if (!iframe) return;
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

  setTimeout(() => {
    isInsertingClosing = true;

    // insert closing character
    ["keydown", "keypress", "keyup"].forEach((type) => {
      iframeDoc.dispatchEvent(new KeyboardEvent(type, {
        key: closing,
        charCode: closing.charCodeAt(0),
        keyCode: closing.charCodeAt(0),
        which: closing.charCodeAt(0),
        bubbles: true,
        cancelable: true,
      }));
    });

    // move cursor left to sit between the pair
    ["keydown", "keyup"].forEach((type) => {
      iframeDoc.dispatchEvent(new KeyboardEvent(type, {
        key: "ArrowLeft",
        code: "ArrowLeft",
        keyCode: 37,
        which: 37,
        bubbles: true,
        cancelable: true,
      }));
    });

    setTimeout(() => { isInsertingClosing = false; }, 50);
  }, 10);
}

// retries every second until keyboard iframe is found 
function attachListener() {
  const iframe = findEditorIframe();
  if (iframe) {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.addEventListener("keydown", handleKeyDown, true);
    console.log("DocFill attached!");
  } else {
    console.log("DocFill not ready, retrying...");
    setTimeout(attachListener, 1000);
  }
}

// wait 2s after page load before attempting to give time for Gdocs to render
setTimeout(attachListener, 2000);
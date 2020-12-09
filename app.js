// Imports for webpack to find assets
import './app.css';
import './USAgov.gif';
import './lhncbc.jpg';

var ctssCodeSystemR4 = 'https://clinicaltables.nlm.nih.gov/fhir/R4/CodeSystem';
var hgvsCodeSystemUrl = 'http://varnomen.hgvs.org';
var fhirJsonFormat = "application/fhir+json";


/**
 * Show more/less of the description section in the first half of the page.
 * @param triggerEle the "show more/less" link element
 * @param showHideId the element id of the element to show/hide
 */
export function showMoreOrLess(triggerEle, showHideId, onText, offText) {
  onText = onText || 'Show more...';
  offText = offText || 'Show less...';
  var showHideEle = document.getElementById(showHideId);
  if(window.getComputedStyle(showHideEle).display === 'none') {
    showHideEle.style.display = 'block';
    triggerEle.innerHTML = offText;
  }
  else {
    showHideEle.style.display = 'none';
    triggerEle.innerHTML = onText;
  }
}


export function validateHGVS() {
  var hgvsExpr = (document.getElementById("hgvsInput").value || '').trim();
  var withSPDI = document.getElementById("includeSPDI").checked;

  if(!hgvsExpr) {
    errHandler("Please fill in the HGVS expression and try again.");
    return;
  }
  callCtss('$validate-code', hgvsExpr);
  if(withSPDI) {
    callCtss('$lookup', hgvsExpr);
  }
  else {
    document.getElementById("spdiResultBox").style.display = 'none';
  }
}

/**
 * Make the CTSS call url for the given operation and parameters
 * @param op
 * @param params
 * @return {*}
 */
function makeCtssUrl(op, hgvs) {
  var params = op === '$lookup'?
    {system: hgvsCodeSystemUrl, code: hgvs, _format: fhirJsonFormat}:
    {url: hgvsCodeSystemUrl, code: hgvs, _format: fhirJsonFormat};

  return ctssCodeSystemR4 + '/' + op + '?' +
    Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
}


function callCtss(op, hgvs) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState === 4) {
      var respJson = JSON.parse(this.responseText);
      if(op === '$validate-code') {
        processValidateResponse(respJson, this.status);
      }
      else {
        processLookupResponse(respJson, this.status);
      }
    }
  };
  var url = makeCtssUrl(op, hgvs);
  xhttp.open('GET', url);
  xhttp.send();
}

function processValidateResponse(respJson, statusCode) {
  var vldResultEle = document.getElementById("validationResult");

  if(statusCode === 200) {
    vldResultEle.innerText = respJson.parameter[0].valueBoolean? 'Valid': 'Invalid';
  }
  else if(statusCode < 500) {
    vldResultEle.innerText = getOpOutcomeMsg(respJson) || 'Unknown error occurred';
  }
  else {
    vldResultEle.innerText = 'Internal error occurred'; // don't want to expose too much details
  }
}


/**
 * Get the message (issue.diagnostics or issue.details.text) for the given OperationOutcome resource.
 * @param opOutcome the FHIR OperationOutcome resource object
 * @param defaultMsg the default message to use if no message coming back with the OperationOutcome
 * @return If issue[0].diagnostic is non-empty, that will be returned; if not,
 *         if issue[0].details.text is non-empty, that will be returned; if not,
 *         if the defaultMsg is provided, that will be returned, and if not,
 *         return the empty string.
 */
function getOpOutcomeMsg(respJson, defaultMsg) {
  var issue = respJson.issue && respJson.issue[0];
  return issue && issue.diagnostics || issue && issue.details && issue.details.text || defaultMsg || '';
}


/**
 * Process/display the lookup response.
 * @param respJson the response json
 * @param statusCode the http response status code
 */
function processLookupResponse(respJson, statusCode) {
  var spdiBox = document.getElementById("spdiResultBox");
  var spdiEle = document.getElementById("spdiResult");

  if(statusCode === 200) {
    var spdi = '';
    for(var param of respJson.parameter) {
      if(param.name === 'property') {
        for(let part of param.part) {
          if(part.name === 'value') {
            spdi = spdi || part.valueString;
          }
        }
      }
    }
    spdiEle.innerText = spdi || '(Not available)';
  }
  else if(statusCode < 500) {
    spdiEle.innerText = getOpOutcomeMsg(respJson) || 'Unknown error occurred';
  }
  else {
    spdiEle.innerText = 'Internal error occurred'; // don't want to expose too much details
  }
  spdiBox.style.display = '';  // enable default display behavior
}


/**
 * Just display the given error message or error.
 * @param err an error message string or error object, should not be empty
 */
function errHandler(err) {
  var errMsg = err? (typeof err === 'string'? err: err.message): "Unknown error";
  alert(errMsg);
  console.log(errMsg);
}

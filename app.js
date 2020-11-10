// Imports for webpack to find assets
import './app.css';
import './USAgov.gif';
import './lhncbc.jpg';

var path = require('path');
var csvParse = require('csv-parse');
var transform = require('stream-transform');
var csvStringify = require('csv-stringify');
var str2stream = require('string-to-stream') ;
var validator = require('loinc-mapping-validator').validator;
var getUrlFactory = () => (window.URL || window.webkitURL);
var getInputFileEle = () => document.getElementById("inputFile");

// new columns added to the result file - see README.md for more detils on these fields.
var newColumns = [ 'LMV_UNIT_STATUS', 'LMV_SUBSTITUTED_UNIT', 'LMV_LOINC_STATUS', 'LMV_UNIT_NOTE', 'LMV_LOINC_NOTE'];
var ctssCodeSystemR4 = 'https://clinicaltables.nlm.nih.gov/fhir/R4/CodeSystem';
var hgvsCodeSystemUrl = 'http://varnomen.hgvs.org';
var fhirJsonFormat = "application/fhir+json";

// Example calls:
//   https://clinicaltables.nlm.nih.gov/fhir/R4/CodeSystem/$validate-code?_format=json&code=NC_000001.10:g.12345T%3EA&url=http://varnomen.hgvs.org
//   https://clinicaltables.nlm.nih.gov/fhir/R4/CodeSystem/$lookup?_format=json&code=NC_000001.10:g.12345T%3EA&system=http://varnomen.hgvs.org


/**
 * Show more/less of the description section in the first half of the page.
 * @param triggerEle the "show more/less" link element
 * @param showHideId the element id of the element to show/hide
 */
export function showMoreOrLess(triggerEle, showHideId) {
  var showHideEle = document.getElementById(showHideId);
  if(window.getComputedStyle(showHideEle).display === 'none') {
    showHideEle.style.display = 'block';
    triggerEle.innerHTML = 'Show less...';
  }
  else {
    showHideEle.style.display = 'none';
    triggerEle.innerHTML = 'Show more...';
  }
}


export function validateHGVS() {
  var hgvsExpr = (document.getElementById("hgvsInput").value || '').trim();
  var withSPDI = document.getElementById("includeSPDI").checked;

  if(!hgvsExpr) {
    errHandler("Please fill in the HGVS expression and try again.");
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
  var vldResultBox = document.getElementById("validationResultBox");
  var vldResultEle = document.getElementById("validationResult");

  if(statusCode === 200) {
    vldResultEle.innerText = respJson.parameter[0].valueBoolean? 'Valid': 'Invalid';
  }
  else {
    vldResultEle.innerText = 'Unknown (Error occurred: ' + respJson.issue[0].diagnostics + ')';
  }
  vldResultBox.style.display = '';
}

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
  else {
    spdiEle.innerText = respJson.issue[0].diagnostics || 'Error occurred';
  }
  spdiBox.style.display = '';
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

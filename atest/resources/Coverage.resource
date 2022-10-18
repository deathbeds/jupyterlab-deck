*** Settings ***
Documentation       Keywords for working with browser coverage data

Library             OperatingSystem
Library             JupyterLibrary
Library             uuid


*** Keywords ***
Get Next Coverage File
    [Documentation]    Get a random filename.
    ${uuid} =    UUID1
    RETURN    ${uuid.__str__()}

Capture Page Coverage
    [Documentation]    Fetch coverage data from the browser.
    [Arguments]    ${name}=${EMPTY}
    IF    not '''${name}'''
        ${name} =    Get Next Coverage File
    END
    ${cov_json} =    Execute Javascript    return JSON.stringify(window.__coverage__, null, 2)
    Create File    ${OUTPUT_DIR}${/}__coverage__${/}${name}.json    ${cov_json}

Reset JupyterLab And Close With Coverage
    [Documentation]    Close JupyterLab after gathering coverage.
    Capture Page Coverage
    Reset JupyterLab And Close

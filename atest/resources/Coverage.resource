*** Settings ***
Documentation       Keywords for working with browser coverage data

Library             JupyterLibrary


*** Keywords ***
Get Page Coverage
    [Documentation]    Fetch coverage data from the browser.
    ${cov} =    Execute Javascript    return window.__coverage__
    Log    ${cov}
    RETURN    ${cov}

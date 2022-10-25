*** Settings ***
Documentation       Keywords for working with screenshots

Library             JupyterLibrary


*** Keywords ***
Set Attempt Screenshot Directory
    [Documentation]    Set a screenshot directory that includes the attempt
    [Arguments]    ${path}
    Set Screenshot Directory
    ...    ${OUTPUT_DIR}${/}screenshots${/}${OS.lower()[:2]}_${ATTEMPT}${/}${path}

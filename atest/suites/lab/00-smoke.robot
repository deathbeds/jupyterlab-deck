*** Settings ***
Documentation       JupyterLab is not broken.

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource

Suite Setup         Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}smoke


*** Test Cases ***
JupyterLab Opens
    [Documentation]    JupyterLab opens.
    Open JupyterLab
    Capture Page Screenshot    00-smoke.png

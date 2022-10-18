*** Settings ***
Documentation       Did we break Lab?

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource

Suite Setup         Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}smoke


*** Test Cases ***
JupyterLab Opens
    [Documentation]    Just open JupyterLab.
    Open JupyterLab
    Capture Page Screenshot    00-smoke.png

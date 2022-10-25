*** Settings ***
Documentation       JupyterLab is not broken.

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Screenshots.resource

Suite Setup         Set Attempt Screenshot Directory    lab${/}smoke

Force Tags          suite:smoke


*** Test Cases ***
JupyterLab Opens
    [Documentation]    JupyterLab opens.
    Capture Page Screenshot    00-smoke.png

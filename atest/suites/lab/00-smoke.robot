*** Settings ***
Documentation       Did we break Lab?

Library             JupyterLibrary


*** Test Cases ***
JupyterLab Opens
    [Documentation]    Just open JupyterLab.
    Open JupyterLab
    Capture Page Screenshot    smoke${/}00-smoke.png

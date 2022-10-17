*** Settings ***
Documentation       Did we break Lab?

Library             JupyterLibrary


*** Test Cases ***
A Notebook in JupyterLab
    [Documentation]    Just open JupyterLab.
    Open JupyterLab
    Capture Page Screenshot    smoke${/}00-smoke.png

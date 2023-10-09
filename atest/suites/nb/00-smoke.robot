*** Settings ***
Documentation       Jupyter Notebook is not broken.

Library             JupyterLibrary
Resource            ../../resources/Lab.resource
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Screenshots.resource

Suite Setup         Set Attempt Screenshot Directory    nb${/}smoke

Force Tags          suite:smoke


*** Test Cases ***
Jupyter Notebook Opens
    [Documentation]    Jupyter Notebook opens.
    Capture Page Screenshot    00-smoke.png
    Plugins Should Be Disabled
    ...    @jupyterlab/apputils-extension:notification

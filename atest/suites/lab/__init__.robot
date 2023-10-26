*** Settings ***
Documentation       Tests for JupyterLab.

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Server.resource
Resource            ../../resources/LabSelectors.resource

Suite Setup         Set Up Lab Suite
Suite Teardown      Tear Down Lab Suite

Force Tags          app:lab


*** Keywords ***
Set Up Lab Suite
    [Documentation]    Ensure a testable server is running
    Set Suite Variable    ${JD_APP_UNDER_TEST}    lab    children=${TRUE}
    ${home_dir} =    Initialize Fake Home
    Initialize Jupyter Server    ${home_dir}
    Initialize JupyterLab

Tear Down Lab Suite
    [Documentation]    Do clean up stuff
    Maybe Accept A JupyterLab Prompt
    Maybe Open JupyterLab Sidebar    File Browser
    Maybe Accept A JupyterLab Prompt
    Click Element    css:${CSS_LAB_FILES_HOME}
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels
    Reset JupyterLab And Close With Coverage

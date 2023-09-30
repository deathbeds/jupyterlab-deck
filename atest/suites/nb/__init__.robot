*** Settings ***
Documentation       Tests for Notebook.

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Notebook.resource
Resource            ../../resources/Server.resource
Resource            ../../resources/LabSelectors.resource

Suite Setup         Set Up Notebook Suite
Suite Teardown      Tear Down Notebook Suite

Force Tags          app:nb


*** Keywords ***
Set Up Notebook Suite
    [Documentation]    Ensure a testable server is running
    ${home_dir} =    Initialize Fake Home
    Initialize Jupyter Server    ${home_dir}
    Initialize Jupyter Notebook

Tear Down Notebook Suite
    [Documentation]    Do clean up stuff
    Maybe Accept A JupyterLab Prompt
    Execute JupyterLab Command    Shut Down All Kernels
    Capture Page Coverage

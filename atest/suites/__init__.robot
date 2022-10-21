*** Settings ***
Documentation       Global test configuration.

Library             JupyterLibrary

Suite Setup         Set Up Root Suite

Force Tags          attempt:${attempt}    os:${os}    py:${py}


*** Keywords ***
Set Up Root Suite
    [Documentation]    Do global suite setup.
    Log    Nothing to do here yet

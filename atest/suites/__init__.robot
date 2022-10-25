*** Settings ***
Documentation       Global test configuration.

Library             Process
Library             JupyterLibrary
Resource            ../resources/Screenshots.resource

Suite Setup         Set Up Root Suite
Suite Teardown      Tear Down Root Suite

Force Tags          attempt:${attempt}    os:${os}    py:${py}


*** Keywords ***
Set Up Root Suite
    [Documentation]    Do global suite setup.
    Set Attempt Screenshot Directory    ${EMPTY}

Tear Down Root Suite
    [Documentation]    Do global suite teardown.
    Close All Browsers
    Terminate All Processes

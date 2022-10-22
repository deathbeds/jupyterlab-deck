*** Settings ***
Documentation       Global test configuration.

Library             JupyterLibrary
Resource            ../resources/Screenshots.resource

Suite Setup         Set Up Root Suite

Force Tags          attempt:${attempt}    os:${os}    py:${py}


*** Keywords ***
Set Up Root Suite
    [Documentation]    Do global suite setup.
    Set Attempt Screenshot Directory    ${EMPTY}

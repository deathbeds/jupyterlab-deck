*** Settings ***
Documentation       Building a deck interactively is fun.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource

Suite Setup         Set Up Interactive Suite
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:interactive


*** Test Cases ***
Build a Notebook Deck
    [Documentation]    Build each kind of slide component.
    Start Notebook Deck
    Click Element    css:${JLAB CSS ACTIVE CELL}
    Make Markdown Cell    \# Hello World    new=${FALSE}
    Make Markdown Cell    - item1234
    Capture Page Screenshot    s0-00-as-written.png
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Back Up Deck With Keyboard And Screenshot    s0-01-backup.png    World
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Advance Deck With Keyboard And Screenshot    s0-02-advance.png    item1234


*** Keywords ***
Start Notebook Deck
    [Documentation]    Start an empty deck
    Launch A New JupyterLab Document
    Wait Until JupyterLab Kernel Is Idle
    Start Deck With Notebook Toolbar Button

Set Up Interactive Suite
    [Documentation]    Prepare for this suite.
    Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}interactive
    Open JupyterLab
    Disable JupyterLab Modal Command Palette
    Reload Page
    Maybe Wait For JupyterLab Splash Screen

Tear Down Interactive Suite
    [Documentation]    Clean up after this suite.
    Execute JupyterLab Command    Close All Tabs
    Reset JupyterLab And Close With Coverage

Reset Interactive Test
    [Documentation]    Clean up after each test.
    Remove File    Untitled.ipynb
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels

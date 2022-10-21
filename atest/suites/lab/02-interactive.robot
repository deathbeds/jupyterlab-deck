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
    Make Markdown Cell    \# Hello World    Hello World    new=${FALSE}    screenshot=s0-00-hello.png
    Make Markdown Cell    - item1234    item1234    screenshot=s0-01-1234.png
    Make Markdown Cell    - item4567    item4567    screenshot=s0-02-4567.png
    Really Back Up Deck With Keyboard    s0-03-backup.png    item1234
    Really Back Up Deck With Keyboard    s0-04-backup.png    World
    Really Advance Deck With Keyboard    s0-05-advance.png    item1234
    Really Advance Deck With Keyboard    s0-06-advance.png    item4567


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
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Save Notebook
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels

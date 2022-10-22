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
Build and Navigate a Notebook Slide
    [Documentation]    Build a basic slide.
    Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}interactive${/}slide
    Start Basic Notebook Deck
    Really Back Up Deck With Keyboard    s0-03-backup.png    item1234
    Really Back Up Deck With Keyboard    s0-04-backup.png    World
    Really Advance Deck With Keyboard    s0-05-advance.png    item1234
    Really Advance Deck With Keyboard    s0-06-advance.png    item4567

Build A Slide With Layers
    [Documentation]    Use the metadata sidebar to work with layers.
    Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}interactive${/}layers
    Start Basic Notebook Deck
    Make Markdown Cell    - item91011    item91011    screenshot=s0-03-91011.png
    Make Markdown Cell    - item121314    item121314    screenshot=s0-04-121314.png
    Make Cell Layer    2    deck    s0-05-deck.png
    Make Cell Layer    3    stack    s0-06-stack.png
    Make Cell Layer    4    slide    s0-07-slide.png
    Make Cell Layer    4    -    s0-08-null.png
    Make Cell Layer    5    fragment    s0-09-fragment.png


*** Keywords ***
Start Empty Notebook Deck
    [Documentation]    Start an empty deck
    Launch A New JupyterLab Document
    Wait Until JupyterLab Kernel Is Idle
    Really Start Deck With Notebook Toolbar Button

Start Basic Notebook Deck
    [Documentation]    Make a few cells
    Start Empty Notebook Deck
    Click Element    css:${JLAB CSS ACTIVE CELL}
    Make Markdown Cell    \# Hello World    Hello World    new=${FALSE}    screenshot=s0-00-hello.png
    Make Markdown Cell    - item1234    item1234    screenshot=s0-01-1234.png
    Make Markdown Cell    - item4567    item4567    screenshot=s0-02-4567.png

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
    ${nbdir} =    Get Jupyter Directory
    Remove File    Untitled.ipynb
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels
